using MySqlConnector;
using TravelHub.Api.Common.Http;
using TravelHub.Api.Data;
using TravelHub.Api.Features.Admin.Access;
using TravelHub.Api.Features.Auth;

namespace TravelHub.Api.Features.Admin.Context;

public sealed record AdminCapabilitiesDto(bool ManageCatalog, bool ViewAudit, bool ManageStaff);

public sealed record AdminContextDto(string UserId, string FullName, string Role,
    IReadOnlyList<ScopeOptionDto> ScopeOptions, AdminCapabilitiesDto Capabilities);

public sealed record LookupDto(string Id, string Name);

public sealed record BranchLookupDto(string Id, string Code, string Name, string? RegionId, string? RegionName,
    bool CanManage);

public sealed record AdminLookupsDto(IReadOnlyList<LookupDto> Destinations, IReadOnlyList<LookupDto> DepartureLocations,
    IReadOnlyList<LookupDto> Categories, IReadOnlyList<LookupDto> Regions, IReadOnlyList<BranchLookupDto> Branches);

/// <summary>What the admin shell needs before showing any page: who you are, your scopes, what you may do.</summary>
public sealed class AdminContextService(AdminAccessService accessService, OrganizationRepository organization,
    MySqlConnectionFactory connections)
{
    private static readonly string[] RoleOrder = [RoleCodes.Admin, RoleCodes.BranchManager, RoleCodes.Staff];

    public async Task<AdminContextDto> GetAsync(Account account, CancellationToken ct)
    {
        var access = await accessService.RequireAsync(account, ct);
        var role = RoleOrder.First(code => account.User.Roles.Any(r => r.Code == code)
            && (code != RoleCodes.Admin || access.IsAdmin));
        return new AdminContextDto(account.User.Id, account.User.FullName, role,
            AdminScopeRules.Options(access, await accessService.BranchesAsync(ct)),
            new AdminCapabilitiesDto(access.CanManageCatalog, access.CanViewAudit, access.CanManageStaff));
    }

    public async Task<AdminLookupsDto> LookupsAsync(Account account, CancellationToken ct)
    {
        var access = await accessService.RequireAsync(account, ct);
        var branches = (await accessService.BranchesAsync(ct)).Select(b => new BranchLookupDto(
            ResourceId.Format(b.Id), b.Code, b.Name, b.RegionId is { } r ? ResourceId.Format(r) : null, b.RegionName,
            access.Manage.Covers(b.Id))).ToList();
        var regions = (await organization.ListRegionsAsync(ct))
            .Select(r => new LookupDto(ResourceId.Format(r.Id), r.Name)).ToList();
        return new AdminLookupsDto(
            await ListAsync("SELECT id, name FROM locations WHERE location_type <> 'airport' ORDER BY name", ct),
            await ListAsync("SELECT id, name FROM locations WHERE location_type IN ('city', 'province') ORDER BY name",
                ct),
            await ListAsync("SELECT id, name FROM tour_categories ORDER BY name", ct),
            regions, branches);
    }

    private async Task<IReadOnlyList<LookupDto>> ListAsync(string sql, CancellationToken ct)
    {
        await using var connection = await connections.OpenAsync(ct);
        await using var command = new MySqlCommand(sql, connection);
        return await command.ReadAllAsync(r => new LookupDto(r.GetId("id"), r.GetString("name")), ct);
    }
}
