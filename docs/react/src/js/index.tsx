import '../css/base.css'
import '../css/reset.css'

import React from 'react'
import ReactDOM from 'react-dom'

import EmblaCarousel from './EmblaCarousel'
import Footer from './Footer'

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
      <Footer />
    </>
  )
}

const rootElement = document.getElementById('root')
ReactDOM.render(<App />, rootElement)
