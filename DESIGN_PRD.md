# ServeIQ — Design Product Requirements Document (DESIGN_PRD)
## Version 1.0 — Screen Specifications & Brand Tokens

---

## 1. Introduction
This document contains the visual identity and screen-by-screen prompts for the ServeIQ V1 platform. It is designed to be consumed by a UI generation agent via the Google Stitch MCP.

---

## 2. Brand Tokens

### 2.1 Waiter Mobile App (Dark Theme)
- **Background**: `#0F0F0F` (True Dark)
- **Surface**: `#1A1A1A` (Elevation 1)
- **Primary Accent**: `#F97316` (ServeIQ Orange)
- **Text Primary**: `#FFFFFF` (White)
- **Text Secondary**: `#9CA3AF` (Grey)
- **Success**: `#22C55E` (Green)
- **Error/Occupied**: `#EF4444` (Red)
- **Warning/Reserved**: `#EAB308` (Yellow)
- **Border Radius**: `12px`
- **Minimum Tap Target**: `48px`
- **Font**: Inter (Main), JetBrains Mono (Receipts)

### 2.2 Admin Web App (Light Theme)
- **Background**: `#FFFFFF` (White)
- **Surface**: `#F9FAFB` (Light Grey)
- **Primary Accent**: `#F97316` (ServeIQ Orange)
- **Text Primary**: `#111827` (Dark Blue/Grey)
- **Text Secondary**: `#6B7280` (Grey)
- **Border Radius**: `12px`
- **Font**: Inter

---

## 3. Session 1: Waiter Mobile App Prompts

