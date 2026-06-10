using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Mazaya.Rga.Api.Auth;
using Mazaya.Rga.Api.Data;
using Mazaya.Rga.Api.Models;

namespace Mazaya.Rga.Api.Controllers;

[ApiController]
[Route("api/users")]
[Authorize]
public class UsersController : ControllerBase
{
    private readonly RgaDbContext _db;
    private readonly CurrentUserService _current;
    public UsersController(RgaDbContext db, CurrentUserService current)
    {
        _db = db; _current = current;
    }

    // List all users — Mazaya staff only (the Admin Panel).
    [HttpGet]
    public async Task<IActionResult> List()
    {
        var me = await _current.ResolveAsync(User);
        if (me == null) return Unauthorized();
        if (me.Org != "mazaya") return StatusCode(403, new { error = "Mazaya staff only" });
        return Ok(await _db.Users.OrderBy(u => u.Org).ThenBy(u => u.Name).ToListAsync());
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] User input)
    {
        if (!await IsAdmin()) return StatusCode(403, new { error = "Admin only" });
        input.Id = Guid.NewGuid();
        input.Email = input.Email.Trim().ToLowerInvariant();
        _db.Users.Add(input);
        await _db.SaveChangesAsync();
        return Ok(input);
    }

    // Update a user's role, status, scope, or privilege overrides.
    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] User input)
    {
        if (!await IsAdmin()) return StatusCode(403, new { error = "Admin only" });
        var u = await _db.Users.FindAsync(id);
        if (u == null) return NotFound();
        u.Name = input.Name; u.UserType = input.UserType; u.Org = input.Org;
        u.CustomerId = input.CustomerId; u.JobTitle = input.JobTitle;
        u.Status = input.Status; u.WorkstreamScope = input.WorkstreamScope;
        u.CustomPrivs = input.CustomPrivs;
        await _db.SaveChangesAsync();
        return Ok(u);
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        if (!await IsAdmin()) return StatusCode(403, new { error = "Admin only" });
        var u = await _db.Users.FindAsync(id);
        if (u == null) return NotFound();
        _db.Users.Remove(u);
        await _db.SaveChangesAsync();
        return NoContent();
    }

    private async Task<bool> IsAdmin()
    {
        var me = await _current.ResolveAsync(User);
        return me?.UserType == "mazaya_admin";
    }
}
