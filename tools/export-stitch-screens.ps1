$apiKey = $env:STITCH_API_KEY
$projectId = $env:STITCH_PROJECT_ID
$outputDir = "C:\Users\charl\.gemini\antigravity\scratch\serveiq\stitch-assets"

$screens = @(
    @{ id = "a788f7c1b65649b8881dd5cf0c4f0b9b"; name = "serveiq-admin-dashboard-luminous" }
    @{ id = "101590acb4214ad0a5dd5c61cc840b06"; name = "premium-admin-dashboard" }
    @{ id = "9c80f193273847958c09c5739c78ffdb"; name = "menu-management-luminous" }
    @{ id = "540c2aace8194549b53c06eaa760955d"; name = "staff-management-luminous" }
    @{ id = "47cba7d1e9234e8496968512ea448d62"; name = "admin-table-management-luminous" }
    @{ id = "3984e734ed894fcf8d51927cfcb64e99"; name = "sales-analytics-luminous" }
    @{ id = "44a5b067f67c498abef81d1fa44b9cf8"; name = "luminous-pulse-command-center" }
    @{ id = "530f6eb0078c40bf963161b56c219628"; name = "admin-settings-branch-luminous" }
    @{ id = "8045a0b86fb24b1680cd26a689abf33e"; name = "register-business-luminous" }
    @{ id = "f851cec9263f4669b12af6d95133a7f6"; name = "refined-branch-setup-management" }
    @{ id = "e3e21e291dd140dbb3eed448b4a7dd4d"; name = "nemotron-autopilot-control-center" }
    @{ id = "8d2b93b778154ca1890dc7928cf88216"; name = "serveiq-landing-page" }
    @{ id = "039c1bc946cc4303a5aeb93179f234fb"; name = "serveiq-living-landing-page" }
    @{ id = "8248111319194d9e8c75ae2f0847588a"; name = "admin-tab-detail-view" }
    @{ id = "58a95e1f84da4560b67840d84c513402"; name = "admin-login" }
    @{ id = "38928abe8879487aad46b314b50f5482"; name = "luminous-tables-overview" }
    @{ id = "5f2bbd81d8144200aed029ad89f5406b"; name = "tab-detail-table5-luminous" }
    @{ id = "64337d60ee4a46529a1ddb0e7b1e937d"; name = "menu-browser-luminous" }
    @{ id = "78c6f336971a483cadc895ff11c25b07"; name = "waiter-tab-history-luminous" }
    @{ id = "205b46e9015e437ea9ca20603ec1de1a"; name = "payment-success-receipt" }
    @{ id = "a73a1ebff4b444fab45a8c58edcc0047"; name = "payment-success-luminous" }
    @{ id = "f2a187532d6a49c2bad2a933c513343e"; name = "billing-settle-luminous-pulse" }
    @{ id = "70c8cddd3e784fdebf0bd890009648d8"; name = "waiter-login-luminous" }
    @{ id = "951ec2d88efa4024a0b239caea36df59"; name = "billing-review-table5" }
)

$headers = @{ "X-Goog-Api-Key" = $apiKey }

foreach ($screen in $screens) {
    Write-Output "Exporting $($screen.name)..."
    
    $body = @{
        jsonrpc = "2.0"
        id = 1
        method = "tools/call"
        params = @{
            name = "get_screen"
            arguments = @{
                name = "projects/$projectId/screens/$($screen.id)"
                projectId = $projectId
                screenId = $screen.id
            }
        }
    } | ConvertTo-Json

    try {
        $response = Invoke-RestMethod -Uri "https://stitch.googleapis.com/mcp" -Method Post -Body $body -ContentType "application/json" -Headers $headers
        $data = $response.result.structuredContent
        
        if ($data.htmlCode.downloadUrl) {
            $htmlPath = Join-Path $outputDir "$($screen.name).html"
            Invoke-RestMethod -Uri $data.htmlCode.downloadUrl -OutFile $htmlPath
            Write-Output "  Saved HTML: $($screen.name).html"
        }
        
        if ($data.screenshot.downloadUrl) {
            $imgPath = Join-Path $outputDir "$($screen.name)-screenshot.png"
            Invoke-RestMethod -Uri $data.screenshot.downloadUrl -OutFile $imgPath
            Write-Output "  Saved screenshot: $($screen.name)-screenshot.png"
        }
    } catch {
        Write-Output "  ERROR: $_"
    }
    
    Start-Sleep -Milliseconds 500
}

Write-Output "`nDone! All screens exported to $outputDir"
