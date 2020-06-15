<h2 align="center">Wheel Gestures for Embla Carousel</h2>

<p align="center">
  This plugin adds wheel interactions to the amazing
  <a href="https://github.com/xiel/embla-carousel-wheel-gestures.">Embla Carousel</a>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/embla-carousel-wheel-gestures" target="_blank">
    <img src="https://img.shields.io/npm/v/embla-carousel-wheel-gestures.svg"
  /></a>
  <a href="https://prettier.io" target="_blank">
    <img src="https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat"
  /></a>
  <a href="https://www.npmjs.com/package/embla-carousel-wheel-gestures" target="_blank">
    <img
      src="https://img.shields.io/bundlephobia/minzip/embla-carousel-wheel-gestures?color=%234c1&label=gzip%20size"
    />
  </a>
</p>

### Installation

First you need to follow the [installation instructions for Embla Carousel](https://github.com/davidcetinkaya/embla-carousel#installation), after that you can add wheel support:

````sh
yarn add embla-carousel-wheel-gestures
````

#### JavaScript / TypeScript

````js
import EmblaCarousel from 'embla-carousel'
import { setupWheelGestures } from 'embla-carousel-wheel-gestures'

// initialize Embla Carousel
const embla = EmblaCarousel(emblaNode, options)

// add support for wheen events
setupWheelGestures(embla)
````

#### React

````js
import { useEmblaCarousel } from 'embla-carousel-react'
import { setupWheelGestures } from 'embla-carousel-wheel-gestures'

const EmblaCarouselComponent = ({ children }) => {
  const [EmblaCarouselReact, embla] = useEmblaCarousel({ loop: false })

  useEffect(() => embla && setupWheelGestures(embla), [embla])

  // ...
}
````

