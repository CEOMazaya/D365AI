using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.Identity.Web;
using Mazaya.Rga.Api.Auth;
using Mazaya.Rga.Api.Data;

var builder = WebApplication.CreateBuilder(args);

// ── Database (PostgreSQL) ────────────────────────────────────────────────────
// Connection string from configuration: "ConnectionStrings:Postgres".
// On Azure this comes from an app setting backed by a Key Vault reference.
builder.Services.AddDbContext<RgaDbContext>(opt =>
    opt.UseNpgsql(builder.Configuration.GetConnectionString("Postgres")));

// ── Entra ID (Azure AD) JWT bearer auth ──────────────────────────────────────
// Explicit JWT bearer validation (instead of AddMicrosoftIdentityWebApi, whose
// default scope policy was rejecting otherwise-valid tokens before the action
// ran). We validate: signature (via Entra's published keys), token lifetime,
// and audience (our API). Issuer is validated loosely because the apps are
// MULTITENANT — tokens legitimately come from many customer tenants, so we
// accept any Microsoft Entra issuer rather than one fixed tenant. There is NO
// scope gate at the middleware; [Authorize] only requires an authenticated
// user, and AccessGuard performs the real per-customer authorization.
var aadTenant = builder.Configuration["AzureAd:TenantId"] ?? "organizations";
var aadAudience = builder.Configuration["AzureAd:Audience"]
                  ?? $"api://{builder.Configuration["AzureAd:ClientId"]}";
var aadClientId = builder.Configuration["AzureAd:ClientId"] ?? "";
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        // Keep original JWT claim names (preferred_username, upn, oid, …) instead
        // of the legacy SOAP-style remapping, so claim lookups are predictable.
        options.MapInboundClaims = false;
        // Use the multitenant metadata endpoint so signing keys for any tenant resolve.
        options.Authority = "https://login.microsoftonline.com/organizations/v2.0";
        options.TokenValidationParameters = new Microsoft.IdentityModel.Tokens.TokenValidationParameters
        {
            // Accept both the v2 (api://{clientId}) and v1 ({clientId}) audience forms.
            ValidateAudience = true,
            ValidAudiences = new[] { aadAudience, aadClientId, $"api://{aadClientId}" },
            // Multitenant: accept any Entra issuer (signature + audience are the real gate).
            ValidateIssuer = false,
            ValidateIssuerSigningKey = true,
            ValidateLifetime = true,
            // With MapInboundClaims=false, tell the identity which claim is the
            // "name" so RequireAuthenticatedUser / [Authorize] accepts the principal.
            // Entra tokens may carry any of these; the identity just needs one.
            NameClaimType = "preferred_username",
            RoleClaimType = "roles",
        };
    });

builder.Services.AddAuthorization();
builder.Services.AddScoped<CurrentUserService>();
builder.Services.AddScoped<AccessGuard>();

// ── CORS — allow the portal origin(s) ────────────────────────────────────────
var allowedOrigins = builder.Configuration.GetSection("Cors:Origins").Get<string[]>()
                     ?? new[] { "http://localhost:5173" };
builder.Services.AddCors(o => o.AddPolicy("portal", p =>
    p.WithOrigins(allowedOrigins).AllowAnyHeader().AllowAnyMethod()));

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors("portal");
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

// Lightweight health endpoint for Container Apps probes.
app.MapGet("/health", () => Results.Ok(new { status = "ok" })).AllowAnonymous();

app.Run();
