import { EmblaCarouselType } from 'embla-carousel'
import WheelGestures, { WheelEventState } from 'wheel-gestures'

type TEmblaCarousel = Pick<EmblaCarouselType, 'containerNode' | 'on' | 'off' | 'dangerouslyGetEngine'>

interface Options {
  wheelDraggingClass?: string
}

export function setupWheelGestures(embla: TEmblaCarousel, { wheelDraggingClass = 'is-wheel-dragging' }: Options = {}) {
  if (embla.containerNode()) {
    initWheelGestures()
  } else {
    embla.on('init', initWheelGestures)
  }

  let cleanupFn = () => {}

  function initWheelGestures() {
    embla.on('reInit', reInit)
    embla.on('destroy', cleanup)

    const engine = embla.dangerouslyGetEngine()
    const targetNode = embla.containerNode().parentNode as Element
    const wheelGestures = WheelGestures({
      preventWheelAction: engine.options.axis,
      reverseSign: [true, true, false],
    })

    const unobserveTargetNode = wheelGestures.observe(targetNode)
    const offWheel = wheelGestures.on('wheel', handleWheel)
    let isStarted = false

    let startEvent: MouseEvent

    cleanupFn = cleanup

    function reInit() {
      cleanup()
      initWheelGestures()
    }

    function wheelGestureStarted(state: WheelEventState) {
      isStarted = true
      startEvent = new MouseEvent('mousedown', state.event)

      // TODO: test in IE11 (should at least not throw)
      embla.containerNode().dispatchEvent(startEvent)
      addNativeMouseEventListeners()

      if (wheelDraggingClass) {
        targetNode.classList.add(wheelDraggingClass)
      }
    }

    function wheelGestureEnded(state: WheelEventState) {
      isStarted = false
      embla.containerNode().dispatchEvent(createMouseEvent('mouseup', state))
      removeNativeMouseEventListeners()

      if (wheelDraggingClass) {
        targetNode.classList.remove(wheelDraggingClass)
      }
    }

    function addNativeMouseEventListeners() {
      document.documentElement.addEventListener('mousemove', preventNativeMouseHandler, true)
      document.documentElement.addEventListener('mouseup', preventNativeMouseHandler, true)
      document.documentElement.addEventListener('mousedown', preventNativeMouseHandler, true)
    }

    function removeNativeMouseEventListeners() {
      document.documentElement.removeEventListener('mousemove', preventNativeMouseHandler, true)
      document.documentElement.removeEventListener('mouseup', preventNativeMouseHandler, true)
      document.documentElement.removeEventListener('mousedown', preventNativeMouseHandler, true)
    }

    function preventNativeMouseHandler(e: MouseEvent) {
      if (isStarted && e.isTrusted) {
        e.stopImmediatePropagation()
      }
    }

    function createMouseEvent(type: 'mousedown' | 'mousemove' | 'mouseup', state: WheelEventState) {
      const {
        axisMovement: [moveX, moveY],
      } = state
      return new MouseEvent(type, {
        clientX: startEvent.clientX + moveX,
        clientY: startEvent.clientY + moveY,
        screenX: startEvent.screenX + moveX,
        screenY: startEvent.screenY + moveY,
        movementX: moveX,
        movementY: moveY,
        button: 0,
        bubbles: true,
        cancelable: true,
      })
    }

    function cleanup() {
      unobserveTargetNode()
      offWheel()
      removeNativeMouseEventListeners()
      embla.off('reInit', reInit)
      embla.off('destroy', cleanup)
    }

    function handleWheel(state: WheelEventState) {
      const {
        axisDelta: [deltaX, deltaY],
      } = state

      const primaryAxisDelta = engine.options.axis === 'x' ? deltaX : deltaY
      const crossAxisDelta = engine.options.axis === 'x' ? deltaY : deltaX
      const isRelease = state.isMomentum && state.previous && !state.previous.isMomentum
      const isEndingOrRelease = (state.isEnding && !state.isMomentum) || isRelease
      const primaryAxisDeltaIsDominant = Math.abs(primaryAxisDelta) > Math.abs(crossAxisDelta)

      if (primaryAxisDeltaIsDominant && !isStarted && !state.isMomentum) {
        wheelGestureStarted(state)
      }

      if (!isStarted) return
      if (isEndingOrRelease) {
        wheelGestureEnded(state)
      } else {
        embla.containerNode().dispatchEvent(createMouseEvent('mousemove', state))
      }
    }
  }

  return () => {
    cleanupFn()
  }
}
