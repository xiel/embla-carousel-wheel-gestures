import EmblaCarousel, { EmblaCarouselType, EmblaOptionsType } from 'embla-carousel'
import WheelGestures, { WheelEventState, VectorXYZ } from 'wheel-gestures'

import { WheelGesturesPlugin, WheelGesturesPluginOptions } from '../src'

const mockWheelHandlers: Array<(state: WheelEventState) => void> = []
jest.mock('wheel-gestures', () => ({
  __esModule: true,
  default: jest.fn(() => ({
    observe: jest.fn(() => jest.fn()),
    on: jest.fn((_name, handler) => {
      mockWheelHandlers.push(handler)
      return jest.fn()
    }),
  })),
}))

let carousels: EmblaCarouselType[] = []

beforeEach(() => {
  jest.useFakeTimers()
  jest.clearAllMocks()
  mockWheelHandlers.length = 0
  WheelGesturesPlugin.globalOptions = undefined
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    value: jest.fn(() => ({ matches: false, addEventListener: jest.fn(), removeEventListener: jest.fn() })),
  })
  Object.defineProperty(window, 'IntersectionObserver', {
    configurable: true,
    value: jest.fn(() => ({ observe: jest.fn(), disconnect: jest.fn() })),
  })
})

afterEach(() => {
  carousels.forEach((embla) => embla.destroy())
  carousels = []
  document.body.innerHTML = ''
  jest.restoreAllMocks()
  jest.useRealTimers()
})

function setup(options: EmblaOptionsType = {}, pluginOptions: Partial<WheelGesturesPluginOptions> = {}) {
  const root = document.createElement('div')
  const container = document.createElement('div')
  root.appendChild(container)
  document.body.appendChild(root)
  const vertical = options.axis === 'y'
  const rtl = options.direction === 'rtl'
  function size(node: HTMLElement, index = 0) {
    Object.defineProperties(node, {
      offsetWidth: { configurable: true, value: 600 },
      offsetHeight: { configurable: true, value: 400 },
      offsetLeft: { configurable: true, value: vertical ? 0 : index * 600 * (rtl ? -1 : 1) },
      offsetTop: { configurable: true, value: vertical ? index * 400 : 0 },
      offsetParent: { configurable: true, value: document.body },
    })
  }
  size(root)
  size(container)
  for (let index = 0; index < 5; index++) {
    const slide = document.createElement('div')
    size(slide, index)
    slide.style.margin = '0px'
    container.appendChild(slide)
  }
  const plugin = WheelGesturesPlugin(pluginOptions)
  const embla = EmblaCarousel(root, { startSnap: 1, resize: false, slideChanges: false, ...options }, [plugin])
  carousels.push(embla)
  const engine = embla.internalEngine()
  let movement: VectorXYZ = [0, 0, 0]
  let previous: WheelEventState | undefined
  let handler = mockWheelHandlers[mockWheelHandlers.length - 1]
  function send(delta: VectorXYZ, flags: Partial<WheelEventState> = {}) {
    movement = movement.map((value, i) => value + delta[i]) as VectorXYZ
    const state: WheelEventState = {
      isStart: !previous,
      isMomentum: false,
      isEnding: false,
      isMomentumCancel: false,
      axisDelta: delta,
      axisMovement: movement,
      axisMovementProjection: movement,
      axisVelocity: [0, 0, 0],
      event: new WheelEvent('wheel'),
      previous,
      ...flags,
    }
    handler(state)
    previous = state
  }
  function finish() {
    send([0, 0, 0], { isEnding: true })
  }
  function newGesture() {
    movement = [0, 0, 0]
    previous = undefined
    handler = mockWheelHandlers[mockWheelHandlers.length - 1]
  }
  return { root, container, plugin, embla, engine, send, finish, newGesture }
}

test('moves the real engine without synthetic mouse events or pointer events', () => {
  const { root, container, embla, engine, send, finish } = setup()
  const domEvent = jest.fn()
  const pointerEvent = jest.fn()
  for (const name of ['mousedown', 'mousemove', 'mouseup']) container.addEventListener(name, domEvent)
  embla
    .on('pointerdown', pointerEvent)
    .on('pointermove', pointerEvent)
    .on('pointerup', pointerEvent)
  send([-40, 0, 0])
  expect(engine.target.get()).toBe(-640)
  expect(root.classList.contains('is-wheel-dragging')).toBe(true)
  expect(engine.dragHandler.pointerDown()).toBe(false)
  jest.advanceTimersByTime(32)
  expect(engine.location.get()).toBeLessThan(-600)
  expect(container.style.transform).not.toBe('translate3d(-600px,0px,0px)')
  finish()
  expect(root.classList.contains('is-wheel-dragging')).toBe(false)
  expect(domEvent).not.toHaveBeenCalled()
  expect(pointerEvent).not.toHaveBeenCalled()
})

