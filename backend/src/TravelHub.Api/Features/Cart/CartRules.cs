using TravelHub.Api.Common.Errors;
using TravelHub.Api.Common.Http;
using TravelHub.Api.Features.Bookings;
using TravelHub.Api.Features.Tours;

namespace TravelHub.Api.Features.Cart;

/// <summary>A guest line after validation; <see cref="UpdatedAt"/> is already clamped to the server clock.</summary>
public sealed record GuestLine(CartChoice Choice, decimal? AdultPriceSeen, decimal? ChildPriceSeen, DateTime UpdatedAt);

/// <summary>Result of planning a sign-in merge: lines to write, and guest lines that could not be moved.</summary>
public sealed record MergePlan(IReadOnlyList<GuestLine> ToSave, int NotMoved);

/// <summary>Pure cart rules (no database), so every case is unit tested.</summary>
public static class CartRules
{
    private const string PublishedTour = "published";

    public static CartChoice Validate(string? departureId, int adults, int children)
    {
        var errors = new ValidationErrors();
        errors.AddIf(!ResourceId.TryParse(departureId, out var id), "departureId", "Vui lòng chọn lịch khởi hành.");
        errors.AddIf(adults < 1, "adultCount", "Cần ít nhất một người lớn.");
        errors.AddIf(children < 0, "childCount", "Số trẻ em không hợp lệ.");
        errors.AddIf(!WithinGroupLimit(adults, children), "adultCount",
            $"Mỗi đơn tối đa {BookingLimits.MaxTourTravelers} khách. Đoàn lớn hơn vui lòng liên hệ tổng đài.");
        errors.ThrowIfAny();
        return new CartChoice(id, adults, children);
    }

    private static bool WithinGroupLimit(int adults, int children) =>
        adults + children <= BookingLimits.MaxTourTravelers;

    /// <summary>
    /// Guest carts come from browser storage that may be stale or edited: invalid lines are dropped instead of
    /// failing the whole cart, duplicates keep the newest line, and timestamps from the future are clamped.
    /// </summary>
    public static IReadOnlyList<GuestLine> GuestLines(GuestCartRequest request, DateTime nowUtc)
    {
        var items = request.Items ?? [];
        if (items.Count > CartLimits.MaxGuestItems)
            throw ApiException.BadRequest($"Giỏ hàng có quá nhiều món (tối đa {CartLimits.MaxItems}).");
        var lines = new List<GuestLine>();
        foreach (var item in items)
        {
            if (!TryValidate(item, out var choice)) continue;
            var updated = item.UpdatedAt?.UtcDateTime ?? nowUtc;
            if (updated > nowUtc + CartLimits.ClockSkew) updated = nowUtc;
            lines.Add(new GuestLine(choice, Price(item.AdultPriceSeen), Price(item.ChildPriceSeen), updated));
        }
        return lines.GroupBy(line => line.Choice.DepartureId)
            .Select(group => group.MaxBy(line => line.UpdatedAt)!)
            .OrderByDescending(line => line.UpdatedAt)
            .ToList();
    }

    /// <summary>
    /// Sign-in merge. A departure already in the account keeps whichever version is newer. New departures fill
    /// the free places, newest first; the rest are counted as not moved. Account lines are never deleted.
    /// </summary>
    public static MergePlan PlanMerge(IReadOnlyList<CartItemRow> account, IReadOnlyList<GuestLine> guest)
    {
        var existing = account.ToDictionary(row => row.DepartureId);
        var free = CartLimits.MaxItems - account.Count;
        var toSave = new List<GuestLine>();
        var notMoved = 0;
        foreach (var line in guest.OrderByDescending(line => line.UpdatedAt))
        {
            if (existing.TryGetValue(line.Choice.DepartureId, out var current))
            {
                if (line.UpdatedAt > current.UpdatedAt) toSave.Add(line);
                continue;
            }
            if (free > 0) { toSave.Add(line); free--; }
            else notMoved++;
        }
        return new MergePlan(toSave, notMoved);
    }

    public static string Status(CartDepartureRow departure, CartChoice choice, decimal adultSeen, decimal? childSeen,
        DateOnly today)
    {
        if (departure.TourStatus != PublishedTour || departure.Status != DepartureStatus.Open
            || departure.DepartureDate <= today)
            return CartItemStatus.Unavailable;
        var seats = AvailableSeats(departure);
        if (seats <= 0) return CartItemStatus.SoldOut;
        if (seats < choice.AdultCount + choice.ChildCount) return CartItemStatus.NotEnoughSeats;
        var childChanged = choice.ChildCount > 0
            && (departure.ChildPrice ?? departure.AdultPrice) != (childSeen ?? adultSeen);
        return departure.AdultPrice != adultSeen || childChanged ? CartItemStatus.PriceChanged : CartItemStatus.Ok;
    }

    /// <summary>Only lines that can still be booked count towards the estimate.</summary>
    public static bool CountsTowardsTotal(string status) =>
        status is CartItemStatus.Ok or CartItemStatus.PriceChanged;

    public static int AvailableSeats(CartDepartureRow departure) =>
        Math.Max(0, departure.Capacity - departure.ReservedSeats);

    public static decimal Subtotal(CartDepartureRow departure, CartChoice choice) =>
        BookingPricing.ForTour(departure.AdultPrice, departure.ChildPrice, choice.AdultCount, choice.ChildCount).Total;

    /// <summary>Same checks as <see cref="Validate"/>, but a broken line is skipped instead of reported.</summary>
    private static bool TryValidate(GuestCartItem item, out CartChoice choice)
    {
        var valid = ResourceId.TryParse(item.DepartureId, out var id) && item.AdultCount >= 1 && item.ChildCount >= 0
            && WithinGroupLimit(item.AdultCount, item.ChildCount);
        choice = new CartChoice(id, item.AdultCount, item.ChildCount);
        return valid;
    }

    private static decimal? Price(decimal? value) => value is >= 0 ? value : null;
}
