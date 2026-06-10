using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Mazaya.Rga.Api.Auth;
using Mazaya.Rga.Api.Data;
using Mazaya.Rga.Api.Models;

namespace Mazaya.Rga.Api.Controllers;

[ApiController]
[Route("api/projects/{projectId:guid}/change-requests")]
[Authorize]
public class ChangeRequestsController : ControllerBase
{
    private readonly RgaDbContext _db;
    private readonly CurrentUserService _current;
    private readonly AccessGuard _guard;
    public ChangeRequestsController(RgaDbContext db, CurrentUserService current, AccessGuard guard)
    {
        _db = db; _current = current; _guard = guard;
    }

    // Verify the caller may act on this project's customer.
    private async Task<(bool ok, IActionResult? deny, Mazaya.Rga.Api.Models.User? me)> CheckAsync(Guid projectId)
    {
        var me = await _current.ResolveAsync(User);
        if (me == null) return (false, Unauthorized(), null);
        if (!await _guard.CanAccessProjectAsync(me, projectId))
            return (false, StatusCode(403, new { error = "Not your project" }), null);
        return (true, null, me);
    }

    [HttpGet]
    public async Task<IActionResult> List(Guid projectId)
    {
        var (ok, deny, _) = await CheckAsync(projectId);
        if (!ok) return deny!;
        return Ok(await _db.ChangeRequests
            .Where(c => c.ProjectId == projectId)
            .Include(c => c.Approvals)
            .OrderBy(c => c.CreatedAt)
            .ToListAsync());
    }

    // Create a CR (draft) and build its approval chain:
    //   1 Mazaya PM -> 2 Customer PM -> 3 Steering Committee (only if high impact)
    [HttpPost]
    public async Task<IActionResult> Create(Guid projectId, [FromBody] ChangeRequest input)
    {
        var (ok, deny, _) = await CheckAsync(projectId);
        if (!ok) return deny!;
        input.Id = Guid.NewGuid();
        input.ProjectId = projectId;
        input.Status = "draft";

        var count = await _db.ChangeRequests.CountAsync(c => c.ProjectId == projectId);
        input.CrNumber = $"CR-{(count + 1):D3}";

        var needsSteering = input.CostImpact == "high" || input.ScheduleImpact == "high";
        var chain = new List<ChangeRequestApproval>
        {
            new() { Id = Guid.NewGuid(), CrId = input.Id, StepOrder = 1, RoleLabel = "Mazaya PM" },
            new() { Id = Guid.NewGuid(), CrId = input.Id, StepOrder = 2, RoleLabel = "Customer PM" },
        };
        if (needsSteering)
            chain.Add(new() { Id = Guid.NewGuid(), CrId = input.Id, StepOrder = 3, RoleLabel = "Steering Committee" });

        input.Approvals = chain;
        _db.ChangeRequests.Add(input);
        await _db.SaveChangesAsync();
        return Ok(input);
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid projectId, Guid id, [FromBody] ChangeRequest input)
    {
        var (ok, deny, _) = await CheckAsync(projectId);
        if (!ok) return deny!;
        var cr = await _db.ChangeRequests.FindAsync(id);
        if (cr == null) return NotFound();
        cr.Title = input.Title; cr.Description = input.Description;
        cr.Reason = input.Reason; cr.Workstream = input.Workstream;
        cr.CostImpact = input.CostImpact; cr.ScheduleImpact = input.ScheduleImpact;
        cr.ScopeImpact = input.ScopeImpact; cr.EstimatedDays = input.EstimatedDays;
        await _db.SaveChangesAsync();
        return Ok(cr);
    }

    // Submit a draft for approval.
    [HttpPost("{id:guid}/submit")]
    public async Task<IActionResult> Submit(Guid projectId, Guid id)
    {
        var (ok, deny, _) = await CheckAsync(projectId);
        if (!ok) return deny!;
        var cr = await _db.ChangeRequests.FindAsync(id);
        if (cr == null) return NotFound();
        if (cr.Status != "draft") return BadRequest(new { error = "Only a draft can be submitted" });
        cr.Status = "in_review";
        await _db.SaveChangesAsync();
        return Ok(cr);
    }

    // Approve or reject the current step. Enforces sequential order: only the
    // first pending step can be acted on, and only by the role that owns it.
    public record DecisionInput(short StepOrder, string Decision, string? Comment);

    [HttpPost("{id:guid}/decide")]
    public async Task<IActionResult> Decide(Guid projectId, Guid id, [FromBody] DecisionInput body)
    {
        var (ok, deny, me) = await CheckAsync(projectId);
        if (!ok) return deny!;
        var cr = await _db.ChangeRequests.Include(c => c.Approvals)
            .FirstOrDefaultAsync(c => c.Id == id);
        if (cr == null) return NotFound();
        if (cr.Status != "in_review")
            return BadRequest(new { error = "CR is not awaiting approval" });

        var ordered = cr.Approvals.OrderBy(a => a.StepOrder).ToList();
        var current = ordered.FirstOrDefault(a => a.Decision == "pending");
        if (current == null) return BadRequest(new { error = "No pending step" });
        if (current.StepOrder != body.StepOrder)
            return BadRequest(new { error = $"Step {current.StepOrder} must be decided first" });

        if (!CanActOn(me!, current.RoleLabel))
            return StatusCode(403, new { error = $"Your role cannot approve the {current.RoleLabel} step" });

        if (body.Decision != "approved" && body.Decision != "rejected")
            return BadRequest(new { error = "Decision must be 'approved' or 'rejected'" });

        current.Decision = body.Decision;
        current.Comment = body.Comment;
        current.ApproverId = me!.Id;
        current.ApproverName = me!.Name;
        current.DecidedAt = DateTime.UtcNow;

        if (body.Decision == "rejected")
            cr.Status = "rejected";
        else if (ordered.All(a => a.Decision == "approved"))
            cr.Status = "approved";
        // else remains in_review for the next step

        await _db.SaveChangesAsync();
        return Ok(cr);
    }

    [HttpPost("{id:guid}/implement")]
    public async Task<IActionResult> Implement(Guid projectId, Guid id)
    {
        var (ok, deny, _) = await CheckAsync(projectId);
        if (!ok) return deny!;
        var cr = await _db.ChangeRequests.FindAsync(id);
        if (cr == null) return NotFound();
        if (cr.Status != "approved") return BadRequest(new { error = "Only an approved CR can be implemented" });
        cr.Status = "implemented";
        await _db.SaveChangesAsync();
        return Ok(cr);
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid projectId, Guid id)
    {
        var (ok, deny, _) = await CheckAsync(projectId);
        if (!ok) return deny!;
        var cr = await _db.ChangeRequests.FindAsync(id);
        if (cr == null) return NotFound();
        if (cr.Status != "draft" && cr.Status != "rejected")
            return BadRequest(new { error = "Only draft or rejected CRs can be deleted" });
        _db.ChangeRequests.Remove(cr);
        await _db.SaveChangesAsync();
        return NoContent();
    }

    // Map portal roles to the chain step they may action.
    private static bool CanActOn(User u, string roleLabel)
    {
        if (u.UserType == "mazaya_admin") return true;            // admin can action any step
        return roleLabel switch
        {
            "Mazaya PM"          => u.UserType is "mazaya_pm" or "mazaya_consultant",
            "Customer PM"        => u.UserType == "customer_pm",
            "Steering Committee" => u.UserType is "mazaya_admin" or "mazaya_pm",
            _ => false,
        };
    }
}
