import { CreateOptionsType, CreatePluginType, EmblaCarouselType, OptionsHandlerType } from 'embla-carousel'
import WheelGestures, { WheelEventState } from 'wheel-gestures'

export type WheelGesturesPluginOptions = CreateOptionsType<{
  wheelDraggingClass: string
  forceWheelAxis?: 'x' | 'y'
  target?: Element
}>

type WheelGesturesPluginType = CreatePluginType<{}, WheelGesturesPluginOptions>

const defaultOptions: WheelGesturesPluginOptions = {
  active: true,
  breakpoints: {},
  wheelDraggingClass: 'is-wheel-dragging',
  forceWheelAxis: undefined,
  target: undefined,
}

WheelGesturesPlugin.globalOptions = undefined as WheelGesturesPluginType['options'] | undefined

const __DEV__ = process.env.NODE_ENV !== 'production'

export function WheelGesturesPlugin(userOptions: WheelGesturesPluginType['options'] = {}): WheelGesturesPluginType {
  let options: WheelGesturesPluginOptions
  let cleanup = () => {}

  function init(embla: EmblaCarouselType, optionsHandler: OptionsHandlerType) {
    const { mergeOptions, optionsAtMedia } = optionsHandler
    const optionsBase = mergeOptions(defaultOptions, WheelGesturesPlugin.globalOptions)
    const allOptions = mergeOptions(optionsBase, userOptions)
    options = optionsAtMedia(allOptions)

    const engine = embla.internalEngine()
    const targetNode = options.target ?? (embla.containerNode().parentNode as Element)
    const wheelAxis = options.forceWheelAxis ?? engine.options.axis
    const wheelGestures = WheelGestures({
      preventWheelAction: wheelAxis,
      reverseSign: [true, true, false],
    })

    function updateSizeRelatedVariables() {
      scrollBoundaryThreshold = (wheelAxis === 'x' ? engine.containerRect.width : engine.containerRect.height) / 2
    }

    const unobserveTargetNode = wheelGestures.observe(targetNode)
    const offWheel = wheelGestures.on('wheel', handleWheel)

    let isStarted = false
    let startEvent: MouseEvent
    let overBoundaryAccumulation = 0
    let scrollBoundaryThreshold = 0
    let blockedWaitUntilGestureEnd = false

    updateSizeRelatedVariables()
    embla.on('resize', updateSizeRelatedVariables)

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
      overBoundaryAccumulation = 0
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
      let moveX, moveY

      if (wheelAxis === engine.options.axis) {
        ;[moveX, moveY] = state.axisMovement
      } else {
        // if emblas axis and the wheelAxis don't match, swap the axes to match the right embla events
        ;[moveY, moveX] = state.axisMovement
      }

      const { isAtBoundary } = checkIfAtBoundary(state)

      // Apply progressive rubber band damping when at boundaries
      if (isAtBoundary) {
        // Calculate progressive damping factor based on how far over boundary we are
        const progressRatio = Math.min(overBoundaryAccumulation / scrollBoundaryThreshold, 1)
        const dampingFactor = 0.25 + progressRatio * 0.5
        const counterMoveSign = moveX > 0 ? -1 : 1
        const counterMovement = overBoundaryAccumulation * counterMoveSign
        const dampingMovement = counterMovement * dampingFactor

        moveX += dampingMovement
        moveY += dampingMovement
      }

      // prevent skipping slides
      if (!engine.options.skipSnaps && !engine.options.dragFree) {
        const maxX = engine.containerRect.width
        const maxY = engine.containerRect.height

        moveX = moveX < 0 ? Math.max(moveX, -maxX) : Math.min(moveX, maxX)
        moveY = moveY < 0 ? Math.max(moveY, -maxY) : Math.min(moveY, maxY)
      }

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
        composed: true,
      })
    }

    function dispatchEvent(event: UIEvent) {
      embla.containerNode().dispatchEvent(event)
    }

    function checkIfAtBoundary(state: WheelEventState) {
      const {
        axisDelta: [deltaX, deltaY],
      } = state
      const scrollProgress = embla.scrollProgress()
      const canScrollNext = scrollProgress < 1
      const canScrollPrev = scrollProgress > 0
      const primaryAxisDelta = wheelAxis === 'x' ? deltaX : deltaY
      const isScrollingNext = primaryAxisDelta < 0
      const isScrollingPrev = primaryAxisDelta > 0
      const isAtBoundary = (isScrollingNext && !canScrollNext) || (isScrollingPrev && !canScrollPrev)

      return {
        isAtBoundary,
        primaryAxisDelta,
      }
    }

    function isBoundaryThresholdReached(state: WheelEventState) {
      const { isAtBoundary, primaryAxisDelta } = checkIfAtBoundary(state)

      if (isAtBoundary && !state.isMomentum) {
        overBoundaryAccumulation += Math.abs(primaryAxisDelta)

        // End gesture if we exceed the threshold
        if (overBoundaryAccumulation > scrollBoundaryThreshold) {
          blockedWaitUntilGestureEnd = true
          wheelGestureEnded(state)
          return true
        }
      } else {
        // Reset accumulation when we can scroll or when not at boundary
        overBoundaryAccumulation = 0
      }

      return false
    }

    function handleWheel(state: WheelEventState) {
      const {
        axisDelta: [deltaX, deltaY],
      } = state
      const primaryAxisDelta = wheelAxis === 'x' ? deltaX : deltaY
      const crossAxisDelta = wheelAxis === 'x' ? deltaY : deltaX
      const isRelease = state.isMomentum && state.previous && !state.previous.isMomentum
      const isEndingOrRelease = (state.isEnding && !state.isMomentum) || isRelease
      const primaryAxisDeltaIsDominant = Math.abs(primaryAxisDelta) > Math.abs(crossAxisDelta)

      if (primaryAxisDeltaIsDominant && !isStarted && !state.isMomentum && !blockedWaitUntilGestureEnd) {
        wheelGestureStarted(state)
      }

      if (blockedWaitUntilGestureEnd && state.isEnding) {
        blockedWaitUntilGestureEnd = false
      }

      if (!isStarted) return

      if (isBoundaryThresholdReached(state)) return

      if (isEndingOrRelease) {
        wheelGestureEnded(state)
      } else {
        dispatchEvent(createRelativeMouseEvent('mousemove', state))
      }
    }

    cleanup = () => {
      unobserveTargetNode()
      offWheel()
      embla.off('resize', updateSizeRelatedVariables)
      removeNativeMouseEventListeners()
    }
  }

  const self: WheelGesturesPluginType = {
    name: 'wheelGestures',
    options: userOptions,
    init,
    destroy: () => cleanup(),
  }
  return self
}

declare module 'embla-carousel' {
  interface EmblaPluginsType {
    wheelGestures?: WheelGesturesPluginType
  }
}
