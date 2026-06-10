using System.Security.Claims;
using Microsoft.EntityFrameworkCore;
using Mazaya.Rga.Api.Data;
using Mazaya.Rga.Api.Models;

namespace Mazaya.Rga.Api.Auth;

// Resolves the authenticated Entra ID principal to a portal User row.
//
// Multi-customer policy:
//   * Mazaya staff: email domain == mazayasolutions.com -> org 'mazaya',
//     default role mazaya_consultant, status active.
//   * Customer users: the email domain is matched against customer_domains.
//       - match found  -> org 'customer', linked to that customer_id,
//                         default role customer_viewer, status active.
//       - no match     -> status 'pending', no customer_id. The user can sign
//                         in but sees nothing until a Mazaya Admin assigns them
//                         a customer and activates them in the Admin Panel.
//   * Existing users are matched by email (case-insensitive).
//
// Adjust this policy in one place: here.
public class CurrentUserService
{
    private readonly RgaDbContext _db;
    public CurrentUserService(RgaDbContext db) => _db = db;

    public const string MazayaDomain = "mazayasolutions.com";

    public async Task<User?> ResolveAsync(ClaimsPrincipal principal)
    {
        if (principal?.Identity?.IsAuthenticated != true) return null;

        // Entra ACCESS tokens (not ID tokens) carry the user identifier under
        // varying claims depending on token version: preferred_username (v2),
        // upn / unique_name (v1), or the mapped Email/Name URIs after ASP.NET's
        // default claim mapping. Try them all, then fall back to any claim that
        // looks like an email address.
        var email = principal.FindFirstValue("preferred_username")
                    ?? principal.FindFirstValue("upn")
                    ?? principal.FindFirstValue("unique_name")
                    ?? principal.FindFirstValue(ClaimTypes.Upn)
                    ?? principal.FindFirstValue(ClaimTypes.Email)
                    ?? principal.FindFirstValue("email")
                    ?? principal.FindFirstValue("http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress")
                    ?? principal.Claims.FirstOrDefault(c => c.Value.Contains('@') && c.Value.Contains('.'))?.Value;
        if (string.IsNullOrWhiteSpace(email))
        {
            // Help diagnose token-claim shape without leaking values: log the claim TYPES only.
            Console.WriteLine("[auth] No email claim found. Claim types present: "
                + string.Join(", ", principal.Claims.Select(c => c.Type)));
            return null;
        }
        email = email.Trim().ToLowerInvariant();

        var name = principal.FindFirstValue("name")
                   ?? principal.FindFirstValue(ClaimTypes.Name)
                   ?? email;

        var existing = await _db.Users.FirstOrDefaultAsync(u => u.Email.ToLower() == email);
        if (existing != null) return existing;

        // First sign-in — provision.
        var domain = email.Contains('@') ? email[(email.IndexOf('@') + 1)..] : "";
        var isMazaya = domain == MazayaDomain;

        var user = new User
        {
            Id = Guid.NewGuid(),
            Name = name,
            Email = email,
        };

        if (isMazaya)
        {
            user.Org = "mazaya";
            user.UserType = "mazaya_consultant";
            user.Status = "active";
        }
        else
        {
            // Map the domain to a customer.
            var cd = await _db.CustomerDomains.FirstOrDefaultAsync(d => d.Domain == domain);
            if (cd != null)
            {
                user.Org = "customer";
                user.CustomerId = cd.CustomerId;
                user.UserType = "customer_viewer";
                user.Status = "active";
            }
            else
            {
                // Unknown domain — park pending for admin assignment.
                user.Org = "customer";
                user.UserType = "customer_viewer";
                user.Status = "pending";
            }
        }

        _db.Users.Add(user);
        await _db.SaveChangesAsync();
        return user;
    }
}
