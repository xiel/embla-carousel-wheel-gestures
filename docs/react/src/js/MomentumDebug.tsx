import React, { useEffect, useState } from 'react'
import WheelGestures from 'wheel-gestures'

export default function MomentumDebug() {
  const [logging, setLogging] = useState(true)
  const [supported, setSupported] = useState<boolean>()
  const [sample, setSample] = useState({
    source: 'Waiting for wheel input',
    native: '—',
    detected: '—',
    nativeCount: 0,
    heuristicCount: 0,
  })

  useEffect(() => {
    setSupported('momentum' in WheelEvent.prototype)
    // Observe through the same library as the carousel without cancelling scrolling.
    const detector = WheelGestures({ preventWheelAction: false })
    let nativeCount = 0
    let heuristicCount = 0
    let lastPhase = ''
    const off = detector.on('wheel', (state) => {
      if (state.isEnding) return
      const native = (state.event as WheelEvent & { momentum?: boolean }).momentum
      const hasNative = typeof native === 'boolean'
      if (hasNative) nativeCount++
      else heuristicCount++
      const source = hasNative ? 'Native momentum flag' : 'No native flag (heuristic fallback)'
      setSample({
        source,
        native: hasNative ? String(native) : 'unavailable',
        detected: String(state.isMomentum),
        nativeCount,
        heuristicCount,
      })
      const phase = `${source}: ${native} → ${state.isMomentum}`
      if (logging && (state.isStart || phase !== lastPhase)) {
        console.info('[wheel momentum]', {
          source,
          nativeMomentum: native,
          isMomentum: state.isMomentum,
          isStart: state.isStart,
        })
      }
      lastPhase = phase
    })
    const unobserve = detector.observe(document.documentElement)
    return () => {
      unobserve()
      off()
      detector.disconnect()
    }
  }, [logging])

  return (
    <section aria-label="Momentum diagnostics" style={{ marginBottom: 24, padding: 12, border: '1px solid #ccc' }}>
      <strong>Momentum diagnostics</strong>
      <p>Browser property: {supported === undefined ? 'checking' : supported ? 'available' : 'unavailable'}</p>
      <p>
        Browser input: <strong>{sample.source}</strong>
      </p>
      <p>
        Event momentum: {sample.native} · Library isMomentum: {sample.detected}
      </p>
      <p>
        Native events: {sample.nativeCount} · Events without native flag: {sample.heuristicCount}
      </p>
      <label>
        <input type="checkbox" checked={logging} onChange={(event) => setLogging(event.target.checked)} /> Log phase
        changes to the console
      </label>
      <p>Flick the trackpad and lift your fingers: native momentum should change from false to true during inertia.</p>
    </section>
  )
}
