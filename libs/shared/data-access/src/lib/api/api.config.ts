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
      staffLogin: '/api/v1/auth/staff-login',
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
    },
    // Menu
    menu: {
      list: '/api/v1/menu',
      get: '/api/v1/menu/:id',
      create: '/api/v1/menu',
      update: '/api/v1/menu/:id',
      delete: '/api/v1/menu/:id',
    },
    // Tables
    tables: {
      list: '/api/v1/tables',
      get: '/api/v1/tables/:id',
      create: '/api/v1/tables',
      update: '/api/v1/tables/:id',
      delete: '/api/v1/tables/:id',
      updateStatus: '/api/v1/tables/:id/status',
    },
    // Tabs
    tabs: {
      list: '/api/v1/tabs',
      get: '/api/v1/tabs/:id',
      open: '/api/v1/tabs/open',
      close: '/api/v1/tabs/:id/close',
      delete: '/api/v1/tabs/:id',
    },
    // Orders
    orders: {
      byTab: '/api/v1/orders/tab/:tabId',
      get: '/api/v1/orders/:id',
      update: '/api/v1/orders/:id',
      delete: '/api/v1/orders/:id',
    },
    // Bills
    bills: {
      generate: '/api/v1/bills/tab/:tabId/generate',
      pay: '/api/v1/bills/tab/:tabId/pay',
      receipt: '/api/v1/bills/tab/:tabId/receipt',
    },
    // Reports
    reports: {
      peakHours: '/api/v1/reports/peak-hours',
    },
    // Nemotron
    nemotron: {
      completions: '/v1/chat/completions',
    },
    admin: {
      businesses: '/api/v1/admin/businesses',
      business: '/api/v1/admin/businesses/:id',
      toggleBusinessActive: '/api/v1/admin/businesses/:id/toggle-active',
      stats: '/api/v1/admin/stats',
    },
  } as const,
};

/** Replace :param tokens in a URL template */
export function buildUrl(template: string, params: Record<string, string | number> = {}): string {
  return template.replace(/:(\w+)/g, (_, key) => String(params[key] ?? ''));
}
