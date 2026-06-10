using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Mazaya.Rga.Api.Auth;

namespace Mazaya.Rga.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class AuthController : ControllerBase
{
    private readonly CurrentUserService _current;
    public AuthController(CurrentUserService current) => _current = current;

    // GET /api/auth/me — the portal calls this right after MSAL sign-in to learn
    // who it's talking to and which role/privileges to render.
    [HttpGet("me")]
    public async Task<IActionResult> Me()
    {
        var user = await _current.ResolveAsync(User);
        if (user == null)
        {
            var claimTypes = User.Claims.Select(c => c.Type).Distinct().ToArray();
            return StatusCode(401, new { error = "Could not resolve user from token", claimTypes });
        }
        return Ok(user);
    }

    // DIAGNOSTIC (anonymous): always runs, even if [Authorize] would reject, so we
    // can see whether a token arrived and what claims/identity it produced.
    [AllowAnonymous]
    [HttpGet("whoami")]
    public IActionResult WhoAmI()
    {
        return Ok(new
        {
            isAuthenticated = User?.Identity?.IsAuthenticated ?? false,
            authType = User?.Identity?.AuthenticationType,
            name = User?.Identity?.Name,
            claimTypes = User?.Claims.Select(c => c.Type).Distinct().ToArray() ?? Array.Empty<string>(),
            hasAuthHeader = Request.Headers.ContainsKey("Authorization")
        });
    }
}
