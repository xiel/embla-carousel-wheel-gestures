import React, { useEffect, useState } from 'react'

import EmblaCarousel from './EmblaCarousel'

const App = () => {
  const [isHydrated, setIsHydrated] = useState(false)

  useEffect(() => {
    setIsHydrated(true)
  }, [])

  return (
    <div className="content">
      <p style={{ marginBottom: 16 }}>
        <strong>Render mode:</strong> {isHydrated ? 'Hydrated on the client' : 'Server-rendered markup'}
      </p>
      <EmblaCarousel>
        <div />
        <div />
        <div />
        <div />
        <div />
      </EmblaCarousel>
    </div>
  )
}

export default App
