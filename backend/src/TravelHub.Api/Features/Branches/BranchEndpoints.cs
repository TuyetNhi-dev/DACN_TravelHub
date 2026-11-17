using TravelHub.Api.Common.Http;

namespace TravelHub.Api.Features.Branches;

public static class BranchEndpoints
{
    public static void MapBranchEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapGet("/api/branches", async (BranchService service, CancellationToken ct) =>
            Results.Ok(ListResponse<BranchDto>.From(await service.ListAsync(ct)))).WithTags("Branches");
    }
}
