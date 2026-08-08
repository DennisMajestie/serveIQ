# ServeIQ payment-path smoke test.
#
# Exercises the payment flows end-to-end against a live backend:
#   1. Manual / waiter payment   (JWT)  ->  POST /api/v1/bills/tab/:tabId/pay
#   2. Moniepoint webhook              ->  POST /api/v1/public/payments/webhooks/moniepoint
#   3. OPay webhook                    ->  POST /api/v1/public/payments/webhooks/opay
#   4. (optional) Paystack subscription webhook -> POST /api/v1/webhooks/paystack
#
# Usage:
#   .\scripts\payment-smoke.ps1 -BaseUrl "https://serveiq-backend.onrender.com" `
#       -Email "admin@your-restaurant.com" -Pass "secret"
#
# Options:
#   -BaseUrl     Backend base URL (default http://localhost:3000)
#   -Email       Admin email (used to get a JWT for the "manual pay" path)
#   -Pass        Admin password
#   -MenuName    Optional: pick a specific menu item by name; otherwise the first
#                available menu item is used.
#   -Secret      Moniepoint/OPay webhook secret from branch settings (HMAC-SHA512).
#                If empty, webhooks are sent WITHOUT a signature (the server skips
#                validation when no provider config exists).
#   -PaystackSecret  Paystack secret key used to sign the Paystack webhook.
#                If empty, the Paystack step is skipped.

param(
    [string]$BaseUrl = "http://localhost:3000",
    [string]$Email,
    [string]$Pass,
    [string]$MenuName = "",
    [string]$Secret = "whsec_test",
    [string]$PaystackSecret = ""
)

$ErrorActionPreference = "Stop"
$api = "$BaseUrl/api/v1"

# ── helpers ─────────────────────────────────────────────────────────────────
function Get-Data {
    param($Response)
    if ($Response.PSObject.Properties.Name -contains "data") {
        return $Response.data
    }
    return $Response
}

function Invoke-Api {
    param(
        [string]$Method = "GET",
        [string]$Path,
        $Body = $null,
        [string]$Token = ""
    )
    $params = @{
        Method      = $Method
        Uri         = "$api$Path"
        ContentType = "application/json"
    }
    if ($null -ne $Body) { $params.Body = ($Body | ConvertTo-Json -Depth 8) }
    if ($Token) { $params.Headers = @{ Authorization = "Bearer $Token" } }
    return (Get-Data (Invoke-RestMethod @params))
}

function Pick-First {
    param($Value, $Fallback)
    if ($null -ne $Value -and "$Value" -ne "") { return $Value }
    return $Fallback
}

function New-HmacSha512 {
    param([string]$Body, [string]$Secret)
    $hmac = New-Object System.Security.Cryptography.HMACSHA512
    $hmac.Key = [Text.Encoding]::UTF8.GetBytes($Secret)
    return [Convert]::ToHexString($hmac.ComputeHash([Text.Encoding]::UTF8.GetBytes($Body))).ToLower()
}

function Open-TabForSmoke {
    param([string]$Token)
    return (Invoke-Api -Method POST -Path "/tabs/open" -Body (@{
        tab_type      = "takeaway"
        customer_name = "Smoke Test"
    }) -Token $Token)
}

function Add-OrderItems {
    param([string]$TabId, [string]$ItemId, [string]$Token)
    $payload = @(@{
        menu_item_id    = $ItemId
        quantity        = 2
        fulfillment_type = "pack"
    })
    return (Invoke-Api -Method POST -Path "/orders/tab/$TabId" -Body $payload -Token $Token)
}

function Get-TabStatus {
    param([string]$TabId, [string]$Token)
    return (Invoke-Api -Method GET -Path "/tabs/$TabId" -Token $Token)
}

function Assert-True {
    param([string]$Label, $Condition)
    if ($Condition) {
        Write-Host "  [PASS] $Label" -ForegroundColor Green
        return $true
    }
    Write-Host "  [FAIL] $Label" -ForegroundColor Red
    return $false
}

function Step-Summary {
    param([string]$Label, $result)
    if ($result) {
        Write-Host "  [PASS] $Label" -ForegroundColor Green
    } else {
        Write-Host "  [FAIL] $Label" -ForegroundColor Red
        $script:failures++
    }
}

