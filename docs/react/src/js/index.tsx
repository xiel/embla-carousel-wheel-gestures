import '../css/base.css'
import '../css/reset.css'

import React from 'react'
import ReactDOM from 'react-dom'

import EmblaCarousel from './EmblaCarousel'

const App = () => {
  return (
    <>
      <div className="content">
        <EmblaCarousel>
          <div />
          <div />
          <div />
          <div />
          <div />
        </EmblaCarousel>
      </div>
    </>
  )
}

const init = function() {
  let rootElement = document.getElementById('root')
  if (!rootElement) {
    rootElement = document.createElement('div')
    document.body.append(rootElement)
  }
  ReactDOM.render(<App />, rootElement)
}

if (document.readyState === 'complete') {
  init()
} else {
  document.addEventListener('DOMContentLoaded', init)
}
