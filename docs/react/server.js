const fs = require('fs')
const http = require('http')
const path = require('path')

const root = __dirname
const port = Number(process.env.PORT || 5173)

async function start() {
  const { createServer: createViteServer } = await import('vite')
  const vite = await createViteServer({
    root,
    server: {
      middlewareMode: true,
    },
    appType: 'custom',
  })

  const templatePath = path.resolve(root, 'index.html')

  const server = http.createServer((req, res) => {
    vite.middlewares(req, res, async () => {
      try {
        const url = req.url || '/'
        let template = fs.readFileSync(templatePath, 'utf8')

        template = await vite.transformIndexHtml(url, template)

        const { render } = await vite.ssrLoadModule('/src/js/entry-server.tsx')
        const appHtml = render()
        const html = template.replace('<!--app-html-->', appHtml)

        res.writeHead(200, { 'Content-Type': 'text/html' })
        res.end(html)
      } catch (error) {
        vite.ssrFixStacktrace(error)
        res.statusCode = 500
        res.end(error.stack)
      }
    })
  })

  server.listen(port, '127.0.0.1', () => {
    console.log(`React SSR demo running at http://localhost:${port}`)
  })
}

start()