$script:failures = 0

Write-Host ""
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host " ServeIQ Payment-Path Smoke Test" -ForegroundColor Cyan
Write-Host " Target: $api" -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan

# ── 0. Authenticate ─────────────────────────────────────────────────────────
if (-not $Email -or -not $Pass) {
    Write-Host "Email and Pass are required." -ForegroundColor Red
    exit 1
}
$login = Get-Data (Invoke-RestMethod -Method Post -Uri "$api/auth/login" `
    -ContentType "application/json" `
    -Body (@{ email = $Email; password = $Pass } | ConvertTo-Json))
$token = $(Pick-First $login.access_token $login.token)
if (-not $token) {
    Write-Host "Login failed - no access_token returned." -ForegroundColor Red
    exit 1
}
Write-Host ""
Write-Host "[OK] Logged in as $Email" -ForegroundColor Cyan

# ── 1. Pick a menu item ─────────────────────────────────────────────────────
$menu = Invoke-Api -Method GET -Path "/menu?per_page=20" -Token $token
$items = if ($menu.PSObject.Properties.Name -contains "meta") { $menu.data } else { $menu }
$item = if ($MenuName) {
    @($items | Where-Object { $_.name -like "*$MenuName*" } | Select-Object -First 1)
} else {
    @($items | Select-Object -First 1)
}
if (-not $item) {
    Write-Host "No menu items found for branch. Cannot continue." -ForegroundColor Red
    exit 1
}
$menuItemId = $item.id
$unitPrice = $(Pick-First $item.price_kobo $item.priceKobo)
Write-Host "[OK] Using menu item: $($item.name)  (id: $menuItemId, unit: $unitPrice kobo)" -ForegroundColor Cyan

# ── PATH 1 - Manual / waiter payment ────────────────────────────────────────
Write-Host ""
Write-Host "== PATH 1: Manual payment (JWT) ==" -ForegroundColor Blue
$tab1 = Open-TabForSmoke $token
$tab1Id = $tab1.id
$tracking1 = $(Pick-First $tab1.tracking_code $tab1.trackingCode)
Write-Host "  Opened tab $tab1Id (tracking $tracking1)"

Add-OrderItems -TabId $tab1Id -ItemId $menuItemId -Token $token | Out-Null

$bill1 = Invoke-Api -Method POST -Path "/bills/tab/$tab1Id/generate" -Body @{} -Token $token
$billTotal = $(Pick-First $bill1.total_kobo $bill1.totalKobo)
Write-Host "  Bill generated: total $billTotal kobo"

$payResp = Invoke-Api -Method POST -Path "/bills/tab/$tab1Id/pay" `
    -Body @{ amount = $billTotal; method = "cash" } -Token $token
Write-Host "  pay response: $($payResp | ConvertTo-Json -Depth 5 -Compress)"
Step-Summary "(1a) manual pay accepted" ($null -ne $payResp)

$tabCheck = Get-TabStatus -TabId $tab1Id -Token $token
Step-Summary "(1b) tab status = paid after manual pay" ($tabCheck.status -eq "paid")

# ── PATH 2/3: Webhook flows (self-service) ──────────────────────────────────
Write-Host ""
Write-Host "== PATH 2/3: Moniepoint & OPay webhooks ==" -ForegroundColor Blue

# --- Moniepoint ---
$tab2 = Open-TabForSmoke $token
$tab2Id = $tab2.id
$tracking2 = $(Pick-First $tab2.tracking_code $tab2.trackingCode)
Add-OrderItems -TabId $tab2Id -ItemId $menuItemId -Token $token | Out-Null

$init2 = Invoke-Api -Method POST -Path "/public/payments/initialize" `
    -Body @{ tab_id = $tab2Id; tracking_code = $tracking2 }
