import EmblaCarousel from 'embla-carousel'
import { WheelGesturesPlugin } from 'embla-carousel-wheel-gestures'

function initializeEmbla(root: ShadowRoot | HTMLElement) {
  const template = document.getElementById('embla-template') as HTMLTemplateElement

  root.appendChild(template.content.cloneNode(true))
  const wrapper = root.querySelector('.embla')! as HTMLElement
  const viewport = wrapper.querySelector('.embla__viewport')!

  EmblaCarousel(
    viewport as HTMLElement,
    {
      loop: true,
      skipSnaps: false,
      dragFree: true,
    },
    [WheelGesturesPlugin()]
  )
}

customElements.define(
  'embla-carousel-with-shadow',
  class extends HTMLElement {
    public constructor() {
      super()
      this.attachShadow({ mode: 'open' })
    }

    private connectedCallback() {
      initializeEmbla(this.shadowRoot)
    }
  }
)

customElements.define(
  'embla-carousel-no-shadow',
  class extends HTMLElement {
    private connectedCallback() {
      initializeEmbla(this)
    }
  }
)
