using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Mazaya.Rga.Api.Auth;
using Mazaya.Rga.Api.Data;
using Mazaya.Rga.Api.Models;

namespace Mazaya.Rga.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class CustomersController : ControllerBase
{
    private readonly RgaDbContext _db;
    private readonly CurrentUserService _current;
    private readonly AccessGuard _guard;
    public CustomersController(RgaDbContext db, CurrentUserService current, AccessGuard guard)
    {
        _db = db; _current = current; _guard = guard;
    }

    // Mazaya staff see all customers; a customer user sees only their own.
    [HttpGet]
    public async Task<IActionResult> List()
    {
        var me = await _current.ResolveAsync(User);
        if (me == null) return Unauthorized();
        if (me.Status != "active") return Ok(Array.Empty<Customer>());
        var q = _guard.ScopeCustomers(me, _db.Customers).OrderByDescending(c => c.CreatedAt);
        return Ok(await q.ToListAsync());
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> Get(Guid id)
    {
        var me = await _current.ResolveAsync(User);
        if (me == null) return Unauthorized();
        if (!_guard.CanAccessCustomer(me, id)) return StatusCode(403, new { error = "Not your customer" });
        var c = await _db.Customers.FindAsync(id);
        return c == null ? NotFound() : Ok(c);
    }

    // Creating / editing customers is a Mazaya function.
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] Customer input)
    {
        var me = await _current.ResolveAsync(User);
        if (me == null) return Unauthorized();
        if (!_guard.IsActiveMazaya(me)) return StatusCode(403, new { error = "Mazaya staff only" });
        input.Id = Guid.NewGuid();
        _db.Customers.Add(input);
        await _db.SaveChangesAsync();
        return CreatedAtAction(nameof(Get), new { id = input.Id }, input);
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] Customer input)
    {
        var me = await _current.ResolveAsync(User);
        if (me == null) return Unauthorized();
        if (!_guard.IsActiveMazaya(me)) return StatusCode(403, new { error = "Mazaya staff only" });
        var c = await _db.Customers.FindAsync(id);
        if (c == null) return NotFound();
        c.Name = input.Name; c.Ref = input.Ref;
        c.Industry = input.Industry; c.Country = input.Country;
        await _db.SaveChangesAsync();
        return Ok(c);
    }

    // ── Customer email domains (multi-tenant onboarding) — Mazaya only ──────────
    [HttpGet("{id:guid}/domains")]
    public async Task<IActionResult> ListDomains(Guid id)
    {
        var me = await _current.ResolveAsync(User);
        if (me == null) return Unauthorized();
        if (!_guard.CanAccessCustomer(me, id)) return StatusCode(403, new { error = "Not your customer" });
        return Ok(await _db.CustomerDomains.Where(d => d.CustomerId == id).ToListAsync());
    }

    public record DomainInput(string Domain);

    [HttpPost("{id:guid}/domains")]
    public async Task<IActionResult> AddDomain(Guid id, [FromBody] DomainInput body)
    {
        var me = await _current.ResolveAsync(User);
        if (me == null) return Unauthorized();
        if (!_guard.IsActiveMazaya(me)) return StatusCode(403, new { error = "Mazaya staff only" });
        var domain = body.Domain.Trim().ToLowerInvariant();
        if (string.IsNullOrWhiteSpace(domain)) return BadRequest(new { error = "Domain required" });
        var cd = new CustomerDomain { Id = Guid.NewGuid(), CustomerId = id, Domain = domain };
        _db.CustomerDomains.Add(cd);
        await _db.SaveChangesAsync();
        return Ok(cd);
    }

    [HttpDelete("{id:guid}/domains/{domainId:guid}")]
    public async Task<IActionResult> RemoveDomain(Guid id, Guid domainId)
    {
        var me = await _current.ResolveAsync(User);
        if (me == null) return Unauthorized();
        if (!_guard.IsActiveMazaya(me)) return StatusCode(403, new { error = "Mazaya staff only" });
        var cd = await _db.CustomerDomains.FindAsync(domainId);
        if (cd != null) { _db.CustomerDomains.Remove(cd); await _db.SaveChangesAsync(); }
        return NoContent();
    }
}
