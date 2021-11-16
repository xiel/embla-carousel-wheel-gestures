import { EmblaCarouselType, EmblaPluginType } from 'embla-carousel'
import WheelGestures, { WheelEventState } from 'wheel-gestures'

type WheelGesturesPluginOptions = {
  wheelDraggingClass: string
}

type WheelGesturesPluginType = EmblaPluginType<WheelGesturesPluginOptions>

const defaultOptions: WheelGesturesPluginOptions = {
  wheelDraggingClass: 'is-wheel-dragging',
}

const __DEV__ = process.env.NODE_ENV !== 'production'

export function WheelGesturesPlugin(userOptions?: Partial<WheelGesturesPluginOptions>): WheelGesturesPluginType {
  const options: WheelGesturesPluginOptions = {
    ...defaultOptions,
    ...userOptions,
  }
  let cleanup = () => {}

  function init(embla: EmblaCarouselType) {
    const engine = embla.internalEngine()
    const targetNode = embla.containerNode().parentNode as Element
    const wheelGestures = WheelGestures({
      preventWheelAction: engine.options.axis,
      reverseSign: [true, true, false],
    })

    const unobserveTargetNode = wheelGestures.observe(targetNode)
    const offWheel = wheelGestures.on('wheel', handleWheel)

    let isStarted = false
    let startEvent: MouseEvent

    function wheelGestureStarted(state: WheelEventState) {
      try {
        startEvent = new MouseEvent('mousedown', state.event)
        dispatchEvent(startEvent)
      } catch (e) {
        // Legacy Browsers like IE 10 & 11 will throw when attempting to create the Event
        if (__DEV__) {
          console.warn(
            'Legacy browser requires events-polyfill (https://github.com/xiel/embla-carousel-wheel-gestures#legacy-browsers)'
          )
        }
        return cleanup()
      }

      isStarted = true
      addNativeMouseEventListeners()

      if (options.wheelDraggingClass) {
        targetNode.classList.add(options.wheelDraggingClass)
      }
    }

    function wheelGestureEnded(state: WheelEventState) {
      isStarted = false
      dispatchEvent(createRelativeMouseEvent('mouseup', state))
      removeNativeMouseEventListeners()

      if (options.wheelDraggingClass) {
        targetNode.classList.remove(options.wheelDraggingClass)
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

    function createRelativeMouseEvent(type: 'mousedown' | 'mousemove' | 'mouseup', state: WheelEventState) {
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

    function dispatchEvent(event: UIEvent) {
      embla.containerNode().dispatchEvent(event)
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
        dispatchEvent(createRelativeMouseEvent('mousemove', state))
      }
    }

    cleanup = () => {
      unobserveTargetNode()
      offWheel()
      removeNativeMouseEventListeners()
    }
  }

  return {
    name: 'wheel-gestures',
    init,
    destroy: () => cleanup(),
    options,
  }
}
