using TravelHub.Api.Common.Email;
using TravelHub.Api.Common.Http;
using TravelHub.Api.Features.Auth.EmailVerification;
using TravelHub.Api.Features.Auth.Google;
using TravelHub.Api.Features.Auth.PasswordReset;
using TravelHub.Api.Common.Time;
using TravelHub.Api.Data;
using TravelHub.Api.Features.Admin;
using TravelHub.Api.Features.Admin.Access;
using TravelHub.Api.Features.Admin.Audit;
using TravelHub.Api.Features.Admin.Context;
using TravelHub.Api.Features.Admin.Dashboard;
using TravelHub.Api.Features.Admin.Departures;
using TravelHub.Api.Features.Admin.Staff;
using TravelHub.Api.Features.Admin.Tours;
using TravelHub.Api.Features.Auth;
using TravelHub.Api.Features.Bookings;
using TravelHub.Api.Features.Cart;
using TravelHub.Api.Features.Branches;
using TravelHub.Api.Features.Flights;
using TravelHub.Api.Features.Health;
using TravelHub.Api.Features.Hotels;
using TravelHub.Api.Features.Payments;
using TravelHub.Api.Features.ServiceRequests;
using TravelHub.Api.Features.Tours;

namespace TravelHub.Api.Configuration;

public static class ServiceRegistration
{
    public const string FrontendCorsPolicy = "Frontend";

    public static IServiceCollection AddTravelHubServices(this IServiceCollection services, IConfiguration config)
    {
        services.Configure<DatabaseOptions>(config.GetSection("Database"));
        services.AddSingleton<MySqlConnectionFactory>();
        services.AddSingleton(TimeProvider.System);
        services.AddSingleton<VietnamClock>();
        services.AddScoped<AntiforgeryFilter>();

        services.AddScoped<TourRepository>().AddScoped<TourService>();
        services.AddScoped<TourCollectionRepository>().AddScoped<TourCollectionService>();
        services.AddScoped<HotelRepository>().AddScoped<HotelService>();
        services.AddScoped<FlightRepository>().AddScoped<FlightService>();
        services.AddScoped<BranchRepository>().AddScoped<BranchService>();
        services.Configure<EmailOptions>(config.GetSection("Email"));
        services.Configure<BookingOptions>(config.GetSection(BookingOptions.SectionName));
        // Payments: gateways are stateless. Missing Vnpay secrets are allowed at startup; VnPayPaymentGateway
        // reports "chưa cấu hình" when called, and simulated payment keeps working.
        services.Configure<VnPayOptions>(config.GetSection(VnPayOptions.SectionName));
        services.AddSingleton<VnPayPaymentGateway>();
        services.AddSingleton<SimulatedPaymentGateway>();
        services.AddScoped<BookingPaymentService>();
        services.AddHostedService<TourHoldExpiryJob>();
        services.AddSingleton<IEmailSender, SmtpEmailSender>();
        services.AddScoped<AuthRepository>().AddScoped<AuthService>();
        services.AddScoped<EmailVerificationRepository>().AddScoped<EmailVerificationService>();
        services.AddScoped<PasswordResetService>();
        services.Configure<GoogleOptions>(config.GetSection("Google"));
        services.AddScoped<GoogleSignInService>();
        services.AddScoped<BookingRepository>().AddScoped<BookingService>().AddScoped<AdminBookingService>();
        services.AddScoped<CartRepository>().AddScoped<CartService>();
        services.AddScoped<ServiceRequestRepository>().AddScoped<ServiceRequestService>()
            .AddScoped<AdminServiceRequestService>();
        AddAdmin(services);

        // Browsers reach authenticated APIs through the Next.js same-origin proxy; direct CORS stays read-only.
        var origins = config.GetSection("Cors:AllowedOrigins").Get<string[]>() ?? ["http://localhost:3000"];
        services.AddCors(options => options.AddPolicy(FrontendCorsPolicy, policy =>
            policy.WithOrigins(origins).WithMethods("GET").AllowAnyHeader()));
        return services;
    }

    /// <summary>Multi-branch back office (docs/architecture/admin-spec.md).</summary>
    private static void AddAdmin(IServiceCollection services)
    {
        services.AddScoped<OrganizationRepository>().AddScoped<AdminAccessService>();
        services.AddScoped<AuditLogRepository>().AddScoped<AuditLogService>();
        services.AddScoped<AdminContextService>().AddScoped<DashboardRepository>().AddScoped<DashboardService>();
        services.AddScoped<AdminTourRepository>().AddScoped<AdminTourWriter>().AddScoped<AdminTourService>();
        services.AddScoped<AdminDepartureRepository>().AddScoped<AdminDepartureService>();
        services.AddScoped<ManifestRepository>().AddScoped<ManifestService>();
        services.AddScoped<StaffRepository>().AddScoped<StaffService>();
    }

    public static void MapTravelHubEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapHealthEndpoints();
        app.MapTourEndpoints();
        app.MapHotelEndpoints();
        app.MapFlightEndpoints();
        app.MapBranchEndpoints();
        app.MapAuthEndpoints();
        app.MapBookingEndpoints();
        app.MapAdminEndpoints();
        app.MapAdminCatalogEndpoints();
        app.MapAdminSystemEndpoints();
        app.MapServiceRequestEndpoints();
        app.MapCartEndpoints();
    }
}
