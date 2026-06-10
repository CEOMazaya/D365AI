using System.Text.Json;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Mazaya.Rga.Api.Auth;
using Mazaya.Rga.Api.Data;
using Mazaya.Rga.Api.Models;

namespace Mazaya.Rga.Api.Controllers;

// ── Portal data bridge, relational-backed and per-customer scoped ───────────
//
// The React portal talks to a tiny document store via window.storage.get/set
// on three keys:
//   mz_usr_v1  → the users map { id: user }
//   mz_db_v1   → { customers: { id: { ...customer, projects: { id: project } } } }
//   mz_ses_v1  → the current session pointer (per browser; stays client-side)
//
// This controller serves the first two FROM THE RELATIONAL TABLES, scoped to the
// signed-in user so isolation is enforced on the SERVER (choice (ii)):
//   * Mazaya staff  → see all users and all customers/projects.
//   * Customer user → see only their own customer's users and their own customer
//                     node (with its projects). Another customer's data is never
//                     returned, regardless of what the client asks for.
//   * pending/inactive → see nothing.
//
// The portal's bulk document is persisted per-customer in state_documents under
// key  mz_db_v1::<customerId>  (one document per customer). On read we compose
// the { customers: {...} } envelope from the customer rows the caller may see,
// merging in each customer's stored project document. On write we split the
// incoming envelope back out per-customer, writing only customers the caller is
// allowed to touch. This keeps the portal's data shape intact while making the
// customers table the authority for *which* customers exist and who owns them.
[ApiController]
[Route("api/portal")]
[Authorize]
public class PortalDataController : ControllerBase
{
    private readonly RgaDbContext _db;
    private readonly CurrentUserService _current;
    private readonly AccessGuard _guard;
    public PortalDataController(RgaDbContext db, CurrentUserService current, AccessGuard guard)
    {
        _db = db; _current = current; _guard = guard;
    }

    private static readonly JsonSerializerOptions J = new() { PropertyNamingPolicy = null };

    // ── USERS ───────────────────────────────────────────────────────────────
    // GET /api/portal/users → { id: { portal user shape } }, scoped.
    [HttpGet("users")]
    public async Task<IActionResult> GetUsers()
    {
        var me = await _current.ResolveAsync(User);
        if (me == null) return Unauthorized();
        if (me.Status != "active") return Ok(new Dictionary<string, object>());

        IQueryable<User> q = _db.Users;
        if (me.Org != "mazaya") q = q.Where(u => u.CustomerId == me.CustomerId);

        var rows = await q.ToListAsync();
        var map = new Dictionary<string, object>();
        foreach (var u in rows) map[u.Id.ToString()] = ToPortalUser(u);
        return Ok(map);
    }

    // PUT /api/portal/users  body: { id: { portal user } } — Mazaya only.
    // Customer admins managing their own users can be enabled later; for now
    // user provisioning is a Mazaya function.
    [HttpPut("users")]
    public async Task<IActionResult> PutUsers([FromBody] JsonElement body)
    {
        var me = await _current.ResolveAsync(User);
        if (me == null) return Unauthorized();
        if (!_guard.IsActiveMazaya(me)) return StatusCode(403, new { error = "Mazaya staff only" });

        foreach (var prop in body.EnumerateObject())
        {
            var el = prop.Value;
            var email = GetStr(el, "email");
            if (string.IsNullOrWhiteSpace(email)) continue;
            email = email.Trim().ToLowerInvariant();

            var existing = await _db.Users.FirstOrDefaultAsync(u => u.Email.ToLower() == email);
            if (existing == null)
            {
                existing = new User { Id = Guid.NewGuid(), Email = email };
                _db.Users.Add(existing);
            }
            existing.Name = GetStr(el, "name") ?? existing.Name;
            existing.UserType = GetStr(el, "user_type") ?? existing.UserType;
            existing.Org = GetStr(el, "org") ?? existing.Org;
            existing.JobTitle = GetStr(el, "job_title") ?? existing.JobTitle;
            existing.Status = GetStr(el, "status") ?? existing.Status;
            var cid = GetStr(el, "customer_id");
            existing.CustomerId = Guid.TryParse(cid, out var g) ? g : existing.CustomerId;
            var ws = GetStrArray(el, "workstream_scope");
            if (ws != null) existing.WorkstreamScope = ws;
        }
        await _db.SaveChangesAsync();
        return await GetUsers();
    }

