using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Mazaya.Rga.Api.Auth;
using Mazaya.Rga.Api.Data;
using Mazaya.Rga.Api.Models;

namespace Mazaya.Rga.Api.Controllers;

// A small generic base for project-scoped child collections. Each concrete
// controller binds one entity type and its route segment. CRUD is identical
// across them, so the logic lives here once.
[ApiController]
[Authorize]
public abstract class ProjectChildController<T> : ControllerBase where T : class, new()
{
    protected readonly RgaDbContext Db;
    protected readonly CurrentUserService Current;
    protected readonly AccessGuard Guard;
    protected ProjectChildController(RgaDbContext db, CurrentUserService current, AccessGuard guard)
    {
        Db = db; Current = current; Guard = guard;
    }

    protected abstract DbSet<T> Set { get; }
    protected abstract Guid GetId(T e);
    protected abstract void SetId(T e, Guid id);
    protected abstract Guid GetProjectId(T e);
    protected abstract void SetProjectId(T e, Guid projectId);

    // Every action first verifies the caller may touch this project's customer.
    private async Task<(bool ok, IActionResult? deny)> CheckAsync(Guid projectId)
    {
        var me = await Current.ResolveAsync(User);
        if (me == null) return (false, Unauthorized());
        if (!await Guard.CanAccessProjectAsync(me, projectId))
            return (false, StatusCode(403, new { error = "Not your project" }));
        return (true, null);
    }

    [HttpGet]
    public async Task<IActionResult> List(Guid projectId)
    {
        var (ok, deny) = await CheckAsync(projectId);
        if (!ok) return deny!;
        return Ok(await Set.Where(e => GetProjectId(e) == projectId).ToListAsync());
    }

    [HttpPost]
    public async Task<IActionResult> Create(Guid projectId, [FromBody] T input)
    {
        var (ok, deny) = await CheckAsync(projectId);
        if (!ok) return deny!;
        SetId(input, Guid.NewGuid());
        SetProjectId(input, projectId);
        Set.Add(input);
        await Db.SaveChangesAsync();
        return Ok(input);
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid projectId, Guid id, [FromBody] T input)
    {
        var (ok, deny) = await CheckAsync(projectId);
        if (!ok) return deny!;
        var existing = await Set.FindAsync(id);
        if (existing == null) return NotFound();
        SetId(input, id);
        SetProjectId(input, projectId);
        Db.Entry(existing).CurrentValues.SetValues(input);
        await Db.SaveChangesAsync();
        return Ok(existing);
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid projectId, Guid id)
    {
        var (ok, deny) = await CheckAsync(projectId);
        if (!ok) return deny!;
        var existing = await Set.FindAsync(id);
        if (existing == null) return NotFound();
        Set.Remove(existing);
        await Db.SaveChangesAsync();
        return NoContent();
    }
}

[Route("api/projects/{projectId:guid}/risks")]
public class RisksController : ProjectChildController<Risk>
{
    public RisksController(RgaDbContext db, CurrentUserService current, AccessGuard guard) : base(db, current, guard) { }
    protected override DbSet<Risk> Set => Db.Risks;
    protected override Guid GetId(Risk e) => e.Id;
    protected override void SetId(Risk e, Guid id) => e.Id = id;
    protected override Guid GetProjectId(Risk e) => e.ProjectId;
    protected override void SetProjectId(Risk e, Guid id) => e.ProjectId = id;
}

[Route("api/projects/{projectId:guid}/issues")]
public class IssuesController : ProjectChildController<Issue>
{
    public IssuesController(RgaDbContext db, CurrentUserService current, AccessGuard guard) : base(db, current, guard) { }
    protected override DbSet<Issue> Set => Db.Issues;
    protected override Guid GetId(Issue e) => e.Id;
    protected override void SetId(Issue e, Guid id) => e.Id = id;
    protected override Guid GetProjectId(Issue e) => e.ProjectId;
    protected override void SetProjectId(Issue e, Guid id) => e.ProjectId = id;
}

[Route("api/projects/{projectId:guid}/sessions")]
public class SessionsController : ProjectChildController<Session>
{
    public SessionsController(RgaDbContext db, CurrentUserService current, AccessGuard guard) : base(db, current, guard) { }
    protected override DbSet<Session> Set => Db.Sessions;
    protected override Guid GetId(Session e) => e.Id;
    protected override void SetId(Session e, Guid id) => e.Id = id;
    protected override Guid GetProjectId(Session e) => e.ProjectId;
    protected override void SetProjectId(Session e, Guid id) => e.ProjectId = id;
}

[Route("api/projects/{projectId:guid}/data-items")]
public class DataItemsController : ProjectChildController<DataItem>
{
    public DataItemsController(RgaDbContext db, CurrentUserService current, AccessGuard guard) : base(db, current, guard) { }
    protected override DbSet<DataItem> Set => Db.DataItems;
    protected override Guid GetId(DataItem e) => e.Id;
    protected override void SetId(DataItem e, Guid id) => e.Id = id;
    protected override Guid GetProjectId(DataItem e) => e.ProjectId;
    protected override void SetProjectId(DataItem e, Guid id) => e.ProjectId = id;
}

[Route("api/projects/{projectId:guid}/escalations")]
public class EscalationsController : ProjectChildController<Escalation>
{
    public EscalationsController(RgaDbContext db, CurrentUserService current, AccessGuard guard) : base(db, current, guard) { }
    protected override DbSet<Escalation> Set => Db.Escalations;
    protected override Guid GetId(Escalation e) => e.Id;
    protected override void SetId(Escalation e, Guid id) => e.Id = id;
    protected override Guid GetProjectId(Escalation e) => e.ProjectId;
    protected override void SetProjectId(Escalation e, Guid id) => e.ProjectId = id;
}

[Route("api/projects/{projectId:guid}/questionnaire")]
public class QuestionnaireController : ProjectChildController<QuestionnaireResponse>
{
    public QuestionnaireController(RgaDbContext db, CurrentUserService current, AccessGuard guard) : base(db, current, guard) { }
    protected override DbSet<QuestionnaireResponse> Set => Db.QuestionnaireResponses;
    protected override Guid GetId(QuestionnaireResponse e) => e.Id;
    protected override void SetId(QuestionnaireResponse e, Guid id) => e.Id = id;
    protected override Guid GetProjectId(QuestionnaireResponse e) => e.ProjectId;
    protected override void SetProjectId(QuestionnaireResponse e, Guid id) => e.ProjectId = id;
}

[Route("api/projects/{projectId:guid}/moms")]
public class MomsController : ProjectChildController<Mom>
{
    public MomsController(RgaDbContext db, CurrentUserService current, AccessGuard guard) : base(db, current, guard) { }
    protected override DbSet<Mom> Set => Db.Moms;
    protected override Guid GetId(Mom e) => e.Id;
    protected override void SetId(Mom e, Guid id) => e.Id = id;
    protected override Guid GetProjectId(Mom e) => e.ProjectId;
    protected override void SetProjectId(Mom e, Guid id) => e.ProjectId = id;
}
