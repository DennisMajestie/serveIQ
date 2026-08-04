# Test the ServeIQ payment webhooks with dummy data.
#
# Usage:
#   .\test-webhook.ps1 -Provider monniepoint -TabId "<tab id>" -TrackingCode "<tracking code>"
#   .\test-webhook.ps1 -Provider opay -TabId "<tab id>" -TrackingCode "<tracking code>" -Secret ""
#
# Options:
#   -BaseUrl      Backend URL (default http://localhost:3000)
#   -Provider     "monniepoint" or "opay"
#   -TabId        Open tab id (required)
#   -TrackingCode Tab tracking code (required)
#   -Amount       Amount in kobo (default 1000 = N10.00)
#   -Secret       Webhook secret stored in the branch settings. If empty,
#                 the request is sent WITHOUT a signature (validation is skipped
#                 server-side when no secret is configured).
#   -TerminalId   POS terminal id (optional)

param(
    [string]$BaseUrl = "http://localhost:3000",
    [ValidateSet("monniepoint", "opay")]
    [string]$Provider = "monniepoint",
    [string]$TabId,
    [string]$TrackingCode,
    [int]$Amount = 1000,
    [string]$Secret = "whsec_test",
    [string]$TerminalId = "term_test"
)

$ErrorActionPreference = "Stop"

if (-not $TabId -or -not $TrackingCode) {
    Write-Host "TabId and TrackingCode are required." -ForegroundColor Yellow
    exit 1
}

# ── Step 1: create / fetch a payable bill for the tab ───────────────────────
$initBody = @{ tab_id = $TabId; tracking_code = $TrackingCode } | ConvertTo-Json
$init = Invoke-RestMethod -Method Post `
    -Uri "$BaseUrl/api/v1/public/payments/initialize" `
    -ContentType "application/json" `
    -Body $initBody

$reference = $init.payment_reference
if (-not $reference) {
    Write-Host "initialize did not return a payment_reference. Check tab/tracking code." -ForegroundColor Red
    exit 1
}

Write-Host "Bill created: $($init.bill_id)  reference: $reference  amount: $($init.amount_formatted)" -ForegroundColor Cyan

# ── Step 2: build the webhook payload ────────────────────────────────────────
if ($Provider -eq "monniepoint") {
    $payloadObj = @{
        data = @{
            reference   = $reference
            amount      = $Amount
            status      = "SUCCESSFUL"
            terminalId  = $TerminalId
        }
    }
    $endpoint = "webhooks/moniepoint"
    $headerName = "x-moniepoint-signature"
} else {
    $payloadObj = @{
        data = @{
            reference       = $reference
            amount          = $Amount
            status          = "SUCCESS"
            transactionType = "POS"
        }
    }
    $endpoint = "webhooks/opay"
    $headerName = "x-opay-signature"
}

# Serialize ONCE; the HMAC must be computed over these exact raw bytes.
$rawBody = $payloadObj | ConvertTo-Json -Depth 6 -Compress

$headers = @{}
if ($Secret) {
    $hmac = New-Object System.Security.Cryptography.HMACSHA512
    $hmac.Key = [Text.Encoding]::UTF8.GetBytes($Secret)
    $sig = [Convert]::ToHexString($hmac.ComputeHash([Text.Encoding]::UTF8.GetBytes($rawBody))).ToLower()
    $headers[$headerName] = $sig
    Write-Host "Signature: $sig" -ForegroundColor DarkGray
} else {
    Write-Host "No secret supplied - sending without a signature header." -ForegroundColor Yellow
}

# ── Step 3: send the webhook ─────────────────────────────────────────────────
Write-Host "POST /api/v1/public/payments/$endpoint" -ForegroundColor Cyan
$response = Invoke-RestMethod -Method Post `
    -Uri "$BaseUrl/api/v1/public/payments/$endpoint" `
    -ContentType "application/json" `
    -Headers $headers `
    -Body $rawBody

$response | ConvertTo-Json -Depth 5
