<p align="center">
  <a href="https://github.com/davidjerleke/embla-carousel" target="_blank"><img width="70" height="70" src="/assets/embla-logo.svg" alt="Embla Carousel"></a>
</p>
<h2 align="center">Wheel Gestures for Embla Carousel</h2>

<p align="center">
  This plugin adds wheel interactions to the amazing
  <a href="https://github.com/davidjerleke/embla-carousel">Embla Carousel</a>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/embla-carousel-wheel-gestures" target="_blank">
    <img src="https://img.shields.io/npm/v/embla-carousel-wheel-gestures.svg"
  /></a>
  
  <img alt="NPM" src="https://img.shields.io/npm/l/embla-carousel-wheel-gestures">
  
  <a href="https://bundlephobia.com/result?p=embla-carousel-wheel-gestures@1.0.2" target="_blank">
    <img
      src="https://img.shields.io/bundlephobia/minzip/embla-carousel-wheel-gestures?color=%234c1&label=gzip%20size"
    />
  </a>
</p>

## Installation

First you need to follow the [installation instructions for Embla Carousel](https://github.com/davidcetinkaya/embla-carousel#installation), after that you can add wheel support:

```sh
yarn add embla-carousel embla-carousel-wheel-gestures # npm install --save embla-carousel embla-carousel-wheel-gestures
```

### JavaScript / TypeScript

```js
import EmblaCarousel from 'embla-carousel'
import { WheelGesturesPlugin } from 'embla-carousel-wheel-gestures'

// initialize Embla Carousel
const embla = EmblaCarousel(emblaNode, options, [WheelGesturesPlugin()])
```

### React

```js
import useEmblaCarousel from 'embla-carousel-react'
import { WheelGesturesPlugin } from 'embla-carousel-wheel-gestures'

const EmblaCarouselComponent = ({ children }) => {
  const [emblaRef, embla] = useEmblaCarousel({ loop: false, skipSnaps: true }, [
    WheelGesturesPlugin(),
  ])

  // ...
}
```

With Embla Carousel v9, this plugin safely bails during SSR and attaches wheel listeners when the client hydrates.

## Examples

<p>Get started instantly with one of the CodeSandboxes below.</p>

<p>
  <img src="/assets/codesandbox.svg" height="23" align="top" /> &nbsp;
  <a href="https://codesandbox.io/s/github/xiel/embla-carousel-wheel-gestures/tree/master/docs/vanilla?file=/src/js/index.ts:1240-1266" target="_blank">
    <code>JavaScript / TypeScript</code>
  </a>
</p>

<p>
  <img src="/assets/codesandbox.svg" height="23" align="top" /> &nbsp;
  <a href="https://codesandbox.io/s/github/xiel/embla-carousel-wheel-gestures/tree/master/docs/react?file=/src/js/EmblaCarousel.tsx:879-942" target="_blank">
    <code>React (embla-carousel-react)</code>
  </a>
</p>

## Options

### wheelDraggingClass
**Type**: string<br/>
**Default**: is-wheel-dragging

Choose a classname that will be applied to the container during a wheel gesture. Pass an empty string to opt-out.


### forceWheelAxis
**Type**: 'x' | 'y'<br/>
**Default**: undefined

Force an axis on which to listen for wheel events. Useful if you want to slide horizontally when scrolling vertically or vice versa.


### target
**Type**: Element<br/>
**Default**: undefined

Specify the element that should be observed for wheel events.


### wheelStep
**Type**: number<br/>
**Default**: undefined

Advance exactly one slide for every `wheelStep` pixels of accumulated wheel movement, instead of mapping the wheel 1:1 onto a drag. This makes a short scroll snap to the next slide — similar to a classic mouse-wheel carousel — which feels much snappier with a notched mouse wheel, especially on vertical carousels. Lower values are snappier (fewer pixels per slide), higher values calmer.

When unset (the default) the original drag-style behaviour is kept, so this is fully backwards compatible.

```js
const embla = EmblaCarousel(emblaNode, options, [WheelGesturesPlugin({ wheelStep: 40 })])
```

The carousel advances at most one slide until the slide animation settles, so a single flick never overshoots; any leftover scroll distance carries over to the next step. At the edges of a non-looping carousel the wheel releases back to the page.

## Global Options

You can also set global options that will be applied to all instances. This allows for overriding the default plugin options with your own:

```js
WheelGesturesPlugin.globalOptions = {
  wheelDraggingClass: 'my-class',
}
```

## OS & Browser Support

- Mac OS (Chrome, Firefox, Safari, Edge), Magic Mouse, Magic Trackpad
- Windows (Chrome, Firefox, Edge), Microsoft Precision Touchpads

#### Legacy Browsers

If you need to support IE 10 & 11 you might need to install and add extra polyfills:

```js
// Adds support old IE >= 10
import 'core-js/stable'
import 'events-polyfill/src/constructors/MouseEvent'
```

## Thanks

Kudos to [David Jerleke](https://github.com/davidjerleke) for creating [Embla Carousel](https://github.com/davidjerleke/embla-carousel) with its open API 🙏

## License

MIT.
## Local development

Use Node 22.12 or newer and Yarn Classic. From this repository:

```sh
yarn install
yarn build
yarn start          # React SSR demo at http://localhost:5173
yarn start:vanilla  # Vanilla, UMD and Shadow DOM demos at http://localhost:1234
yarn demo:local     # React demo using all three sibling source checkouts
```

The React demo always loads this workspace's plugin source, with hot reload.
Normally it uses the installed Embla and wheel-gestures packages.
`demo:local` also resolves `../wheel-gestures/src` and the core, React, and
reactive-utils sources in `../embla-carousel/packages`. Keep those sibling
directories alongside this repository. No global `yarn link` state is needed;
React is deduplicated across the source checkouts. The UMD demo uses the locally
built plugin and installed Embla bundle.

Embla core and the React wrapper are pinned to `9.0.0-rc03`, the newest published
v9 prerelease. The npm `latest` tag still points to stable `8.6.0`.

Run `yarn test --runInBand`, `yarn lint`, and `yarn audit:dependencies` to check
the library, all demo types, and every dependency in the Yarn lockfile. The
audit includes workspace development dependencies and fails on high/critical
advisories. The Axios resolution keeps bundlewatch on the patched 0.x release.
