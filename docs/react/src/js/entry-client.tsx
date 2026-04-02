import React from 'react'
import ReactDOM from 'react-dom'

import App from './App'

const rootElement = document.getElementById('root')

if (!rootElement) {
  throw new Error('Missing #root element for React hydration.')
}

ReactDOM.hydrate(<App />, rootElement)
