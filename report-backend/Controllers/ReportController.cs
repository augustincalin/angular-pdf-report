using System.Text.Json;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Hosting;
using Microsoft.Playwright;

namespace ReportBackend.Controllers;

/// <summary>
/// Provides API endpoints for report data and PDF generation.  This
/// controller exposes two routes:
///
///   GET /api/report-data – returns a JSON object with chart and table
///   data.  In this proof of concept the data is hard coded but it
///   could be retrieved from a database or external service.
///
///   GET /api/report-pdf – renders an HTML representation of the report
///   using Playwright and returns it as a PDF.  Before running this
///   endpoint you must run `npx playwright install` from the project
///   directory to download the Chromium browser used by Playwright.
/// </summary>
[ApiController]
[Route("api")]
public class ReportController : ControllerBase
{
    private readonly IWebHostEnvironment _env;

    public ReportController(IWebHostEnvironment env)
    {
        _env = env;
    }

    /// <summary>
    /// Hard coded fallback report data.  The client expects an object
    /// with chart and table properties; adjust this structure to match
    /// your front‑end model.  Numbers are sample values in thousands
    /// of euros.
    /// </summary>
    private static readonly object FallbackReport = new
    {
        chart = new
        {
            labels = new[] { "Q1", "Q2", "Q3", "Q4" },
            datasets = new[]
            {
                new
                {
                    label = "Sales (k€)",
                    data = new[] { 150, 200, 300, 250 },
                    backgroundColor = "rgba(54, 162, 235, 0.5)",
                    borderColor = "rgba(54, 162, 235, 1)",
                    borderWidth = 1
                }
            }
        },
        table = new
        {
            columns = new[] { "Product", "Units Sold", "Revenue (€)" },
            rows = new object[][]
            {
                new object[] { "Widget A", 120, 2400 },
                new object[] { "Widget B", 80, 1600 },
                new object[] { "Widget C", 150, 3750 },
                new object[] { "Widget D", 60, 900 }
            }
        }
    };

    /// <summary>
    /// Returns the report data as JSON.  In a production system you
    /// would likely retrieve this information from a database or an
    /// external API.  For this proof of concept it is static.
    /// </summary>
    [HttpGet("report-data")]
    public IActionResult GetReportData() => Ok(FallbackReport);

    /// <summary>
    /// Generates a PDF version of the report using Playwright.  The
    /// report is composed on the fly as an HTML document which is
    /// then rendered to PDF in headless Chromium.  Note that the
    /// Playwright browser must be installed ahead of time (run
    /// `npx playwright install` after restoring packages).
    /// </summary>
    [HttpGet("report-pdf")]
    public async Task<IActionResult> GetReportPdfAsync()
    {
        // Adjust baseUrl if your React app is hosted elsewhere (e.g. http://localhost:3000/)
        //var baseUrl = $"{Request.Scheme}://{Request.Host}";
        var reportUrl = $"http://localhost:3000";

        using var playwright = await Playwright.CreateAsync();
        await using var browser = await playwright.Chromium.LaunchAsync(new() { Headless = true });
        var page = await browser.NewPageAsync();

        // Navigate to the React report page and wait until network traffic has finished
        await page.GotoAsync(reportUrl, new() { WaitUntil = WaitUntilState.NetworkIdle });

        // Use print media to apply @media print styles (e.g. two-column layout)
        await page.EmulateMediaAsync(new() { Media = Media.Print });

        // Optionally, wait for a specific element to appear to ensure React has finished rendering
        // await page.WaitForSelectorAsync("#chart");

        var pdf = await page.PdfAsync(new PagePdfOptions
        {
            Format = "A4",
            PrintBackground = true,
            Margin = new() { Top = "15mm", Bottom = "15mm", Left = "15mm", Right = "15mm" }
        });

        return File(pdf, "application/pdf", "report.pdf");
    }
}