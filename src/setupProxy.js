const { createProxyMiddleware } = require('http-proxy-middleware')

module.exports = function(app) {
  app.use((req, res, next) => {
    res.removeHeader('X-Frame-Options')
    res.removeHeader('Content-Security-Policy')
    next()
  })

  app.use('/vm3', createProxyMiddleware({
    target: 'http://48.216.216.26:5000',
    changeOrigin: true,
    pathRewrite: { '^/vm3': '' }
  }))

  app.use('/vm2', createProxyMiddleware({
    target: 'https://40.76.107.196',
    changeOrigin: true,
    pathRewrite: { '^/vm2': '' },
    secure: false,
    proxyTimeout: 180000,  // ← 180 seconds
    timeout: 180000         // ← 180 seconds
  }))
}