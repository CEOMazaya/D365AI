using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Mazaya.Rga.Api.Auth;
using Mazaya.Rga.Api.Data;
using Mazaya.Rga.Api.Models;

namespace Mazaya.Rga.Api.Controllers;

[ApiController]
[Route("api/o365-credentials")]
[Authorize]
public class O365CredentialsController : ControllerBase
{
    private readonly RgaDbContext _db;
    private readonly CurrentUserService _current;
    public O365CredentialsController(RgaDbContext db, CurrentUserService current)
    {
        _db = db; _current = current;
    }

    // Get the credentials for an environment (default).
    [HttpGet]
    public async Task<IActionResult> Get([FromQuery] string environment = "default")
    {
        var cred = await _db.O365Credentials.FirstOrDefaultAsync(c => c.Environment == environment);
        if (cred == null) return Ok(new O365Credential { Environment = environment, Configured = false });
        return Ok(cred);
    }

    // Update credentials. Admin only. The client secret is NOT stored here — the
    // request carries a Key Vault reference (URI) in ClientSecretRef; the raw
    // secret lives in Key Vault and is read by managed identity at runtime.
    [HttpPut]
    public async Task<IActionResult> Update([FromBody] O365Credential input)
    {
        var me = await _current.ResolveAsync(User);
        if (me == null) return Unauthorized();
        if (me.UserType != "mazaya_admin")
            return StatusCode(403, new { error = "Only a Mazaya Admin can change O365 credentials" });

        var env = string.IsNullOrWhiteSpace(input.Environment) ? "default" : input.Environment;
        var cred = await _db.O365Credentials.FirstOrDefaultAsync(c => c.Environment == env);
        if (cred == null)
        {
            cred = new O365Credential { Id = Guid.NewGuid(), Environment = env };
            _db.O365Credentials.Add(cred);
        }
        cred.TenantId = input.TenantId;
        cred.ClientId = input.ClientId;
        cred.ClientSecretRef = input.ClientSecretRef;     // Key Vault URI, not the secret
        cred.D365EnvironmentUrl = input.D365EnvironmentUrl;
        cred.GraphScopes = input.GraphScopes;
        cred.Configured = !string.IsNullOrWhiteSpace(input.TenantId)
                          && !string.IsNullOrWhiteSpace(input.ClientId)
                          && !string.IsNullOrWhiteSpace(input.ClientSecretRef);
        cred.UpdatedBy = me.Id;
        await _db.SaveChangesAsync();
        return Ok(cred);
    }
}
