using System.Text;
using System.IdentityModel.Tokens.Jwt;
using api.common;
using api.extensions;
using api.data;
using api.infrastructure.redis;
using api.models.email;
using api.repositories.implementations;
using api.repositories.interfaces;
using api.services.implementations.auth;
using api.services.interfaces.auth;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using FluentValidation;
using FluentValidation.AspNetCore;
using api.validators.order;
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
using api.services.interfaces.cart;
using api.services.implementations.cart;
using api.middlewares;
using api.middleware;
using api.services.interfaces.order;
using api.services.implementations.order;
using api.services.interfaces.payment;
using api.services.implementations.payment;
using api.services.interfaces.wishlist;
using api.services.implementations.wishlist;
using api.services.interfaces.review;
using api.services.implementations.review;
using api.services.interfaces.admin;
using api.services.implementations.admin;
using api.hubs;
using api.services.implementations.chat;
using api.services.interfaces.chat;
using api.services.interfaces.category;
using api.services.implementations.category;
using StackExchange.Redis;


// Load .env BEFORE creating builder
DotNetEnv.Env.Load();


var builder = WebApplication.CreateBuilder(args);
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
        options.JsonSerializerOptions.Converters.Add(new System.Text.Json.Serialization.JsonStringEnumConverter());
    });
builder.Services.AddFluentValidationAutoValidation();

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddExceptionHandler<GlobalExceptionHandler>();
builder.Services.AddProblemDetails();
builder.Services.AddSignalR();
builder.Services.AddResponseCaching();
builder.Services.AddRedisInfrastructure(builder.Configuration);

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

var mysqlServerVersion = builder.Configuration["Database:ServerVersion"] ?? "8.4.0-mysql";
var dbMaxRetryCount = builder.Configuration.GetValue<int?>("Database:MaxRetryCount") ?? 2;
var dbMaxRetryDelaySeconds = builder.Configuration.GetValue<int?>("Database:MaxRetryDelaySeconds") ?? 5;