### Screen 1: Login (`waiter-01-login`)
> **Prompt for Stitch**:  
> Create a high-fidelity mobile login screen for the ServeIQ Waiter App. Dark theme. 
> Features:
> - Large centered ServeIQ logo (placeholder icon + text)
> - Welcome message "Welcome back, Waiter"
> - Input fields for Phone Number and PIN/Password (large tap targets)
> - Primary "Login" button in brand orange (#F97316)
> - "Forgot Password" link in secondary text style
> - Subtle background texture or gradient

### Screen 2: Tables Overview (`waiter-02-tables`)
> **Prompt for Stitch**:  
> Create a mobile "Tables Overview" screen using a grid layout. 
> Features:
> - Header with "Main Branch" and a sync status indicator (green dot)
> - Grid of cards representing tables (e.g., Table 1 to Table 12)
> - Table cards must be color-coded: Available (Green border/accent #22C55E), Occupied (Red border/accent #EF4444), Reserved (Yellow border/accent #EAB308)
> - Occupied cards should display the customer name and current running total badge
> - Bottom navigation: Tables, Active Tabs, History, Profile

### Screen 3: Open Tab Modal (`waiter-03-open-tab`)
> **Prompt for Stitch**:  
> Create a centered mobile modal for opening a new tab.
> Features:
> - Title "Open New Tab — Table 5"
> - Input field: "Customer Name (Optional)"
> - Input field: "Number of People (Default: 1)"
> - Actions: "Cancel" (outline) and "Open Tab" (solid orange #F97316)
> - Modal should have a semi-transparent dark backdrop

### Screen 4: Tab Detail / Active Order (`waiter-04-tab-detail`)
> **Prompt for Stitch**:  
> Create the core "Tab Detail" screen for an active order.
> Features:
> - Sticky header: "TAB-2026-00015 | Table 5" with customer name and "Open for 42m"
> - List view grouped by "Rounds" (e.g., Round 1 — 8:42 PM, Round 2 — 9:15 PM)
> - Each item shows: Name, Qty with +/- adjusters (48px tap targets), and Subtotal
> - Sticky footer: Large "Total: ₦11,300" with a primary "Add Items" button (orange) and a secondary "Generate Bill" button

### Screen 5: Menu Browse + Item Selection (`waiter-05-menu`)
> **Prompt for Stitch**:  
> Create a mobile "Menu Browse" screen for picking items.
> Features:
> - Top search bar "Search drinks or food..."
> - Horizontal category chips: "All", "Drinks", "Food", "Spirits", "Cocktails"
> - Grid or list of item cards: Image placeholder, Name, Price, "Add" button
> - Floating "View Selection (3 items — ₦8,500)" bar at the bottom

### Screen 6: Running Bill View (`waiter-06-running-bill`)
> **Prompt for Stitch**:  
> Create a clean "Running Bill" preview screen to show customers.
> Features:
> - Itemized bill matching the PRD format (Round 1, Round 2, etc.)
> - Clear price breakdown: Subtotal, Service Charge (5%), Total
> - "This is not a final receipt" disclaimer at bottom
> - Actions: "Edit Order" and "Proceed to Payment"

### Screen 7: Payment Recording (`waiter-07-payment`)
> **Prompt for Stitch**:  
> Create a mobile "Payment Recording" screen.
> Features:
> - Large total ₦11,300 at the top
> - Payment method selector (Tiles/Buttons): "Cash", "Bank Transfer", "POS Terminal"
> - When "Bank Transfer" or "POS" is selected, show an "Invoice/Reference Number" input field
> - Giant "Confirm Payment & Close Tab" button in brand orange

### Screen 8: Receipt (`waiter-08-receipt`)
> **Prompt for Stitch**:  
> Create a mobile-friendly "Digital Receipt" screen.
> Features:
> - Centered layout using monospace font (JetBrains Mono)
> - Visual representation of a thermal receipt with "zig-zag" top and bottom edges
> - Includes Business logo, Address, Order details, and a large "PAID" watermark
> - Actions: "Download PDF", "Share to WhatsApp", and "New Order" (full-width orange)

### Screen 9: Tab History (`waiter-09-history`)
> **Prompt for Stitch**:  
> Create a "Tab History" list screen for the waiter.
> Features:
> - Filter tabs: "Today", "Yesterday", "This Week"
> - List of closed tabs: Time, Table Number, Total Amount, Payment Method
> - Summary card at the top: "Your Sales Today: ₦42,500 | 12 Tabs"

---

## 4. Session 2: Admin Web App Prompts

### Screen 1: Register Business (`admin-01-register`)
> **Prompt for Stitch**:  
> Create a modern web landing/registration page (1280px). Light theme.
> Features:
> - Left side: High-quality illustration or image of a busy restaurant
> - Right side: Registration form (Business Name, Owner Name, Email, Password, Subscription Plan toggle)
> - Brand colors used for highlights and buttons

### Screen 2: Login (`admin-02-login`)
> **Prompt for Stitch**:  
> Create a minimalist admin login page (1280px).
> Features:
> - Centered card layout
> - ServeIQ Logo
> - Email and Password fields
> - "Login to Dashboard" button
> - "Need help? Contact support" link

### Screen 3: Sales Dashboard (`admin-03-dashboard`)
> **Prompt for Stitch**:  
> Create a comprehensive admin dashboard (1280px).
> Features:
> - Sidebar navigation: Dashboard, Tables, Menu, Waiters, Reports, Settings
> - Top row: 4 Metric cards (Total Revenue, Open Tabs, Active Waiters, Avg. Tab Value)
> - Middle: Large "Live Table Grid" with color-coded table statuses
> - Right Sidebar: "Recent Activities" feed (New Tabs, Payments Received)

### Screen 4: Tables Management (`admin-04-tables`)
> **Prompt for Stitch**:  
> Create a management view for restaurant tables (1280px).
> Features:
> - "Add New Table" floating action or top-right button
> - Card-based list showing Table Name, Capacity, and current Status
> - Inline "Edit" and "Deactivate" actions per table

### Screen 5: Menu Management (`admin-05-menu`)
> **Prompt for Stitch**:  
> Create a "Menu Management" screen (1280px).
> Features:
> - Split view: Left (Categories list), Right (Items in selected category)
> - Each item shows Price, Availability toggle, and Edit icon
> - "Add Category" and "Add Item" buttons

### Screen 6: Waiter Management (`admin-06-waiters`)
> **Prompt for Stitch**:  
> Create a staff management screen (1280px).
> Features:
> - Table list of waiters: Name, Email, Total Sales (Today), Status (Active/Inactive)
> - "Invite New Waiter" button opens a side-panel form
> - Performance trend chart at the bottom

### Screen 7: Tab Detail View (`admin-07-tab-detail`)
> **Prompt for Stitch**:  
> Create a read-only detailed view for a specific tab (1280px).
> Features:
> - Full audit history of the tab: When opened, every item added (by whom), and when paid
> - Visual bill representation similar to the receipt
> - "Print for Audit" button

### Screen 8: Settings (`admin-08-settings`)
> **Prompt updated for Stitch**:  
> Create a standard admin settings page (1280px).
> Features:
> - Tabbed interface: Business Profile, Branch Details, Account Security, Billing
> - Form for changing business name, logo, and contact info
> - "Save Changes" sticky bar at the bottom

---

## 7. Annotation Checklist (UI/UX Rules)

- [ ] **Sticky Footer**: Running total is pin-to-bottom on mobile `Tab Detail`.
- [ ] **Tap Targets**: All buttons and adjusters are minimum `48x48px`.
- [ ] **Table Status**: Available=#22C55E, Occupied=#EF4444, Reserved=#EAB308.
- [ ] **Typography**: Use JetBrains Mono for the `Receipt` screen.
- [ ] **Conditional Logic**: Show "Reference Field" ONLY for Transfer/POS payment methods.
- [ ] **Admin Layout**: Dashboards must use a 4-column card layout for stats.
- [ ] **Mobile Theme**: Pure dark theme (#0F0F0F) only for waiter app.
- [ ] **Icons**: Use outlined icon family, size `24px`.
- [ ] **Currency**: Format all amounts with the Naira (₦) symbol.

---
*End of DESIGN_PRD.md*
