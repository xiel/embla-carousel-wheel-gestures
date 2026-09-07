const assert = require('node:assert/strict')
const fs = require('node:fs')
const { createRequire } = require('node:module')
const path = require('node:path')
const consumer = createRequire(path.resolve(process.argv[2] || 'package.json'))
const { JSDOM } = require('jsdom')
const dom = new JSDOM('<!doctype html><body></body>', { pretendToBeVisual: true, runScripts: 'outside-only' })
const { window } = dom
Object.assign(global, { window, document: window.document })
window.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {} })
window.IntersectionObserver = class {
  observe() {}
  disconnect() {}
}
const Wheel = consumer('wheel-gestures').default
const phases = []
const detector = Wheel({ preventWheelAction: false })
detector.on('wheel', (e) => {
  if (!e.isEnding) phases.push(e.isMomentum)
})
for (const momentum of [false, true, false])
  detector.feedWheel({ deltaX: 30, deltaY: 0, deltaZ: 0, deltaMode: 0, timeStamp: performance.now(), momentum })
assert.deepEqual(phases, [false, true, false])
detector.disconnect()
const Embla = consumer('embla-carousel')
function checkPlugin(Plugin, label) {
  const root = document.createElement('div'),
    container = document.createElement('div')
  root.append(container)
  document.body.append(root)
  function size(el, i = 0) {
    Object.defineProperties(el, {
      offsetWidth: { value: 600 },
      offsetHeight: { value: 400 },
      offsetLeft: { value: i * 600 },
      offsetTop: { value: 0 },
      offsetParent: { value: document.body },
    })
  }
  size(root)
  size(container)
  for (let i = 0; i < 5; i++) {
    const slide = document.createElement('div')
    size(slide, i)
    slide.style.margin = '0px'
    container.append(slide)
  }
  let synthetic = 0
  for (const event of ['mousedown', 'mousemove', 'mouseup']) container.addEventListener(event, () => synthetic++)
  const carousel = Embla(root, { startSnap: 1, resize: false, slideChanges: false }, [Plugin()])
  const before = carousel.internalEngine().target.get()
  const event = new window.WheelEvent('wheel', { deltaX: 40, bubbles: true, cancelable: true })
  Object.defineProperty(event, 'momentum', { value: false })
  root.dispatchEvent(event)
  assert.notEqual(carousel.internalEngine().target.get(), before, label + ' moves engine')
  assert.equal(synthetic, 0, label + ' avoids synthetic mouse events')
  carousel.destroy()
  root.remove()
  console.log(label + ' passed')
}
checkPlugin(consumer('embla-carousel-wheel-gestures').WheelGesturesPlugin, 'CJS installed package')
const entry = consumer.resolve('embla-carousel-wheel-gestures')
window.eval(fs.readFileSync(entry.replace(/index.js$/, 'embla-carousel-wheel-gestures.umd.js'), 'utf8'))
checkPlugin(window.EmblaCarouselWheelGestures, 'UMD installed package')
dom.window.close()
console.log('Published wheel native true/false detection passed')
