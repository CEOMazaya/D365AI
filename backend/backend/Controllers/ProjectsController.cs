using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Mazaya.Rga.Api.Auth;
using Mazaya.Rga.Api.Data;
using Mazaya.Rga.Api.Models;

namespace Mazaya.Rga.Api.Controllers;

[ApiController]
[Route("api")]
[Authorize]
public class ProjectsController : ControllerBase
{
    private readonly RgaDbContext _db;
    private readonly CurrentUserService _current;
    private readonly AccessGuard _guard;
    public ProjectsController(RgaDbContext db, CurrentUserService current, AccessGuard guard)
    {
        _db = db; _current = current; _guard = guard;
    }

    // Projects for a customer — caller must be allowed to see that customer.
    [HttpGet("customers/{customerId:guid}/projects")]
    public async Task<IActionResult> ListForCustomer(Guid customerId)
    {
        var me = await _current.ResolveAsync(User);
        if (me == null) return Unauthorized();
        if (!_guard.CanAccessCustomer(me, customerId)) return StatusCode(403, new { error = "Not your customer" });
        return Ok(await _db.Projects.Where(p => p.CustomerId == customerId)
            .OrderByDescending(p => p.CreatedAt).ToListAsync());
    }

    // One project with all child collections — access checked via its owner.
    [HttpGet("projects/{id:guid}")]
    public async Task<IActionResult> Get(Guid id)
    {
        var me = await _current.ResolveAsync(User);
        if (me == null) return Unauthorized();
        if (!await _guard.CanAccessProjectAsync(me, id)) return StatusCode(403, new { error = "Not your project" });
        var p = await _db.Projects
            .Include(x => x.Questionnaire)
            .Include(x => x.DataItems)
            .Include(x => x.Sessions)
            .Include(x => x.Moms)
            .Include(x => x.Escalations)
            .Include(x => x.Risks)
            .Include(x => x.Issues)
            .Include(x => x.ChangeRequests).ThenInclude(c => c.Approvals)
            .FirstOrDefaultAsync(x => x.Id == id);
        return p == null ? NotFound() : Ok(p);
    }

    // Creating projects is a Mazaya function.
    [HttpPost("customers/{customerId:guid}/projects")]
    public async Task<IActionResult> Create(Guid customerId, [FromBody] Project input)
    {
        var me = await _current.ResolveAsync(User);
        if (me == null) return Unauthorized();
        if (!_guard.IsActiveMazaya(me)) return StatusCode(403, new { error = "Mazaya staff only" });
        input.Id = Guid.NewGuid();
        input.CustomerId = customerId;
        _db.Projects.Add(input);
        await _db.SaveChangesAsync();
        return CreatedAtAction(nameof(Get), new { id = input.Id }, input);
    }

    [HttpPut("projects/{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] Project input)
    {
        var me = await _current.ResolveAsync(User);
        if (me == null) return Unauthorized();
        if (!await _guard.CanAccessProjectAsync(me, id)) return StatusCode(403, new { error = "Not your project" });
        var p = await _db.Projects.FindAsync(id);
        if (p == null) return NotFound();
        p.Name = input.Name; p.Status = input.Status;
        p.SelectedWorkstreams = input.SelectedWorkstreams;
        p.D365ProjectId = input.D365ProjectId; p.MazayaPm = input.MazayaPm;
        p.StartDate = input.StartDate; p.GoLiveDate = input.GoLiveDate;
        await _db.SaveChangesAsync();
        return Ok(p);
    }
}