test.each([
  [{ axis: 'x' }, {}, [-40, 0, 0], -640],
  [{ axis: 'y' }, {}, [0, -40, 0], -440],
  [{ axis: 'x' }, { forceWheelAxis: 'y' }, [0, -40, 0], -640],
  [{ axis: 'y' }, { forceWheelAxis: 'x' }, [-40, 0, 0], -440],
  [{ axis: 'x', direction: 'rtl' }, {}, [40, 0, 0], -640],
] as const)('maps axes and direction: %j %j', (options, pluginOptions, delta, expected) => {
  const { engine, send } = setup(options, pluginOptions)
  send([...delta])
  expect(engine.target.get()).toBe(expected)
})

test('ignores cross-axis and momentum-only input', () => {
  const { root, engine, send } = setup()
  send([0, -100, 0])
  send([-100, 0, 0], { isMomentum: true })
  expect(engine.target.get()).toBe(-600)
  expect(root.classList.contains('is-wheel-dragging')).toBe(false)
})

test('keeps Embla release force and snap behavior on a flick', () => {
  const { engine, embla, send } = setup()
  send([-10, 0, 0])
  jest.advanceTimersByTime(16)
  send([-40, 0, 0])
  jest.advanceTimersByTime(16)
  send([-20, 0, 0], { isMomentum: true })
  expect(engine.target.get()).toBe(-1200)
  expect(embla.selectedSnap()).toBe(2)
  expect(engine.scrollBody.duration()).toBe(25)
  const releasedTarget = engine.target.get()
  send([-200, 0, 0], { isMomentum: true })
  expect(engine.target.get()).toBe(releasedTarget)
  jest.advanceTimersByTime(2000)
  expect(engine.location.get()).toBeCloseTo(-1200, 1)
})

test.each([true, 'snap'] as const)('honors dragFree=%s when releasing', (dragFree) => {
  const { engine, send } = setup({ dragFree })
  send([-10, 0, 0])
  jest.advanceTimersByTime(16)
  send([-40, 0, 0])
  jest.advanceTimersByTime(16)
  send([-10, 0, 0], { isMomentum: true })
  if (dragFree === true) expect(engine.target.get()).toBeCloseTo(-650 - (50 / 32) * 500)
  else expect(engine.scrollSnaps).toContain(engine.target.get())
})

test('expires release velocity after a pause', () => {
  const { engine, send, finish } = setup()
  send([-40, 0, 0])
  jest.advanceTimersByTime(400)
  finish()
  expect(engine.target.get()).toBe(-600)
})

test.each([false, true])('limits displacement when skipSnaps=%s', (skipSnaps) => {
  const { engine, send } = setup({ skipSnaps })
  send([-1400, 0, 0])
  expect(engine.target.get()).toBe(skipSnaps ? -2000 : -1200)
})

test.each(['x', 'y'] as const)('damps only the %s scroll axis at the start boundary', (axis) => {
  const { engine, send } = setup({ axis, startSnap: 0 })
  send(axis === 'x' ? [60, 0, 0] : [0, 60, 0])
  expect(engine.target.get()).toBeCloseTo(axis === 'x' ? 39 : 36)
  engine.animation.update()
  expect(engine.target.get()).toBeGreaterThan(0)
})

test('looping input is not blocked at the first snap', () => {
  const { engine, root, send } = setup({ loop: true, startSnap: 0, skipSnaps: true })
  expect(engine.options.loop).toBe(true)
  send([400, 0, 0])
  expect(engine.target.get()).toBe(400)
  expect(root.classList.contains('is-wheel-dragging')).toBe(true)
})

test('boundary blocking resets when the gesture ends', () => {
  const { root, send, finish, newGesture } = setup({ startSnap: 0 })
  send([400, 0, 0])
  expect(root.classList.contains('is-wheel-dragging')).toBe(false)
  send([-100, 0, 0])
  expect(root.classList.contains('is-wheel-dragging')).toBe(false)
  finish()
  newGesture()
  send([-100, 0, 0])
  expect(root.classList.contains('is-wheel-dragging')).toBe(true)
})

test('works with mouse dragging disabled', () => {
  const { engine, send } = setup({ draggable: false })
  send([-40, 0, 0])
  expect(engine.target.get()).toBe(-640)
})

