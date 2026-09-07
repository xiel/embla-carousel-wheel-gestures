const fs = require('fs')
const path = require('path')
const { pathToFileURL } = require('url')

async function prerender() {
  const distDir = path.resolve(__dirname, 'dist')
  const templatePath = path.join(distDir, 'index.html')
  const serverEntryPath = path.join(distDir, 'server', 'entry-server.mjs')

  const template = fs.readFileSync(templatePath, 'utf8')
  const serverModule = await import(pathToFileURL(serverEntryPath).href)
  const render = serverModule.render || (serverModule.default && serverModule.default.render)

  if (typeof render !== 'function') {
    throw new Error('Unable to find render function in the SSR build output.')
  }

  const appHtml = render()
  const html = template.replace('<!--app-html-->', appHtml)

  fs.writeFileSync(templatePath, html)
}

prerender().catch((error) => {
  console.error(error)
  process.exit(1)
})
