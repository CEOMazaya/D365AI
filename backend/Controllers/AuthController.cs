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
        if (user == null) return Unauthorized();
        if (user.Status != "active") return StatusCode(403, new { error = "Account inactive" });
        return Ok(user);
    }
}