    // ── CUSTOMERS / PROJECTS DOCUMENT ────────────────────────────────────────
    // GET /api/portal/db → { customers: { id: { ...customer, projects:{...} } } }
    // scoped to the customers the caller may see.
    [HttpGet("db")]
    public async Task<IActionResult> GetDb()
    {
        var me = await _current.ResolveAsync(User);
        if (me == null) return Unauthorized();
        if (me.Status != "active") return Ok(new { customers = new Dictionary<string, object>() });

        IQueryable<Customer> cq = _db.Customers;
        if (me.Org != "mazaya") cq = cq.Where(c => c.Id == me.CustomerId);
        var customers = await cq.ToListAsync();

        var custMap = new Dictionary<string, JsonElement>();
        foreach (var c in customers)
        {
            var docKey = $"mz_db_v1::{c.Id}";
            var doc = await _db.StateDocuments.FirstOrDefaultAsync(s => s.Key == docKey);
            JsonElement node;
            if (doc != null)
            {
                node = JsonDocument.Parse(doc.Value).RootElement.Clone();
            }
            else
            {
                // No stored document yet — seed a minimal node from the customer row.
                var seed = new Dictionary<string, object?>
                {
                    ["id"] = c.Id.ToString(),
                    ["name"] = c.Name,
                    ["ref"] = c.Ref,
                    ["industry"] = c.Industry,
                    ["country"] = c.Country,
                    ["created_at"] = new DateTimeOffset(c.CreatedAt).ToUnixTimeMilliseconds(),
                    ["projects"] = new Dictionary<string, object>()
                };
                node = JsonSerializer.SerializeToElement(seed, J);
            }
            custMap[c.Id.ToString()] = node;
        }

        // Build { customers: { ... } }
        var envelope = new Dictionary<string, object> { ["customers"] = custMap };
        return Content(JsonSerializer.Serialize(envelope, J), "application/json");
    }

    // PUT /api/portal/db  body: { customers: { id: {...} } }
    // Splits per-customer and writes only customers the caller may touch.
    [HttpPut("db")]
    public async Task<IActionResult> PutDb([FromBody] JsonElement body)
    {
        var me = await _current.ResolveAsync(User);
        if (me == null) return Unauthorized();
        if (me.Status != "active") return StatusCode(403, new { error = "Account inactive" });

        if (!body.TryGetProperty("customers", out var custs) || custs.ValueKind != JsonValueKind.Object)
            return BadRequest(new { error = "Expected { customers: {...} }" });

        foreach (var prop in custs.EnumerateObject())
        {
            if (!Guid.TryParse(prop.Name, out var custId)) continue;

            // Authorization: customer users may only write their own customer.
            if (me.Org != "mazaya" && custId != me.CustomerId)
                continue; // silently skip — never touch another customer's data

            var node = prop.Value;

            // Ensure the customers table has the row (Mazaya can create new ones).
            var row = await _db.Customers.FirstOrDefaultAsync(c => c.Id == custId);
            if (row == null)
            {
                if (me.Org != "mazaya") continue; // customers can't create customers
                row = new Customer { Id = custId, CreatedBy = me.Id };
                _db.Customers.Add(row);
            }
            row.Name = GetStr(node, "name") ?? row.Name;
            row.Ref = GetStr(node, "ref") ?? row.Ref;
            row.Industry = GetStr(node, "industry") ?? row.Industry;
            row.Country = GetStr(node, "country") ?? row.Country;

            // Persist the full node (incl. nested projects) as the per-customer doc.
            var docKey = $"mz_db_v1::{custId}";
            var existing = await _db.StateDocuments.FirstOrDefaultAsync(s => s.Key == docKey);
            var val = node.GetRawText();
            if (existing == null)
                _db.StateDocuments.Add(new StateDocument { Key = docKey, Value = val });
            else
                existing.Value = val;
        }
        await _db.SaveChangesAsync();
        return await GetDb();
    }

    // ── helpers ───────────────────────────────────────────────────────────────
    private static object ToPortalUser(User u) => new Dictionary<string, object?>
    {
        ["id"] = u.Id.ToString(),
        ["name"] = u.Name,
        ["email"] = u.Email,
        ["user_type"] = u.UserType,
        ["org"] = u.Org,
        ["customer_id"] = u.CustomerId?.ToString(),
        ["workstream_scope"] = u.WorkstreamScope,
        ["status"] = u.Status,
        ["job_title"] = u.JobTitle,
        ["created_at"] = new DateTimeOffset(u.CreatedAt).ToUnixTimeMilliseconds()
    };

    private static string? GetStr(JsonElement e, string name) =>
        e.ValueKind == JsonValueKind.Object && e.TryGetProperty(name, out var v) && v.ValueKind == JsonValueKind.String
            ? v.GetString() : null;

    private static string[]? GetStrArray(JsonElement e, string name)
    {
        if (e.ValueKind != JsonValueKind.Object || !e.TryGetProperty(name, out var v) || v.ValueKind != JsonValueKind.Array)
            return null;
        var list = new List<string>();
        foreach (var item in v.EnumerateArray())
            if (item.ValueKind == JsonValueKind.String) list.Add(item.GetString()!);
        return list.ToArray();
    }
}
