const fs = require('fs')
const http = require('http')
const path = require('path')

const { createServer: createViteServer } = require('vite')

const root = __dirname
const port = Number(process.env.PORT || 5173)

async function start() {
  const vite = await createViteServer({
    root,
    server: {
      middlewareMode: 'ssr',
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

  server.listen(port, () => {
    console.log(`React SSR demo running at http://localhost:${port}`)
  })
}

start()
