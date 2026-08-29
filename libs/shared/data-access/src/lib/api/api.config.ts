// API Configuration — aligned with ServeIQ REST API v1
export const API_CONFIG = {
  baseUrl: 'http://localhost:4205',
  nemotronBaseUrl: 'https://integrate.api.nvidia.com',
  timeout: 30000,
  endpoints: {
    // Auth
    auth: {
      login: '/api/v1/auth/login',
      register: '/api/v1/auth/register',
      refresh: '/api/v1/auth/refresh',
      logout: '/api/v1/auth/logout',
      activate: '/api/v1/auth/activate',
      resolveBusiness: '/api/v1/auth/resolve-business',
      staffLogin: '/api/v1/auth/waiter-login',
      forgotPassword: '/api/v1/auth/forgot-password',
      resetPassword: '/api/v1/auth/reset-password',
      sendVerification: '/api/v1/auth/send-verification',
      verifyEmail: '/api/v1/auth/verify-email',
    },
    // Upload
    upload: '/api/v1/upload',
    // Users
    users: {
      me: '/api/v1/user/me',
      waiters: '/api/v1/user/waiters',
      resetPin: '/api/v1/user/waiters/:id/reset-pin',
      update: '/api/v1/user/:id',
      delete: '/api/v1/user/:id',
      deactivate: '/api/v1/user/:id/deactivate',
    },
    // Business
    business: {
      get: '/api/v1/businesses/me',
      update: '/api/v1/businesses/me',
    },
    // Branches
    branches: {
      list: '/api/v1/branches',
      get: '/api/v1/branches/:id',
      create: '/api/v1/branches',
      update: '/api/v1/branches/:id',
      delete: '/api/v1/branches/:id',
      stats: '/api/v1/branches/dashboard/stats',
      businessKpis: '/api/v1/branches/business/kpis',
      generateQr: '/api/v1/branches/:id/generate-qr',
      paymentProviders: '/api/v1/branches/payment-providers',
    },
    // Menu
    menu: {
      list: '/api/v1/menu',
      get: '/api/v1/menu/:id',
      create: '/api/v1/menu',
      update: '/api/v1/menu/:id',
      delete: '/api/v1/menu/:id',
    },
    // Menu categories
    menuCategories: {
      list: '/api/v1/menu-categories',
      create: '/api/v1/menu-categories',
    },
    // Units
    units: {
      list: '/api/v1/units',
      create: '/api/v1/units',
    },
    // Tables
    tables: {
      list: '/api/v1/tables',
      get: '/api/v1/tables/:id',
      create: '/api/v1/tables',
      update: '/api/v1/tables/:id',
      delete: '/api/v1/tables/:id',
      updateStatus: '/api/v1/tables/:id/status',
      release: '/api/v1/tables/:id/release',
    },
    // Tabs
    tabs: {
      list: '/api/v1/tabs',
      get: '/api/v1/tabs/:id',
      open: '/api/v1/tabs/open',
      close: '/api/v1/tabs/:id/close',
      void: '/api/v1/tabs/:id/void',
      transfer: '/api/v1/tabs/:id/transfer',
      merge: '/api/v1/tabs/:id/merge',
      delete: '/api/v1/tabs/:id',
      waiterList: '/api/v1/tabs/waiter-list',
    },
    // Orders
    orders: {
      byTab: '/api/v1/orders/tab/:tabId',
      get: '/api/v1/orders/:id',
      update: '/api/v1/orders/:id',
      delete: '/api/v1/orders/:id',
      cancel: '/api/v1/orders/:id/cancel',
      pending: '/api/v1/orders/pending',
      approve: '/api/v1/orders/:id/approve',
      decline: '/api/v1/orders/:id/decline',
      preparing: '/api/v1/orders/preparing',
      readyForPickup: '/api/v1/orders/ready-for-pickup',
      pendingCash: '/api/v1/orders/pending-cash',
      outForDelivery: '/api/v1/orders/out-for-delivery',
      deliver: '/api/v1/orders/:id/deliver',
      confirmPickup: '/api/v1/orders/:id/confirm-pickup',
    },
    // Bills
    bills: {
      generate: '/api/v1/bills/tab/:tabId/generate',
      applyDiscount: '/api/v1/bills/tab/:tabId/apply-discount',
      pay: '/api/v1/bills/tab/:tabId/pay',
      confirmCash: '/api/v1/bills/tab/:tabId/confirm-cash',
      receipt: '/api/v1/bills/tab/:tabId/receipt',
    },
    // Suppliers
    suppliers: {
      list: '/api/v1/suppliers',
      get: '/api/v1/suppliers/:id',
      create: '/api/v1/suppliers',
      update: '/api/v1/suppliers/:id',
      delete: '/api/v1/suppliers/:id',
    },
    // Shifts
    shifts: {
      open: '/api/v1/shifts/open',
      current: '/api/v1/shifts/current',
      close: '/api/v1/shifts/:id/close',
      list: '/api/v1/shifts',
      get: '/api/v1/shifts/:id',
      report: '/api/v1/shifts/:id/report',
      summary: '/api/v1/shifts/summary',
      templates: {
        list: '/api/v1/shifts/templates',
        get: '/api/v1/shifts/templates/:id',
        create: '/api/v1/shifts/templates',
        update: '/api/v1/shifts/templates/:id',
        delete: '/api/v1/shifts/templates/:id',
      },
      reports: '/api/v1/reports/shifts',
    },
    // Inventory (menu-item stock model)
    inventory: {
      list: '/api/v1/menu-items',
      get: '/api/v1/menu-items/:id',
      create: '/api/v1/menu-items',
      update: '/api/v1/menu-items/:id',
      delete: '/api/v1/menu-items/:id',
      restock: '/api/v1/menu-items/:id/restock',
      movements: '/api/v1/menu-items/:id/movements',
      alerts: '/api/v1/inventory/alerts',
      bestsellers: '/api/v1/inventory/bestsellers',
      stockVariance: '/api/v1/reports/stock-variance',
      audit: '/api/v1/inventory/audit',
      reconcile: '/api/v1/inventory/reconcile',
      untrackedItems: '/api/v1/inventory/untracked-items',
    },
    // Reports
    reports: {
      sales: '/api/v1/reports/sales',
      items: '/api/v1/reports/items',
      peakHours: '/api/v1/reports/peak-hours',
      tableVelocity: '/api/v1/reports/table-velocity',
      peakEfficiency: '/api/v1/reports/peak-efficiency',
      dailyTally: '/api/v1/reports/daily-tally',
    },
    // Notifications
    notifications: {
      list: '/api/v1/notifications',
      unread: '/api/v1/notifications?unread=true',
      read: '/api/v1/notifications/:id/read',
      readAll: '/api/v1/notifications/read-all',
    },

    // Menu extras
    menuImport: '/api/v1/menu/import',
    menuToggle: '/api/v1/menu/:id/toggle',
    // Public menu / tracking (no auth)
    publicMenu: '/api/v1/public/menu/:branchId',
    publicTracking: '/api/v1/tracking/:code',
    publicAds: '/api/v1/public/ads/:branchId',
    publicBusinesses: '/api/v1/public/businesses',
    // AI / Nemotron
    ai: {
      generateLogic: '/api/v1/ai/generate-logic',
      analyzeApi: '/api/v1/ai/analyze-api',
      directCompletions: '/v1/chat/completions',
    },
    // POS Terminals
    pos: {
      list: '/api/v1/pos/terminals',
      active: '/api/v1/pos/terminals/active',
      get: '/api/v1/pos/terminals/:id',
      create: '/api/v1/pos/terminals',
      update: '/api/v1/pos/terminals/:id',
      delete: '/api/v1/pos/terminals/:id',
    },
    // Subscriptions
    subscriptions: {
      current: '/api/v1/subscriptions/current',
      initialize: '/api/v1/subscriptions/initialize',
      verify: '/api/v1/subscriptions/verify',
      cancel: '/api/v1/subscriptions/cancel',
      adminGrant: '/api/v1/subscriptions/admin/grant',
    },
    // Plans
    plans: {
      list: '/api/v1/subscriptions/plans',
    },
    // Plans (superadmin management)
    adminPlans: {
      list: '/api/v1/subscriptions/admin/plans',
      create: '/api/v1/subscriptions/admin/plans',
      update: '/api/v1/subscriptions/admin/plans/:id',
      toggle: '/api/v1/subscriptions/admin/plans/:id/toggle',
      delete: '/api/v1/subscriptions/admin/plans/:id',
    },
    // Departments
    departments: {
      list: '/api/v1/departments',
      get: '/api/v1/departments/:id',
      create: '/api/v1/departments',
      update: '/api/v1/departments/:id',
      delete: '/api/v1/departments/:id',
    },
    // Audit Logs
    auditLogs: {
      list: '/api/v1/audit-logs',
      recent: '/api/v1/audit-logs/recent',
    },
    // Ads / Promotions
    ads: {
      list: '/api/v1/advertisements',
      get: '/api/v1/advertisements/:id',
      create: '/api/v1/advertisements',
      update: '/api/v1/advertisements/:id',
      delete: '/api/v1/advertisements/:id',
    },
    roles: {
      list: '/api/v1/roles',
      permissions: '/api/v1/roles/permissions',
      myPermissions: '/api/v1/roles/my-permissions',
      updatePermissions: '/api/v1/roles/:id/permissions',
    },
    admin: {
      businesses: '/api/v1/admin/businesses',
      business: '/api/v1/admin/businesses/:id',
      toggleBusinessActive: '/api/v1/admin/businesses/:id/toggle-active',
      stats: '/api/v1/admin/stats',
      systemHealth: '/api/v1/admin/system/health',
      revenue: '/api/v1/admin/revenue',
      auditLogs: '/api/v1/admin/audit-logs',
      feedback: '/api/v1/admin/feedback',
      feedbackStatus: '/api/v1/admin/feedback/:id/status',
      extend: '/api/v1/admin/businesses/extend',
      paymentProviders: '/api/v1/admin/payment-providers',
      paymentProvider: '/api/v1/admin/payment-providers/:id',
      shiftTemplates: '/api/v1/admin/businesses/:businessId/shift-templates',
      shiftTemplate: '/api/v1/admin/businesses/:businessId/shift-templates/:templateId',
    },
    reviews: {
      list: '/api/v1/admin/reviews',
    },
  } as const,
};

/** Replace :param tokens in a URL template */
export function buildUrl(template: string, params: Record<string, string | number> = {}): string {
  return template.replace(/:(\w+)/g, (_, key) => String(params[key] ?? ''));
}
