using TravelHub.Api.Common.Errors;
using TravelHub.Api.Common.Http;
using TravelHub.Api.Common.Time;
using TravelHub.Api.Features.Tours;

namespace TravelHub.Api.Features.Cart;

/// <summary>
/// Giỏ hàng. A cart line is a choice only: it never holds seats or locks a price. Every read shows the live
/// departure, and booking still goes through POST /api/bookings/tours, which prices on the server.
/// </summary>
public sealed class CartService(CartRepository repository, VietnamClock clock)
{
    public async Task<CartDto> GetAsync(ulong userId, CancellationToken ct) =>
        await BuildAsync(await repository.ListItemsAsync(userId, ct), ct);

    public async Task<CartDto> SaveAsync(ulong userId, SaveCartItemRequest request, CancellationToken ct)
    {
        var choice = CartRules.Validate(request.DepartureId, request.AdultCount, request.ChildCount);
        var departure = (await repository.ListDeparturesAsync([choice.DepartureId], ct)).SingleOrDefault()
            ?? throw ApiException.NotFound("Lịch khởi hành không tồn tại.");
        EnsureCanAdd(departure, choice);
        var items = await repository.ListItemsAsync(userId, ct);
        if (items.All(item => item.DepartureId != choice.DepartureId) && items.Count >= CartLimits.MaxItems)
            throw ApiException.Conflict(
                $"Giỏ hàng đã đủ {CartLimits.MaxItems} món. Vui lòng xóa bớt hoặc đặt các món đang có.");
        await repository.SaveAsync(userId, [new CartSave(choice, departure.AdultPrice, departure.ChildPrice, null)],
            clock.UtcNow, ct);
        return await GetAsync(userId, ct);
    }

    public async Task<CartDto> DeleteAsync(ulong userId, string rawItemId, CancellationToken ct)
    {
        var itemId = ResourceId.Parse(rawItemId, "id");
        if (!await repository.DeleteAsync(userId, itemId, ct))
            throw ApiException.NotFound("Món này không còn trong giỏ hàng.");
        return await GetAsync(userId, ct);
    }

    /// <summary>Guest cart (browser storage) priced with live data. Read-only: nothing is stored.</summary>
    public async Task<CartDto> QuoteAsync(GuestCartRequest request, CancellationToken ct)
    {
        var lines = CartRules.GuestLines(request, clock.UtcNow).Take(CartLimits.MaxItems).ToList();
        var departures = await DeparturesByIdAsync(lines.Select(line => line.Choice.DepartureId), ct);
        var today = clock.Today;
        var items = lines
            .Where(line => departures.ContainsKey(line.Choice.DepartureId))
            .Select(line =>
            {
                var departure = departures[line.Choice.DepartureId];
                return ToDto(null, departure, line.Choice, line.AdultPriceSeen ?? departure.AdultPrice,
                    line.ChildPriceSeen ?? departure.ChildPrice, line.UpdatedAt, today);
            })
            .ToList();
        return Summarize(items);
    }

    /// <summary>
    /// Sign-in: moves the guest cart into the account. Lines whose departure can no longer be booked, or that do
    /// not fit in the 10 places, are reported in NotMoved; existing account lines are never removed.
    /// </summary>
    public async Task<MergeCartResultDto> MergeAsync(ulong userId, GuestCartRequest request, CancellationToken ct)
    {
        var guest = CartRules.GuestLines(request, clock.UtcNow);
        var departures = await DeparturesByIdAsync(guest.Select(line => line.Choice.DepartureId), ct);
        var today = clock.Today;
        var movable = guest.Where(line => departures.TryGetValue(line.Choice.DepartureId, out var departure)
            && CanAdd(departure, line.Choice, today)).ToList();
        var plan = CartRules.PlanMerge(await repository.ListItemsAsync(userId, ct), movable);
        var saves = plan.ToSave.Select(line => new CartSave(line.Choice, departures[line.Choice.DepartureId].AdultPrice,
            departures[line.Choice.DepartureId].ChildPrice, line.UpdatedAt)).ToList();
        await repository.SaveAsync(userId, saves, clock.UtcNow, ct);
        var notMoved = guest.Count - movable.Count + plan.NotMoved;
        return new MergeCartResultDto(await GetAsync(userId, ct), notMoved);
    }

    private async Task<CartDto> BuildAsync(IReadOnlyList<CartItemRow> rows, CancellationToken ct)
    {
        var departures = await DeparturesByIdAsync(rows.Select(row => row.DepartureId), ct);
        var today = clock.Today;
        // ON DELETE CASCADE removes lines of deleted departures, so every row normally has its departure.
        var items = rows.Where(row => departures.ContainsKey(row.DepartureId))
            .Select(row => ToDto(row.Id, departures[row.DepartureId],
                new CartChoice(row.DepartureId, row.AdultCount, row.ChildCount), row.AdultPriceSeen,
                row.ChildPriceSeen, row.UpdatedAt, today))
            .ToList();
        return Summarize(items);
    }

    private async Task<Dictionary<ulong, CartDepartureRow>> DeparturesByIdAsync(IEnumerable<ulong> ids,
        CancellationToken ct)
    {
        var rows = await repository.ListDeparturesAsync(ids.Distinct().ToList(), ct);
        return rows.ToDictionary(row => ResourceId.Parse(row.DepartureId, "departureId"));
    }

    private void EnsureCanAdd(CartDepartureRow departure, CartChoice choice)
    {
        var status = CartRules.Status(departure, choice, departure.AdultPrice, departure.ChildPrice, clock.Today);
        switch (status)
        {
            case CartItemStatus.Unavailable:
                throw ApiException.Conflict("Lịch khởi hành này không còn nhận khách.");
            case CartItemStatus.SoldOut:
                throw ApiException.Conflict("Lịch khởi hành này đã hết chỗ.");
            case CartItemStatus.NotEnoughSeats:
                throw ApiException.Conflict(
                    $"Lịch khởi hành này chỉ còn {CartRules.AvailableSeats(departure)} chỗ, ít hơn số khách bạn chọn.");
        }
    }

    private static bool CanAdd(CartDepartureRow departure, CartChoice choice, DateOnly today) =>
        CartRules.CountsTowardsTotal(
            CartRules.Status(departure, choice, departure.AdultPrice, departure.ChildPrice, today));

    private static CartItemDto ToDto(string? id, CartDepartureRow departure, CartChoice choice, decimal adultSeen,
        decimal? childSeen, DateTime updatedAt, DateOnly today)
    {
        var status = CartRules.Status(departure, choice, adultSeen, childSeen, today);
        // Only https photos leave the API, same rule as the tour detail page.
        var cover = TourService.ToImages([new TourImageRow(departure.ImageUrl ?? "", departure.ImageAlt, 0)])
            .FirstOrDefault();
        return new CartItemDto(id, departure.DepartureId, departure.TourId, departure.TourCode, departure.TourTitle,
            departure.Destination, cover?.Url, cover?.Alt, departure.DepartureFrom, departure.DepartureDate,
            departure.ReturnDate, choice.AdultCount, choice.ChildCount, departure.AdultPrice,
            departure.ChildPrice ?? departure.AdultPrice, adultSeen, childSeen, CartRules.AvailableSeats(departure),
            status, CartRules.Subtotal(departure, choice), updatedAt);
    }

    private static CartDto Summarize(IReadOnlyList<CartItemDto> items) => new(items,
        items.Where(item => CartRules.CountsTowardsTotal(item.Status)).Sum(item => item.Subtotal), CartLimits.MaxItems);
}
