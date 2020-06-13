import EmblaCarousel from 'embla-carousel'
import WheelGestures, { projection, WheelEventState } from 'wheel-gestures'

export function setupWheelGestures(embla: EmblaCarousel, {} = {}) {
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
    })

    // test
    const unobserveTargetNode = wheelGestures.observe(targetNode)
    const offWheel = wheelGestures.on('wheel', handleWheel)
    let isStarted = false

    cleanupFn = cleanup

    function reInit() {
      cleanup()
      initWheelGestures()
    }

    function wheelGestureStarted() {
      engine.target.set(engine.location)
      engine.scrollBody.useSpeed(80) // This attraction is so much that it will almost move instantly
      engine.scrollBounds.toggleActive(false)
      engine.animation.start()
      isStarted = true
    }

    function wheelGestureEnded() {
      engine.scrollBounds.toggleActive(true)
      engine.scrollBody.useDefaultSpeed()
      isStarted = false
    }

    function cleanup() {
      unobserveTargetNode()
      offWheel()
      embla.off('reInit', reInit)
      embla.off('destroy', cleanup)
    }

    function handleWheel(state: WheelEventState) {
      const {
        axisDelta: [deltaX, deltaY],
        axisVelocity: [veloX, veloY],
      } = state
      const primaryAxisDelta = engine.options.axis === 'x' ? deltaX : deltaY
      const crossAxisDelta = engine.options.axis === 'x' ? deltaY : deltaX
      const primaryAxisVelo = engine.options.axis === 'x' ? veloX : veloY

      const isRelease = state.isMomentum && state.previous && !state.previous.isMomentum
      const isEndingOrRelease = (state.isEnding && !state.isMomentum) || isRelease

      if (state.isStart) {
        wheelGestureStarted()
      }

      if (Math.abs(primaryAxisDelta) < Math.abs(crossAxisDelta) || !isStarted) {
        if (isStarted) {
          engine.scrollTo.distance(0, !engine.options.dragFree)
          wheelGestureEnded()
        }
        return
      }

      const reachedAnyBound = engine.limit.reachedAny(engine.location.get())
      const divider = reachedAnyBound ? 2 : 1

      if (isEndingOrRelease) {
        const releaseProjection = projection(primaryAxisVelo)
        const releaseProjectionPercent = engine.pxToPercent.measure(releaseProjection)

        engine.scrollTo.distance(releaseProjectionPercent / divider, !engine.options.dragFree)

        wheelGestureEnded()
      } else if (!state.isMomentum) {
        const deltaPercent = engine.pxToPercent.measure(primaryAxisDelta)
        engine.target.add(deltaPercent / divider)
      } else if (state.isEnding) {
        wheelGestureEnded()
      }
    }
  }

  return () => {
    cleanupFn()
  }
}
