namespace TravelHub.Api.Features.Branches;

public sealed class BranchService(BranchRepository repository)
{
    /// <summary>Active offices for the public directory, grouped by region order.</summary>
    public Task<IReadOnlyList<BranchDto>> ListAsync(CancellationToken ct) => repository.ListActiveAsync(ct);
}
