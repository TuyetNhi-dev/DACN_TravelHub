using TravelHub.Api.Common.Errors;
using TravelHub.Api.Common.Http;
using TravelHub.Api.Common.Time;

namespace TravelHub.Api.Features.Hotels;

public sealed class HotelService(HotelRepository repository, VietnamClock clock)
{
    public Task<IReadOnlyList<HotelSummaryDto>> ListAsync(CancellationToken ct) =>
        repository.ListActiveAsync(clock.Today, ct);

    public async Task<(IReadOnlyList<HotelSummaryDto> Rows, int Total)> ListPagedAsync(
        int page, int pageSize, CancellationToken ct)
    {
        var total = await repository.CountActiveAsync(ct);
        var rows = await repository.ListActivePagedAsync(clock.Today, (page - 1) * pageSize, pageSize, ct);
        return (rows, total);
    }

    public async Task<HotelDetailDto> GetAsync(string rawId, CancellationToken ct)
    {
        var id = ResourceId.Parse(rawId, "id");
        var today = clock.Today;
        var hotel = await repository.FindActiveAsync(id, today, ct)
            ?? throw ApiException.NotFound("Khách sạn không tồn tại hoặc đã ngừng hợp tác.");
        var rooms = await repository.ListRoomTypesAsync(id, today, ct);
        var amenities = await repository.ListAmenitiesAsync(id, ct);
        var rules = await repository.FindHouseRulesAsync(id, ct);
        return new HotelDetailDto(hotel, rooms, amenities, rules);
    }
}
