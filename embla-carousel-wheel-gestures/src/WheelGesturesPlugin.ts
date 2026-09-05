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

export function WheelGesturesPlugin(userOptions: WheelGesturesPluginType['options'] = {}): WheelGesturesPluginType {
  let cleanup = () => {}

  function init(embla: EmblaCarouselType, optionsHandler: OptionsHandlerType) {
    cleanup()
    const { mergeOptions, optionsAtMedia } = optionsHandler
    const options = optionsAtMedia(
      mergeOptions(mergeOptions(defaultOptions, WheelGesturesPlugin.globalOptions), userOptions)
    )
    const engine = embla.internalEngine()
    if (engine.isSsr || !options.active) return

    const targetNode = options.target ?? (embla.containerNode().parentNode as Element)
    const ownerWindow = embla.containerNode().ownerDocument.defaultView!
    const wheelAxis = options.forceWheelAxis ?? engine.options.axis
    const axisIndex = wheelAxis === 'x' ? 0 : 1
    const wheelGestures = WheelGestures({ preventWheelAction: wheelAxis, reverseSign: [true, true, false] })
    const { axis, target, location, scrollBody, scrollTarget, scrollTo, indexCurrent, animation } = engine
    const dragFree = engine.options.dragFree === true || engine.options.dragFree === 'snap'
    const snap = engine.options.dragFree !== true
    const logInterval = 170
    let isStarted = false
    let blockedWaitUntilGestureEnd = false
    let overBoundaryAccumulation = 0
    let viewSize = 0
    let lastMovement = 0
    let velocityStartMovement = 0
    let velocityStartTime = 0
    let lastMoveTime = 0

    function updateSizeRelatedVariables() {
      viewSize = axis.getSize(engine.containerRect)
    }

    // Keep Embla's own rubber band constraint in its dragging mode while the
    // wheel controls the target, without pretending a mouse pointer is down.
    const constrain = engine.scrollBounds.constrain
    const constrainDuringWheel = (pointerDown: boolean) => constrain(pointerDown || isStarted)
    engine.scrollBounds.constrain = constrainDuringWheel

    function wheelGestureStarted() {
      isStarted = true
      overBoundaryAccumulation = 0
      lastMovement = velocityStartMovement = 0
      lastMoveTime = velocityStartTime = ownerWindow.performance.now()
      scrollBody.useFriction(0).useDuration(0)
      target.set(location)
      if (options.wheelDraggingClass) targetNode.classList.add(options.wheelDraggingClass)
    }

    function allowedForce(force: number) {
      const threshold = Math.min(225, Math.max(50, engine.percentOfView.measure(20)))
      const baseForce = () => scrollTarget.byDistance(force, snap).distance
      if (dragFree || Math.abs(force) < threshold) return baseForce()
      if (engine.options.skipSnaps && scrollTarget.byDistance(0, false).index !== indexCurrent.get()) {
        return baseForce() * 0.5
      }
      const next = indexCurrent.add(-Math.sign(force))
      return scrollTarget.byIndex(next.get(), 0).distance
    }

    function wheelGestureEnded() {
      if (!isStarted) return
      isStarted = false
      if (options.wheelDraggingClass) targetNode.classList.remove(options.wheelDraggingClass)
      const now = ownerWindow.performance.now()
      const elapsed = now - velocityStartTime
      const velocity =
        elapsed && now - lastMoveTime <= logInterval ? (lastMovement - velocityStartMovement) / elapsed : 0
      const rawForce = (Math.abs(velocity) > 0.1 ? velocity : 0) * (dragFree ? 500 : 300)
      const force = allowedForce(axis.direction(rawForce))
      const forceFactor =
        rawForce && force && Math.abs(rawForce) > Math.abs(force)
          ? (Math.abs(rawForce) - Math.abs(force)) / Math.abs(rawForce)
          : 0
      scrollBody.useDuration((dragFree ? 43 : 25) - 10 * forceFactor)
      // Embla v9's base drag friction is 0.68 (DragHandler/Engine).
      scrollBody.useFriction(0.68 + forceFactor / 50)
      scrollTo.distance(force, snap)
    }

    function atBoundary(delta: number) {
      if (engine.options.loop) return false
      const movement = axis.direction(delta)
      return (movement < 0 && embla.scrollProgress() >= 1) || (movement > 0 && embla.scrollProgress() <= 0)
    }

    function move(state: WheelEventState, isAtBoundary: boolean) {
      let movement = state.axisMovement[axisIndex]
      if (isAtBoundary && viewSize) {
        const progress = Math.min(overBoundaryAccumulation / (viewSize / 2), 1)
        movement -= Math.sign(movement) * overBoundaryAccumulation * (0.25 + progress * 0.5)
      }
      if (!engine.options.skipSnaps && !dragFree) {
        movement = Math.max(-viewSize, Math.min(movement, viewSize))
      }
      const now = ownerWindow.performance.now()
      const delta = movement - lastMovement
      if (now - velocityStartTime > logInterval) {
        velocityStartTime = now
        velocityStartMovement = movement
      }
      lastMovement = movement
      lastMoveTime = now
      scrollBody.useFriction(0.3).useDuration(0.75)
      target.add(axis.direction(delta))
      animation.start()
    }

    function handleWheel(state: WheelEventState) {
      if (state.isEnding) {
        wheelGestureEnded()
        blockedWaitUntilGestureEnd = false
        return
      }
      if (engine.dragHandler.pointerDown()) {
        blockedWaitUntilGestureEnd = true
        return
      }
      if (blockedWaitUntilGestureEnd) return
      if (state.isMomentum) {
        wheelGestureEnded()
        return
      }
      const delta = state.axisDelta[axisIndex]
      const crossDelta = state.axisDelta[axisIndex === 0 ? 1 : 0]
      if (!isStarted && Math.abs(delta) > Math.abs(crossDelta)) wheelGestureStarted()
      if (!isStarted) return

      const isAtBoundary = atBoundary(delta)
      overBoundaryAccumulation = isAtBoundary ? overBoundaryAccumulation + Math.abs(delta) : 0
      if (isAtBoundary && overBoundaryAccumulation > viewSize / 2) {
        blockedWaitUntilGestureEnd = true
        wheelGestureEnded()
        return
      }
      move(state, isAtBoundary)
    }

    function onPointerDown() {
      if (!isStarted) return
      blockedWaitUntilGestureEnd = true
      wheelGestureEnded()
    }

    updateSizeRelatedVariables()
    embla.on('resize', updateSizeRelatedVariables)
    embla.on('pointerdown', onPointerDown)
    const unobserve = wheelGestures.observe(targetNode)
    const offWheel = wheelGestures.on('wheel', handleWheel)

    cleanup = () => {
      if (isStarted) {
        isStarted = false
        target.set(location)
        scrollBody.useBaseDuration().useBaseFriction()
      }
      if (options.wheelDraggingClass) targetNode.classList.remove(options.wheelDraggingClass)
      unobserve()
      offWheel()
      embla.off('resize', updateSizeRelatedVariables)
      embla.off('pointerdown', onPointerDown)
      if (engine.scrollBounds.constrain === constrainDuringWheel) engine.scrollBounds.constrain = constrain
      cleanup = () => {}
    }
  }

  return {
    name: 'wheelGestures',
    options: userOptions,
    init,
    destroy: () => cleanup(),
  }
}

declare module 'embla-carousel' {
  interface EmblaPluginsType {
    wheelGestures?: WheelGesturesPluginType
  }
}
