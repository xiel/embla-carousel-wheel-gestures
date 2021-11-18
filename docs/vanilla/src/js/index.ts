import '../css/base.css'
import '../css/reset.css'
import '../css/embla.css'
import '../css/radio.css'
// Adds support old IE >= 10
import 'core-js/stable'
import 'events-polyfill/src/constructors/MouseEvent'

import EmblaCarousel from 'embla-carousel'
import { WheelGesturesPlugin } from 'embla-carousel-wheel-gestures'

import { setupRTLDirectionIfNeeded } from './directionRTL'
import { generateDotBtns, selectDotBtn, setupDotBtns } from './dotButtons'
import { disablePrevNextBtns, setupPrevNextBtns } from './prevAndNextButtons'
import { setupRadioButtons } from './radioButtons'

const wrap = document.documentElement.querySelector('.embla')! as HTMLElement
const viewPort = wrap.querySelector('.embla__viewport')!
const prevBtn = wrap.querySelector('.embla__button--prev')
const nextBtn = wrap.querySelector('.embla__button--next')
const dots = wrap.querySelector('.embla__dots')
const radioButtons = document.querySelectorAll('.radio__input')
const radioButtonsArray = [].slice.call(radioButtons)

const embla = EmblaCarousel(
  viewPort as HTMLElement,
  {
    loop: false,
    skipSnaps: true,
  },
  [
    // Add support for wheel gestures
    WheelGesturesPlugin(),
  ]
)
console.log(`embla`, embla)

const dotsArray = generateDotBtns(dots, embla)
const setSelectedDotBtn = selectDotBtn(dotsArray, embla)
const disablePrevAndNextBtns = disablePrevNextBtns(prevBtn, nextBtn, embla)

setupPrevNextBtns(prevBtn, nextBtn, embla)
setupDotBtns(dotsArray, embla)
setupRadioButtons(radioButtonsArray, embla, disablePrevAndNextBtns)
setupRTLDirectionIfNeeded(embla, wrap) // visit with query parameter (?rtl)

embla.on('select', setSelectedDotBtn)
embla.on('select', disablePrevAndNextBtns)
embla.on('init', setSelectedDotBtn)
embla.on('init', disablePrevAndNextBtns)
