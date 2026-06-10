using Microsoft.EntityFrameworkCore;
using Mazaya.Rga.Api.Data;
using Mazaya.Rga.Api.Models;

namespace Mazaya.Rga.Api.Auth;

// Enforces multi-customer data isolation. The rule is simple and central:
//   * Mazaya staff (org == 'mazaya', active) see every customer.
//   * Customer users see ONLY their own customer's data; anything else is 403.
//   * Pending / inactive users see nothing.
//
// Controllers call these guards before returning customer-scoped data so a
// customer can never read another customer's projects, risks, CRs, etc.
public class AccessGuard
{
    private readonly RgaDbContext _db;
    public AccessGuard(RgaDbContext db) => _db = db;

    public bool IsActiveMazaya(User u) => u.Org == "mazaya" && u.Status == "active";

    public bool CanAccessCustomer(User u, Guid customerId)
    {
        if (u.Status != "active") return false;
        if (u.Org == "mazaya") return true;
        return u.CustomerId == customerId;
    }

    // Resolve the customer that owns a project, then check access.
    public async Task<bool> CanAccessProjectAsync(User u, Guid projectId)
    {
        if (u.Status != "active") return false;
        if (u.Org == "mazaya") return true;
        var ownerCustomerId = await _db.Projects
            .Where(p => p.Id == projectId)
            .Select(p => (Guid?)p.CustomerId)
            .FirstOrDefaultAsync();
        return ownerCustomerId.HasValue && ownerCustomerId.Value == u.CustomerId;
    }

    // The set of customer IDs a user may list. Mazaya: all. Customer: just theirs.
    public IQueryable<Customer> ScopeCustomers(User u, IQueryable<Customer> q)
    {
        if (u.Org == "mazaya") return q;
        return q.Where(c => c.Id == u.CustomerId);
    }
}
