using System.Text;
using api.data;
using api.models.email;
using api.repositories.implementations;
using api.repositories.interfaces;
using api.services.implementations.auth;
using api.services.interfaces.auth;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using FluentValidation;
using api.validators;
using api.validators.auth;
using Microsoft.AspNetCore.Mvc;
using CloudinaryDotNet;
using api.services.implementations.cloud;
using api.services.interfaces.cloud;
using api.services.interfaces.user;
using api.services.implementations;
using api.services.interfaces;
using api.services.implementations.seed;
using api.services.implementations.product;
using api.services.interfaces.product;


// Load .env BEFORE creating builder
DotNetEnv.Env.Load();


var builder = WebApplication.CreateBuilder(args);
Console.WriteLine("=== DEBUG ===");
Console.WriteLine("Working dir: " + Directory.GetCurrentDirectory());
Console.WriteLine("ENV file exists: " + File.Exists(Path.Combine(Directory.GetCurrentDirectory(), ".env")));
Console.WriteLine("Connection string: " + builder.Configuration.GetConnectionString("DefaultConnection"));
Console.WriteLine("=============");
// ===========================
// SET UP ENV
// ===========================
builder.Configuration.AddEnvironmentVariables();

// ===========================
// CONTROLLERS & API EXPLORER
// ===========================
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.ReferenceHandler = System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles;
        options.JsonSerializerOptions.DefaultIgnoreCondition = System.Text.Json.Serialization.JsonIgnoreCondition.WhenWritingNull;
        options.JsonSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
    });

builder.Services.AddEndpointsApiExplorer();

// ===========================
// SWAGGER WITH JWT
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
// CLOUDINARY
// ===========================
builder.Services.AddSingleton(sp =>
{
    var config = sp.GetRequiredService<IConfiguration>();

    var cloudName = config["CloudinarySettings:CloudName"];
    var apiKey = config["CloudinarySettings:ApiKey"];
    var apiSecret = config["CloudinarySettings:ApiSecret"];

    Console.WriteLine($"Cloudinary Key: {apiKey}");

    var account = new Account(cloudName, apiKey, apiSecret);
    var cloudinary = new Cloudinary(account);
    cloudinary.Api.Secure = true;
    return cloudinary;
});


builder.Services.Configure<IISServerOptions>(o => o.MaxRequestBodySize = 209715200);
builder.WebHost.ConfigureKestrel(o => o.Limits.MaxRequestBodySize = 209715200);

// ===========================
// DATABASE CONFIGURATION
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
// JWT AUTHENTICATION
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
// AUTHORIZATION POLICIES
// ===========================
builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("AdminOnly", policy => policy.RequireRole("Admin"));
    options.AddPolicy("MemberOnly", policy => policy.RequireRole("Member"));
    options.AddPolicy("MerchantOnly", policy => policy.RequireRole("Merchant"));
});

// ===========================
// CORS CONFIGURATION
// ===========================
var allowedOrigins = builder.Configuration
    .GetSection("Cors:AllowedOrigins")
    .Get<string[]>()
    ?? new[] { "http://localhost:5173", "https://localhost:3000" };

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
// EMAIL SETTINGS
// ===========================
builder.Services.Configure<EmailSettings>(builder.Configuration.GetSection("EmailSettings"));

// ===========================
//  HTTP CLIENT (Google API calls)
// ===========================
builder.Services.AddHttpClient("google", client =>
{
    client.Timeout = TimeSpan.FromSeconds(30);
});
// ===========================
// VALIDATOR
// ===========================
builder.Services.Configure<ApiBehaviorOptions>(options =>
{
    options.InvalidModelStateResponseFactory = context =>
    {
        var errors = context.ModelState
        .Where(e => e.Value.Errors.Count > 0)
        .ToDictionary(
            kvp => kvp.Key,
            kvp => kvp.Value.Errors.Select(e => e.ErrorMessage).ToArray()
        );
        return new BadRequestObjectResult(new
        {
            success = false,
            message = "Validation failded",
            errors = errors
        });
    };
});


// ===========================
//  DEPENDENCY INJECTION
// ===========================
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<ITokenService, TokenService>();
builder.Services.AddScoped<IEmailService, EmailService>();
builder.Services.AddScoped<IUserRepository, UserRepository>();
builder.Services.AddScoped<IRefreshTokenRepository, RefreshTokenRepository>();
builder.Services.AddScoped<IOtpService, OtpService>();
builder.Services.AddScoped<IGoogleAuthService, GoogleAuthService>();
builder.Services.AddValidatorsFromAssemblyContaining<RegisterDtoValidator>();
builder.Services.AddValidatorsFromAssemblyContaining<LoginDtoValidator>();
builder.Services.AddScoped<CloudinaryService>();
builder.Services.AddScoped<ICloudinaryService, CloudinaryService>();
builder.Services.AddScoped<IUserService, UserService>();
builder.Services.AddScoped<IProductRepository, ProductRepository>();
builder.Services.AddScoped<IProductService, ProductService>();
builder.Services.AddScoped<SeedService>();


// ===========================
//  HTTP CONTEXT ACCESSOR
// ===========================
builder.Services.AddHttpContextAccessor();

// ===========================
// BUILD APP
// ===========================
var app = builder.Build();

// ===========================
// MIDDLEWARE PIPELINE
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
// AUTO DATABASE MIGRATION
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