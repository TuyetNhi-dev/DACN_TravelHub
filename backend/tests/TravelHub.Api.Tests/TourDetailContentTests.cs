using Microsoft.Extensions.Options;
using TravelHub.Api.Common.Errors;
using TravelHub.Api.Common.Time;
using TravelHub.Api.Configuration;
using TravelHub.Api.Data;
using TravelHub.Api.Features.Tours;

namespace TravelHub.Api.Tests;

/// <summary>Photos and "giá bao gồm / không bao gồm" on GET /api/tours/{id}.</summary>
public sealed class TourDetailContentTests
{
    private const string Photo = "https://images.unsplash.com/photo-1?auto=format";

    private sealed class FixedTime(DateTimeOffset now) : TimeProvider
    {
        public override DateTimeOffset GetUtcNow() => now;
    }

    // No database is configured, so any query throws DatabaseConfigurationException: a test can tell whether a
    // code path reached the database at all.
    private static TourService ServiceWithoutDatabase() => new(
        new TourRepository(new MySqlConnectionFactory(Options.Create(new DatabaseOptions()))),
        new VietnamClock(new FixedTime(new DateTimeOffset(2026, 11, 21, 3, 0, 0, TimeSpan.Zero))));

    [Fact]
    public void Cover_photo_comes_first_whatever_order_the_rows_arrive_in()
    {
        var images = TourService.ToImages([
            new TourImageRow(Photo + "&n=3", "Ba", 30),
            new TourImageRow(Photo + "&n=1", "Một", 10),
            new TourImageRow(Photo + "&n=2", "Hai", 20),
        ]);

        Assert.Equal(["Một", "Hai", "Ba"], images.Select(image => image.Alt));
    }

    [Fact]
    public void Photos_with_equal_sort_order_keep_the_repository_order()
    {
        var images = TourService.ToImages([
            new TourImageRow(Photo + "&a", null, 0), new TourImageRow(Photo + "&b", null, 0),
        ]);

        Assert.Equal([Photo + "&a", Photo + "&b"], images.Select(image => image.Url));
    }

    [Theory]
    [InlineData("http://images.unsplash.com/photo-1")]
    [InlineData("/images/tour.jpg")]
    [InlineData("javascript:alert(1)")]
    [InlineData("   ")]
    public void Only_absolute_https_photos_are_sent_to_the_page(string url)
    {
        var images = TourService.ToImages([new TourImageRow(url, "x", 10), new TourImageRow(Photo, "ok", 20)]);

        Assert.Equal("ok", Assert.Single(images).Alt);
    }

    [Fact]
    public void Photo_urls_and_captions_are_trimmed_and_a_blank_caption_becomes_null()
    {
        var image = Assert.Single(TourService.ToImages([new TourImageRow($"  {Photo} ", "  ", 10)]));

        Assert.Equal(Photo, image.Url);
        Assert.Null(image.Alt);
    }

    [Fact]
    public void Inclusion_lines_are_split_into_included_and_excluded_in_their_original_order()
    {
        var inclusions = TourService.ToInclusions([
            new TourInclusionRow("Xe đưa đón", true),
            new TourInclusionRow("Chi phí cá nhân", false),
            new TourInclusionRow(" Khách sạn 3 sao ", true),
            new TourInclusionRow("Thuế VAT", false),
            new TourInclusionRow("  ", true),
        ]);

        Assert.Equal(["Xe đưa đón", "Khách sạn 3 sao"], inclusions.Included);
        Assert.Equal(["Chi phí cá nhân", "Thuế VAT"], inclusions.Excluded);
    }

    [Fact]
    public void A_tour_without_rows_has_empty_lists_so_the_page_falls_back_to_illustrations()
    {
        Assert.Empty(TourService.ToImages([]));
        var inclusions = TourService.ToInclusions([]);
        Assert.Empty(inclusions.Included);
        Assert.Empty(inclusions.Excluded);
    }

    [Fact]
    public async Task An_invalid_tour_id_is_rejected_before_any_query()
    {
        var service = ServiceWithoutDatabase();

        await Assert.ThrowsAsync<ApiValidationException>(() => service.GetAsync("1 OR 1=1", CancellationToken.None));
        // A well-formed id does reach the (unconfigured) database.
        await Assert.ThrowsAsync<DatabaseConfigurationException>(() => service.GetAsync("1", CancellationToken.None));
    }

    [Fact]
    public async Task Image_and_inclusion_queries_go_through_the_connection_factory()
    {
        var repository = new TourRepository(new MySqlConnectionFactory(Options.Create(new DatabaseOptions())));

        await Assert.ThrowsAsync<DatabaseConfigurationException>(
            () => repository.ListImagesAsync(1, CancellationToken.None));
        await Assert.ThrowsAsync<DatabaseConfigurationException>(
            () => repository.ListInclusionsAsync(1, CancellationToken.None));
    }
}