builder.Services.AddDbContext<ApplicationDbContext>(options =>
{
    options.UseMySql(
        connectionString,
        ServerVersion.Parse(mysqlServerVersion),
        mySqlOptions =>
        {
            mySqlOptions.EnableRetryOnFailure(
                maxRetryCount: dbMaxRetryCount,
                maxRetryDelay: TimeSpan.FromSeconds(dbMaxRetryDelaySeconds),
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
            var endpoint = context.HttpContext.GetEndpoint();
            var allowsAnonymous = endpoint?.Metadata.GetMetadata<IAllowAnonymous>() != null;
            var authHeader = context.Request.Headers["Authorization"].FirstOrDefault();

            if (allowsAnonymous && string.IsNullOrEmpty(authHeader))
                return Task.CompletedTask;

            var token = context.Request.Cookies["accessToken"];

            if (string.IsNullOrEmpty(token))
            {
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
        OnTokenValidated = async context =>
        {
            var jti = context.Principal?.FindFirst(JwtRegisteredClaimNames.Jti)?.Value;
            var blacklist = context.HttpContext.RequestServices.GetRequiredService<IJwtBlacklistService>();

            if (await blacklist.IsBlacklistedAsync(jti, context.HttpContext.RequestAborted))
                context.Fail("Token has been revoked");
        },
        OnChallenge = context =>
        {
            context.HandleResponse();
            context.Response.StatusCode = 401;
            context.Response.ContentType = "application/problem+json";
            var problem = new ProblemDetails
            {
                Status = StatusCodes.Status401Unauthorized,
                Title = ClientErrorMessages.UnauthorizedTitle,
                Instance = context.Request.Path,
                Extensions =
                {
                    ["traceId"] = context.HttpContext.TraceIdentifier
                }
            };
            return context.Response.WriteAsJsonAsync(problem);
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
              .WithExposedHeaders("Server-Timing", "X-Product-Search-Ms")
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
            .Where(e => e.Value?.Errors.Count > 0)
            .ToDictionary(
                kvp => string.IsNullOrWhiteSpace(kvp.Key) ? "request" : kvp.Key,
                kvp => kvp.Value!.Errors
                    .Select(_ => ClientErrorMessages.FieldInvalid)
                    .Distinct()
                    .ToArray()
            );

        return new BadRequestObjectResult(new ValidationProblemDetails(errors)
        {
            Status = StatusCodes.Status400BadRequest,
            Title = ClientErrorMessages.InvalidRequestTitle,
            Detail = ClientErrorMessages.InvalidRequestDetail,
            Instance = context.HttpContext.Request.Path
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
builder.Services.AddValidatorsFromAssemblyContaining<CreateOrderDtoValidator>();
builder.Services.AddScoped<CloudinaryService>();
builder.Services.AddScoped<ICloudinaryService, CloudinaryService>();
builder.Services.AddScoped<IUserService, UserService>();
builder.Services.AddScoped<IProductRepository, ProductRepository>();
builder.Services.AddScoped<IProductService, ProductService>();
if (builder.Configuration.GetValue<bool>("Warmup:ProductSearch:Enabled"))
{
    builder.Services.AddHostedService<ProductSearchWarmupService>();
}
builder.Services.AddScoped<ICategoryRepository, CategoryRepository>();
builder.Services.AddScoped<ICategoryService, CategoryService>();
builder.Services.AddScoped<SeedService>();
builder.Services.AddScoped<ICartService, CartService>();
builder.Services.AddScoped<ICartCacheService, CartCacheService>();
builder.Services.AddScoped<ICartRepository, CartRepository>();
builder.Services.AddScoped<IProductVariantRepository, ProductVariantRepository>();
builder.Services.Configure<VnPayOptions>(
    builder.Configuration.GetSection(VnPayOptions.SectionName));

builder.Services.AddScoped<IOrderRepository, OrderRepository>();
builder.Services.AddScoped<IOrderService, OrderService>();
builder.Services.AddScoped<IVnPayService, VnPayService>();
builder.Services.AddScoped<IWishlistRepository, WishlistRepository>();
builder.Services.AddScoped<IWishlistService, WishlistService>();
builder.Services.AddScoped<IReviewRepository, ReviewRepository>();
builder.Services.AddScoped<IReviewService, ReviewService>();
builder.Services.AddScoped<IAdminDashboardService, AdminDashboardService>();
builder.Services.AddScoped<IAdminManagementService, AdminManagementService>();
builder.Services.AddScoped<IChatService, ChatService>();
builder.Services.AddHttpClient<IAiChatService, AiChatService>(client =>
{
    client.Timeout = TimeSpan.FromSeconds(30);
});


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
app.UseExceptionHandler();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "HauShop API V1");
    });
}

if (!app.Environment.IsDevelopment())
{
    app.UseHttpsRedirection();
}
app.UseStaticFiles();
app.UseRouting();
app.UseCors("AllowReactApp");
app.UseResponseCaching();
app.UseRedisInfrastructure();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
app.MapHub<ChatHub>("/hubs/chat");

app.MapGet("/health", () => Results.Ok(new
{
    success = true,
    status = "Healthy"
}));

app.MapGet("/health/redis", async (IConnectionMultiplexer redis) =>
{
    if (!redis.IsConnected)
    {
        return Results.Json(new
        {
            success = false,
            status = "Redis disconnected"
        }, statusCode: StatusCodes.Status503ServiceUnavailable);
    }

    try
    {
        var latency = await redis.GetDatabase().PingAsync();
        return Results.Ok(new
        {
            success = true,
            status = "Redis healthy",
            latencyMs = latency.TotalMilliseconds
        });
    }
    catch (Exception ex) when (ex is RedisException or RedisTimeoutException)
    {
        return Results.Json(new
        {
            success = false,
            status = "Redis unhealthy",
            error = ex.Message
        }, statusCode: StatusCodes.Status503ServiceUnavailable);
    }
});

// ===========================
// DATABASE MIGRATION
// ===========================
var applyMigrationsOnStartup = app.Configuration.GetValue<bool>("Database:ApplyMigrationsOnStartup");
if (applyMigrationsOnStartup)
{
    await using var scope = app.Services.CreateAsyncScope();
    var services = scope.ServiceProvider;
    try
    {
        var context = services.GetRequiredService<ApplicationDbContext>();
        var logger = services.GetRequiredService<ILogger<Program>>();

        if ((await context.Database.GetPendingMigrationsAsync()).Any())
        {
            logger.LogInformation("Applying database migrations...");
            await context.Database.MigrateAsync();
            logger.LogInformation("Database migrations applied successfully");
        }
    }
    catch (Exception ex)
    {
        var logger = services.GetRequiredService<ILogger<Program>>();
        logger.LogError(ex, "An error occurred while migrating the database");
    }
}
else
{
    app.Logger.LogInformation("Skipping database migrations on startup. Set Database:ApplyMigrationsOnStartup=true to enable.");
}

app.Run();
