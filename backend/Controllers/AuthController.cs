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
            // DIAGNOSTIC: surface the token's claim types in the response so we can
            // see exactly what identifier the token carries (no values — types only).
            var claimTypes = User.Claims.Select(c => c.Type).Distinct().ToArray();
            return StatusCode(401, new { error = "Could not resolve user from token", claimTypes });
        }
        // Return the user even when pending/inactive so the portal can show a
        // friendly "awaiting approval" state rather than a hard error.
        return Ok(user);
    }
}
