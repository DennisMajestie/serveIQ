const PROXY_CONFIG = {
  "/api/nvidia": {
    "target": "https://integrate.api.nvidia.com",
    "secure": true,
    "changeOrigin": true,
    "pathRewrite": {
      "^/api/nvidia": "/v1"
    },
    "logLevel": "debug",
    "onProxyRes": function (proxyRes, req, res) {
      console.log('Proxy Response from NVIDIA:', proxyRes.statusCode, req.url);
    },
    "onProxyReq": function (proxyReq, req, res) {
      console.log('Proxying Request to NVIDIA:', req.method, req.url);
    },
    "onError": function (err, req, res) {
      console.error('Proxy Error:', err);
    }
  }
};

module.exports = PROXY_CONFIG;
