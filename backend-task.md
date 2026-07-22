# Backend Task: Business Code Authentication Flow

## Overview
Replace the current terminal activation flow (`POST /api/v1/auth/activate`) with a simpler business-code-based flow. A waiter device just needs a **business code** (short alphanumeric string generated from the admin dashboard) and a **staff PIN** to authenticate.

## Changes Needed

### 1. New DB Field: `business_code` on `businesses` table
- Add a unique `business_code` column (e.g., `varchar(12)`, like `'ABC123XY'`)
- Generate this code when a business is created (random 8-char alphanumeric)
- Show this code in the admin dashboard (business settings page) so the business owner can share it with their staff
- Ensure it's unique and indexed

### 2. New Endpoint: `POST /api/v1/auth/resolve-business`
**Request:**
```json
{ "business_code": "ABC123XY" }
```

**Response:**
```json
{
  "success": true,
  "data": {
    "business_id": "uuid-here",
    "business_name": "My Restaurant"
  }
}
```

**Error:** Return 404 with `{ "success": false, "message": "Invalid business code" }` if not found.

### 3. Modify `POST /api/v1/auth/waiter-login` (or create a new endpoint)
The existing endpoint takes `{ pin, business_id, branch_id }`. It should keep working as-is — the frontend will now pass `business_id` obtained from step 2 instead of from terminal activation.

No change needed if it already accepts `business_id`.

### 4. Remove / Deprecate `POST /api/v1/auth/activate`
The old terminal activation endpoint (`email + password`) is no longer used by the waiter app. Can be kept for admin app use or deprecated.

### 5. Admin Dashboard: Display Business Code
Add a UI element in the admin business settings showing the business code prominently (e.g., `"Your Business Code: ABC123XY"`) with a copy button. Generate on business creation if not set.

## Flow Summary
```
[Business Code Input] → POST /api/v1/auth/resolve-business → { business_id }
         ↓
    [PIN Input]       → POST /api/v1/auth/waiter-login { pin, business_id } → { token, user.role }
         ↓
    Route by role: waiter → /tables, supervisor → /supervisor/orders, chef → /chef, manager → /tables
```
