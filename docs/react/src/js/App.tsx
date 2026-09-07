import React, { useEffect, useState } from 'react'

import EmblaCarousel from './EmblaCarousel'
import MomentumDebug from './MomentumDebug'

const App = () => {
  const [isHydrated, setIsHydrated] = useState(false)
  const [showSecond, setShowSecond] = useState(false)

  useEffect(() => {
    setIsHydrated(true)
  }, [])

  return (
    <div className="content">
      <p style={{ marginBottom: 16 }}>
        <strong>Render mode:</strong> {isHydrated ? 'Hydrated on the client' : 'Server-rendered markup'}
      </p>
      <MomentumDebug />
      <EmblaCarousel>
        <div />
        <div />
        <div />
        <div />
        <div />
      </EmblaCarousel>
      <label style={{ display: 'block', marginTop: 64, marginBottom: 24 }}>
        <input type="checkbox" checked={showSecond} onChange={(event) => setShowSecond(event.target.checked)} />
        Show a second carousel to test independent gestures
      </label>
      {showSecond && (
        <EmblaCarousel>
          {Array.from({ length: 5 }, (_, index) => (
            <div key={index} />
          ))}
        </EmblaCarousel>
      )}
    </div>
  )
}

export default App
