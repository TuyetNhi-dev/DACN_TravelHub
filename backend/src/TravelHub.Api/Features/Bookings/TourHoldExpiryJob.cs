using Microsoft.Extensions.Options;
using TravelHub.Api.Configuration;

namespace TravelHub.Api.Features.Bookings;

/// <summary>
/// Background sweep that cancels unpaid tour orders once their hold deadline passes and returns the seats.
/// A failed sweep is logged and retried on the next tick; it never stops the API.
/// </summary>
public sealed class TourHoldExpiryJob(IServiceScopeFactory scopes, IOptions<BookingOptions> options,
    ILogger<TourHoldExpiryJob> logger) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        using var timer = new PeriodicTimer(options.Value.HoldSweep);
        do
        {
            await SweepAsync(stoppingToken);
        } while (await timer.WaitForNextTickAsync(stoppingToken));
    }

    private async Task SweepAsync(CancellationToken ct)
    {
        try
        {
            await using var scope = scopes.CreateAsyncScope();
            var payments = scope.ServiceProvider.GetRequiredService<BookingPaymentService>();
            var cancelled = await payments.ExpireHoldsAsync(ct);
            if (cancelled > 0) logger.LogInformation("Cancelled {Count} expired tour holds", cancelled);
        }
        catch (OperationCanceledException) when (ct.IsCancellationRequested)
        {
            // Shutting down.
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Tour hold expiry sweep failed; retrying on the next tick");
        }
    }
}
