using System.Text;
using api.Data;
using api.Models.Email;
using api.Repositories.Implementations;
using api.Repositories.Interfaces;
using api.Services.Implementations.Auth;
using api.Services.Interfaces;
using api.Services.Interfaces.Auth;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using DotNetEnv;

var builder = WebApplication.CreateBuilder(args);
// ===========================
// SET UP ENV
// ===========================
DotNetEnv.Env.Load();
builder.Configuration.AddEnvironmentVariables();

// ===========================
// 1. CONTROLLERS & API EXPLORER
// ===========================
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.ReferenceHandler = System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles;
        options.JsonSerializerOptions.DefaultIgnoreCondition = System.Text.Json.Serialization.JsonIgnoreCondition.WhenWritingNull;
    });

builder.Services.AddEndpointsApiExplorer();

// ===========================
// 2. SWAGGER WITH JWT
// ===========================
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "HauShop API",
        Version = "v1",
        Description = "E-commerce API with JWT Authentication"
    });

    options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        Scheme = "Bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header
    });

    options.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

// ===========================
// 3. DATABASE CONFIGURATION
// ===========================
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");

if (string.IsNullOrEmpty(connectionString))
{
    throw new InvalidOperationException("Connection string is missing. Check your .env file.");
}

builder.Services.AddDbContext<ApplicationDbContext>(options =>
{
    options.UseMySql(
        connectionString,
        ServerVersion.AutoDetect(connectionString),
        mySqlOptions =>
        {
            mySqlOptions.EnableRetryOnFailure(
                maxRetryCount: 5,
                maxRetryDelay: TimeSpan.FromSeconds(30),
                errorNumbersToAdd: null
            );
        }
    );
});

// ===========================
// 4. JWT AUTHENTICATION
// ===========================
var jwtKey = builder.Configuration["Jwt:Key"];

if (string.IsNullOrEmpty(jwtKey))
{
    throw new InvalidOperationException("JWT Key is missing. Check your .env file.");
}

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.SaveToken = true;
    options.RequireHttpsMetadata = false;
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = builder.Configuration["Jwt:Issuer"],
        ValidAudience = builder.Configuration["Jwt:Audience"],
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),
        ClockSkew = TimeSpan.Zero
    };

    options.Events = new JwtBearerEvents
    {
        OnMessageReceived = context =>
        {

            var token = context.Request.Cookies["accessToken"];


            if (string.IsNullOrEmpty(token))
            {
                var authHeader = context.Request.Headers["Authorization"].FirstOrDefault();
                if (!string.IsNullOrEmpty(authHeader) && authHeader.StartsWith("Bearer "))
                    token = authHeader["Bearer ".Length..].Trim();
            }

            context.Token = token;
            return Task.CompletedTask;
        },
        OnAuthenticationFailed = context =>
        {
            if (context.Exception is SecurityTokenExpiredException)
                context.Response.Headers.Append("Token-Expired", "true");
            return Task.CompletedTask;
        },
        OnChallenge = context =>
        {
            context.HandleResponse();
            context.Response.StatusCode = 401;
            context.Response.ContentType = "application/json";
            var result = System.Text.Json.JsonSerializer.Serialize(new
            {
                success = false,
                message = "You are not authorized"
            });
            return context.Response.WriteAsync(result);
        }
    };
});

// ===========================
// 5. AUTHORIZATION POLICIES
// ===========================
builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("AdminOnly", policy => policy.RequireRole("Admin"));
    options.AddPolicy("MemberOnly", policy => policy.RequireRole("Member"));   // ✅ sửa từ CustomerOnly
    options.AddPolicy("MerchantOnly", policy => policy.RequireRole("Merchant"));
});

// ===========================
// 6. CORS CONFIGURATION
// ===========================
var allowedOrigins = builder.Configuration
    .GetSection("Cors:AllowedOrigins")
    .Get<string[]>()
    ?? new[] { "http://localhost:5173", "http://localhost:3000" };

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowReactApp", policy =>
    {
        policy.WithOrigins(allowedOrigins)
              .AllowAnyMethod()
              .AllowAnyHeader()
              .AllowCredentials();
    });
});

// ===========================
// 7. EMAIL SETTINGS
// ===========================
builder.Services.Configure<EmailSettings>(builder.Configuration.GetSection("EmailSettings"));

// ===========================
// 8. HTTP CLIENT (Google API calls)
// ===========================
builder.Services.AddHttpClient("google", client =>
{
    client.Timeout = TimeSpan.FromSeconds(30);
});

// ===========================
// 9. DEPENDENCY INJECTION
// ===========================
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<ITokenService, TokenService>();
builder.Services.AddScoped<IEmailService, EmailService>();
builder.Services.AddScoped<IUserRepository, UserRepository>();
builder.Services.AddScoped<IRefreshTokenRepository, RefreshTokenRepository>();
builder.Services.AddScoped<IOtpService, OtpService>();
builder.Services.AddScoped<IGoogleAuthService, GoogleAuthService>();

// ===========================
// 10. HTTP CONTEXT ACCESSOR
// ===========================
builder.Services.AddHttpContextAccessor();

// ===========================
// BUILD APP
// ===========================
var app = builder.Build();

// ===========================
// 11. MIDDLEWARE PIPELINE
// ===========================
app.UseExceptionHandler(errorApp =>
{
    errorApp.Run(async context =>
    {
        context.Response.StatusCode = 500;
        context.Response.ContentType = "application/json";
        var error = context.Features.Get<Microsoft.AspNetCore.Diagnostics.IExceptionHandlerFeature>();
        if (error != null)
        {
            var ex = error.Error;
            var logger = context.RequestServices.GetRequiredService<ILogger<Program>>();
            logger.LogError(ex, "Unhandled exception occurred");

            await context.Response.WriteAsJsonAsync(new
            {
                success = false,
                message = "Internal server error",
                details = app.Environment.IsDevelopment() ? ex.Message : null
            });
        }
    });
});

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "HauShop API V1");
    });
}

app.UseHttpsRedirection();
app.UseStaticFiles();
app.UseRouting();
app.UseCors("AllowReactApp");
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

app.MapGet("/health", () => Results.Ok(new
{
    success = true,
    status = "Healthy"
}));

// ===========================
// 12. AUTO DATABASE MIGRATION
// ===========================
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    try
    {
        var context = services.GetRequiredService<ApplicationDbContext>();
        var logger = services.GetRequiredService<ILogger<Program>>();

        if (context.Database.GetPendingMigrations().Any())
        {
            logger.LogInformation("Applying database migrations...");
            context.Database.Migrate();
            logger.LogInformation("Database migrations applied successfully");
        }
    }
    catch (Exception ex)
    {
        var logger = services.GetRequiredService<ILogger<Program>>();
        logger.LogError(ex, "An error occurred while migrating the database");
    }
}

app.Run();