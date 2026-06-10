using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Mazaya.Rga.Api.Auth;
using Mazaya.Rga.Api.Auth;
using Mazaya.Rga.Api.Data;
using Mazaya.Rga.Api.Models;

namespace Mazaya.Rga.Api.Controllers;

// Document store backing the portal's storage API (mz_db_v1, mz_usr_v1, ...).
// One shared server-side copy keyed by the storage key, so Mazaya and the
// customer see the same data. This is the "blob bridge" — simplest path to
// shared data. Migrate to the relational controllers when ready; this stays
// as a fallback/transition aid.
[ApiController]
[Route("api/state")]
[Authorize]
public class StateController : ControllerBase
{
    private readonly RgaDbContext _db;
    private readonly CurrentUserService _current;
    private readonly AccessGuard _guard;
    public StateController(RgaDbContext db, CurrentUserService current, AccessGuard guard)
    {
        _db = db; _current = current; _guard = guard;
    }

    // Gate: the blob bridge stores the WHOLE portal dataset as one document, so
    // it cannot enforce per-customer isolation. With multiple customers it is
    // therefore restricted to Mazaya staff only. For customer-facing multi-tenant
    // use, the relational endpoints (which ARE per-customer scoped) are required.
    private async Task<IActionResult?> MazayaOnlyAsync()
    {
        var me = await _current.ResolveAsync(User);
        if (me == null) return Unauthorized();
        if (!_guard.IsActiveMazaya(me)) return StatusCode(403, new { error = "Blob state store is Mazaya-only; use the relational API for customer access" });
        return null;
    }

    public record StateBody(string value);

    [HttpGet("{key}")]
    public async Task<IActionResult> Get(string key)
    {
        var deny = await MazayaOnlyAsync(); if (deny != null) return deny;
        var doc = await _db.StateDocuments.FirstOrDefaultAsync(s => s.Key == key);
        return doc == null ? NotFound() : Ok(new { key, value = doc.Value });
    }

    [HttpGet]
    public async Task<IActionResult> List([FromQuery] string prefix = "")
    {
        var deny = await MazayaOnlyAsync(); if (deny != null) return deny;
        var keys = await _db.StateDocuments
            .Where(s => s.Key.StartsWith(prefix))
            .Select(s => s.Key)
            .ToListAsync();
        return Ok(new { keys, prefix });
    }

    [HttpPut("{key}")]
    public async Task<IActionResult> Put(string key, [FromBody] StateBody body)
    {
        var deny = await MazayaOnlyAsync(); if (deny != null) return deny;
        var doc = await _db.StateDocuments.FirstOrDefaultAsync(s => s.Key == key);
        if (doc == null)
        {
            doc = new StateDocument { Key = key, Value = body.value };
            _db.StateDocuments.Add(doc);
        }
        else
        {
            doc.Value = body.value;
            doc.UpdatedAt = DateTime.UtcNow;
        }
        await _db.SaveChangesAsync();
        return Ok(new { key, value = doc.Value });
    }

    [HttpDelete("{key}")]
    public async Task<IActionResult> Delete(string key)
    {
        var deny = await MazayaOnlyAsync(); if (deny != null) return deny;
        var doc = await _db.StateDocuments.FirstOrDefaultAsync(s => s.Key == key);
        if (doc != null) { _db.StateDocuments.Remove(doc); await _db.SaveChangesAsync(); }
        return NoContent();
    }
}
