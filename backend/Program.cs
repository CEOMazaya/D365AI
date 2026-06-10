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
// Validates tokens issued by the tenant(s) in appsettings "AzureAd". The portal
// (a Static Web App / SPA) acquires a token via MSAL and sends it as a bearer.
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddMicrosoftIdentityWebApi(builder.Configuration.GetSection("AzureAd"));

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