test('a real mouse drag can take over and wheel input cannot hijack it', () => {
  const { root, engine, send, finish, newGesture } = setup()
  send([-40, 0, 0])
  root.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, button: 0, clientX: 100 }))
  expect(engine.dragHandler.pointerDown()).toBe(true)
  expect(root.classList.contains('is-wheel-dragging')).toBe(false)
  const target = engine.target.get()
  send([-40, 0, 0])
  expect(engine.target.get()).toBe(target)
  document.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, clientX: 100 }))
  finish()
  newGesture()
  send([-40, 0, 0])
  expect(root.classList.contains('is-wheel-dragging')).toBe(true)
})

test('simultaneous carousels do not dispatch movement into each other', () => {
  const first = setup()
  const second = setup()
  first.send([-60, 0, 0])
  const target = first.engine.target.get()
  second.send([-30, 0, 0])
  expect(first.engine.target.get()).toBe(target)
  expect(second.engine.target.get()).toBe(-630)
  second.finish()
  expect(first.root.classList.contains('is-wheel-dragging')).toBe(true)
})

test('destroy removes observers, class and engine hooks without restarting animation', () => {
  const { root, engine, plugin, send } = setup()
  const wrappedConstrain = engine.scrollBounds.constrain
  const wheel = jest.mocked(WheelGestures).mock.results[0].value
  const unobserve = wheel.observe.mock.results[0].value
  const off = wheel.on.mock.results[0].value
  send([-40, 0, 0])
  const start = jest.spyOn(engine.animation, 'start')
  plugin.destroy()
  plugin.destroy()
  expect(start).not.toHaveBeenCalled()
  expect(unobserve).toHaveBeenCalledTimes(1)
  expect(off).toHaveBeenCalledTimes(1)
  expect(root.classList.contains('is-wheel-dragging')).toBe(false)
  expect(engine.scrollBounds.constrain).not.toBe(wrappedConstrain)
})

test('reinit releases the old engine and connects the new one', () => {
  const { embla, root, engine, send, newGesture } = setup()
  const oldConstrain = engine.scrollBounds.constrain
  send([-40, 0, 0])
  embla.reInit()
  expect(root.classList.contains('is-wheel-dragging')).toBe(false)
  expect(engine.scrollBounds.constrain).not.toBe(oldConstrain)
  newGesture()
  send([-30, 0, 0])
  expect(embla.internalEngine().target.get()).toBe(-630)
})

test('honors global options, custom target and an empty dragging class', () => {
  WheelGesturesPlugin.globalOptions = { forceWheelAxis: 'y' }
  const { engine, send } = setup({}, { target: document.documentElement, wheelDraggingClass: '' })
  send([0, -40, 0])
  expect(engine.target.get()).toBe(-640)
  expect(document.documentElement.className).toBe('')
  const wheel = jest.mocked(WheelGestures).mock.results[0].value
  expect(wheel.observe).toHaveBeenCalledWith(document.documentElement)
})

test('inactive and SSR initialization does not observe the DOM', () => {
  setup({}, { active: false })
  const plugin = WheelGesturesPlugin()
  plugin.init(
    { internalEngine: () => ({ isSsr: true }) } as any,
    {
      mergeOptions: (...options: any[]) => Object.assign({}, ...options),
      optionsAtMedia: (options: any) => options,
    } as any
  )
  expect(WheelGestures).not.toHaveBeenCalled()
  expect(() => plugin.destroy()).not.toThrow()
})

test('real wheel events reach only their observed carousel through wheel-gestures', () => {
  const actualWheelGestures = jest.requireActual('wheel-gestures').default
  jest
    .mocked(WheelGestures)
    .mockImplementationOnce(actualWheelGestures)
    .mockImplementationOnce(actualWheelGestures)
  const first = setup()
  const second = setup()
  const wheel = new WheelEvent('wheel', { deltaX: 60, bubbles: true, cancelable: true })
  first.root.dispatchEvent(wheel)
  expect(wheel.defaultPrevented).toBe(true)
  expect(first.engine.target.get()).toBe(-660)
  expect(second.engine.target.get()).toBe(-600)
  expect(first.root.classList.contains('is-wheel-dragging')).toBe(true)
  expect(second.root.classList.contains('is-wheel-dragging')).toBe(false)
  jest.advanceTimersByTime(1000)
  expect(first.root.classList.contains('is-wheel-dragging')).toBe(false)
  expect(second.engine.target.get()).toBe(-600)
})