$ref2 = $(Pick-First $init2.payment_reference $init2.paymentReference)
$amount2 = $(Pick-First $init2.amount_kobo $init2.amountKobo)
if (-not $ref2) {
    Write-Host "  [FAIL] initialize did not return a payment_reference." -ForegroundColor Red
    $script:failures++
} else {
    Write-Host "  Self-service bill ready: ref $ref2  amount $amount2 kobo"

    $monoBody = @{ data = @{ reference = $ref2; amount = $amount2; status = "SUCCESSFUL"; terminalId = "term_smoke" } } |
        ConvertTo-Json -Depth 6 -Compress
    $monieHeaders = @{}
    if ($Secret) {
        $monieHeaders["x-moniepoint-signature"] = New-HmacSha512 -Body $monoBody -Secret $Secret
    }
    try {
        $monieResp = Get-Data (Invoke-RestMethod -Method POST -Uri "$api/public/payments/webhooks/moniepoint" `
            -ContentType "application/json" -Headers $monieHeaders -Body $monoBody)
        Step-Summary "(2a) moniepoint webhook -> processed" ($monieResp.status -eq "processed")
    } catch {
        Write-Host "  [FAIL] moniepoint webhook error: $($_.Exception.Message)" -ForegroundColor Red
        $script:failures++
    }
    $status2 = Get-Data (Invoke-RestMethod -Method GET -Uri "$api/public/payments/status?tab_id=$tab2Id&tracking_code=$tracking2")
    Step-Summary "(2b) moniepoint: payment_status = paid" ($status2.payment_status -eq "paid")

    # --- OPay (needs its own unpaid bill) ---
    $tab3 = Open-TabForSmoke $token
    $tab3Id = $tab3.id
    $tracking3 = $(Pick-First $tab3.tracking_code $tab3.trackingCode)
    Add-OrderItems -TabId $tab3Id -ItemId $menuItemId -Token $token | Out-Null
    $init3 = Invoke-Api -Method POST -Path "/public/payments/initialize" -Body @{ tab_id = $tab3Id; tracking_code = $tracking3 }
    $ref3 = $(Pick-First $init3.payment_reference $init3.paymentReference)
    $amount3 = $(Pick-First $init3.amount_kobo $init3.amountKobo)

    if (-not $ref3) {
        Write-Host "  [FAIL] OPay initialize did not return a payment_reference." -ForegroundColor Red
        $script:failures++
    } else {
        $opayBody = @{ data = @{ reference = $ref3; amount = $amount3; status = "SUCCESS"; transactionType = "POS" } } |
            ConvertTo-Json -Depth 6 -Compress
        $opayHeaders = @{}
        if ($Secret) {
            $opayHeaders["x-opay-signature"] = New-HmacSha512 -Body $opayBody -Secret $Secret
        }
        try {
            $opayResp = Get-Data (Invoke-RestMethod -Method POST -Uri "$api/public/payments/webhooks/opay" `
                -ContentType "application/json" -Headers $opayHeaders -Body $opayBody)
            Step-Summary "(3a) opay webhook -> processed" ($opayResp.status -eq "processed")
        } catch {
            Write-Host "  [FAIL] opay webhook error: $($_.Exception.Message)" -ForegroundColor Red
            $script:failures++
        }
        $status3 = Get-Data (Invoke-RestMethod -Method GET -Uri "$api/public/payments/status?tab_id=$tab3Id&tracking_code=$tracking3")
        Step-Summary "(3b) opay: payment_status = paid" ($status3.payment_status -eq "paid")
    }
}

# ── PATH 4 (optional): Paystack subscription webhook ────────────────────────
if ($PaystackSecret) {
    Write-Host ""
    Write-Host "== PATH 4: Paystack charge.success ==" -ForegroundColor Blue
    $paystackBody = @{
        event = "charge.success"
        data  = @{ reference = "SUB_SMOKE"; amount = 1000 }
    } | ConvertTo-Json -Depth 6 -Compress
    $sig = New-HmacSha512 -Body $paystackBody -Secret $PaystackSecret
    try {
        $psResp = Invoke-RestMethod -Method Post -Uri "$api/webhooks/paystack" `
            -ContentType "application/json" -Headers @{ "x-paystack-signature" = $sig } -Body $paystackBody
        Step-Summary "(4a) paystack webhook accepted" ($psResp.status -eq $true)
    } catch {
        Write-Host "  [FAIL] paystack webhook error: $($_.Exception.Message)" -ForegroundColor Red
        $script:failures++
    }
}

Write-Host ""
if ($script:failures -gt 0) {
    Write-Host "SUMMARY: $script:failures FAILURE(S)" -ForegroundColor Red
    exit 1
} else {
    Write-Host "SUMMARY: all checks passed" -ForegroundColor Green
    exit 0
}
