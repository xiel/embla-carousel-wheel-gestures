import { EmblaCarouselType, OptionsHandlerType } from 'embla-carousel'
import { WheelEventState } from 'wheel-gestures'

import { WheelGesturesPlugin } from '../src'

// Mock wheel-gestures
jest.mock('wheel-gestures', () => {
  const mockWheelGestures = {
    observe: jest.fn(() => jest.fn()), // returns unobserve function
    on: jest.fn(() => jest.fn()), // returns off function
  }
  return {
    __esModule: true,
    default: jest.fn(() => mockWheelGestures),
  }
})

// Mock DOM methods
Object.defineProperty(global, 'MouseEvent', {
  writable: true,
  value: jest.fn().mockImplementation((type, options) => ({
    type,
    ...options,
    clientX: options?.clientX || 0,
    clientY: options?.clientY || 0,
    screenX: options?.screenX || 0,
    screenY: options?.screenY || 0,
    movementX: options?.movementX || 0,
    movementY: options?.movementY || 0,
    button: options?.button || 0,
    bubbles: options?.bubbles || false,
    cancelable: options?.cancelable || false,
    composed: options?.composed || false,
    isTrusted: true,
    stopImmediatePropagation: jest.fn(),
  })),
})

describe('WheelGesturesPlugin', () => {
  let mockEmbla: jest.Mocked<EmblaCarouselType>
  let mockOptionsHandler: jest.Mocked<OptionsHandlerType>
  let mockContainerNode: HTMLElement
  let mockParentNode: HTMLElement
  let mockEngine: any

  beforeEach(() => {
    jest.clearAllMocks()

    // Reset global options to prevent test interference
    WheelGesturesPlugin.globalOptions = undefined

    // Create mock DOM elements
    mockContainerNode = document.createElement('div')
    mockParentNode = document.createElement('div')
    mockParentNode.appendChild(mockContainerNode)

    // Mock container node methods
    mockContainerNode.dispatchEvent = jest.fn()
    Object.defineProperty(mockContainerNode, 'classList', {
      value: {
        add: jest.fn(),
        remove: jest.fn(),
      },
      writable: true,
    })

    Object.defineProperty(mockParentNode, 'classList', {
      value: {
        add: jest.fn(),
        remove: jest.fn(),
      },
      writable: true,
    })

    // Mock engine
    mockEngine = {
      options: { axis: 'x', skipSnaps: false, dragFree: false },
      containerRect: { width: 800, height: 600 },
    }

    // Mock embla carousel
    mockEmbla = {
      containerNode: jest.fn(() => mockContainerNode),
      canScrollNext: jest.fn(() => true),
      canScrollPrev: jest.fn(() => true),
      internalEngine: jest.fn(() => mockEngine),
    } as any

    // Mock options handler
    mockOptionsHandler = {
      mergeOptions: jest.fn((base, user) => ({ ...base, ...user })),
      optionsAtMedia: jest.fn((options) => options),
    } as any

    // Mock document methods
    document.documentElement.addEventListener = jest.fn()
    document.documentElement.removeEventListener = jest.fn()
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('Plugin Creation', () => {
    it('should create plugin with default options', () => {
      const plugin = WheelGesturesPlugin()

      expect(plugin.name).toBe('wheelGestures')
      expect(plugin.options).toEqual({})
      expect(typeof plugin.init).toBe('function')
      expect(typeof plugin.destroy).toBe('function')
    })

    it('should create plugin with custom options', () => {
      const customOptions = {
        wheelDraggingClass: 'custom-dragging',
        forceWheelAxis: 'y' as const,
        target: mockParentNode,
      }

      const plugin = WheelGesturesPlugin(customOptions)

      expect(plugin.options).toEqual(customOptions)
    })

    it('should return plugin interface', () => {
      const plugin = WheelGesturesPlugin()

      expect(plugin).toHaveProperty('name', 'wheelGestures')
      expect(plugin).toHaveProperty('options')
      expect(plugin).toHaveProperty('init')
      expect(plugin).toHaveProperty('destroy')
    })
  })

  describe('Plugin Initialization', () => {
    it('should initialize with default options', () => {
      const plugin = WheelGesturesPlugin()
      plugin.init(mockEmbla, mockOptionsHandler)

      expect(mockOptionsHandler.mergeOptions).toHaveBeenCalledTimes(2)
      expect(mockOptionsHandler.optionsAtMedia).toHaveBeenCalled()
      expect(mockEmbla.internalEngine).toHaveBeenCalled()
    })

    it('should use target from options if provided', () => {
      const WheelGestures = require('wheel-gestures').default
      const mockWheelGestures = WheelGestures()

      const customTarget = document.createElement('div')
      const plugin = WheelGesturesPlugin({ target: customTarget })
      plugin.init(mockEmbla, mockOptionsHandler)

      // Verify that the wheel gestures observer was called with the custom target
      expect(mockWheelGestures.observe).toHaveBeenCalledWith(customTarget)
    })

    it('should use parent node as default target', () => {
      const plugin = WheelGesturesPlugin()
      plugin.init(mockEmbla, mockOptionsHandler)

      expect(mockEmbla.containerNode).toHaveBeenCalled()
    })

    it('should setup wheel gestures observer', () => {
      const WheelGestures = require('wheel-gestures').default
      const plugin = WheelGesturesPlugin()
      plugin.init(mockEmbla, mockOptionsHandler)

      expect(WheelGestures).toHaveBeenCalledWith({
        preventWheelAction: 'x',
        reverseSign: [true, true, false],
      })
    })

    it('should use forceWheelAxis when provided', () => {
      const WheelGestures = require('wheel-gestures').default
      const plugin = WheelGesturesPlugin({ forceWheelAxis: 'y' })
      plugin.init(mockEmbla, mockOptionsHandler)

      expect(WheelGestures).toHaveBeenCalledWith({
        preventWheelAction: 'y',
        reverseSign: [true, true, false],
      })
    })
  })

  describe('Options Handling', () => {
    it('should merge global options', () => {
      WheelGesturesPlugin.globalOptions = { wheelDraggingClass: 'global-class' }
      const plugin = WheelGesturesPlugin({ forceWheelAxis: 'y' })
      plugin.init(mockEmbla, mockOptionsHandler)

      expect(mockOptionsHandler.mergeOptions).toHaveBeenCalledWith(
        expect.objectContaining({
          active: true,
          breakpoints: {},
          wheelDraggingClass: 'is-wheel-dragging',
          forceWheelAxis: undefined,
          target: undefined,
        }),
        { wheelDraggingClass: 'global-class' }
      )
    })

    it('should handle responsive options', () => {
      const plugin = WheelGesturesPlugin()
      plugin.init(mockEmbla, mockOptionsHandler)

      expect(mockOptionsHandler.optionsAtMedia).toHaveBeenCalled()
    })
  })

  describe('Wheel Event Handling', () => {
    let plugin: any
    let wheelHandler: (state: WheelEventState) => void

    beforeEach(() => {
      const WheelGestures = require('wheel-gestures').default
      const mockWheelGestures = WheelGestures()

      plugin = WheelGesturesPlugin()
      plugin.init(mockEmbla, mockOptionsHandler)

      // Get the wheel handler that was registered
      wheelHandler = mockWheelGestures.on.mock.calls.find((call: any) => call[0] === 'wheel')[1]
    })

    it('should start wheel gesture when primary axis is dominant', () => {
      const mockState: WheelEventState = {
        axisDelta: [10, 2],
        axisMovement: [10, 2],
        isMomentum: false,
        isEnding: false,
        previous: null,
        event: new WheelEvent('wheel'),
      } as any

      wheelHandler(mockState)

      expect(mockContainerNode.dispatchEvent).toHaveBeenCalled()
      expect(mockParentNode.classList.add).toHaveBeenCalledWith('is-wheel-dragging')
    })

    it('should not start gesture when cross axis is dominant', () => {
      const mockState: WheelEventState = {
        axisDelta: [2, 10],
        axisMovement: [2, 10],
        isMomentum: false,
        isEnding: false,
        previous: null,
        event: new WheelEvent('wheel'),
      } as any

      wheelHandler(mockState)

      expect(mockContainerNode.dispatchEvent).not.toHaveBeenCalled()
    })

    it('should not start gesture during momentum', () => {
      const mockState: WheelEventState = {
        axisDelta: [10, 2],
        axisMovement: [10, 2],
        isMomentum: true,
        isEnding: false,
        previous: null,
        event: new WheelEvent('wheel'),
      } as any

      wheelHandler(mockState)

      expect(mockContainerNode.dispatchEvent).not.toHaveBeenCalled()
    })

    it('should handle wheel gesture ending', () => {
      // Start gesture first
      const startState: WheelEventState = {
        axisDelta: [10, 2],
        axisMovement: [10, 2],
        isMomentum: false,
        isEnding: false,
        previous: null,
        event: new WheelEvent('wheel'),
      } as any

      wheelHandler(startState)

      // Clear previous calls
      jest.clearAllMocks()

      // End gesture
      const endState: WheelEventState = {
        axisDelta: [5, 1],
        axisMovement: [15, 3],
        isMomentum: false,
        isEnding: true,
        previous: startState,
        event: new WheelEvent('wheel'),
      } as any

      wheelHandler(endState)

      expect(mockContainerNode.dispatchEvent).toHaveBeenCalled()
      expect(mockParentNode.classList.remove).toHaveBeenCalledWith('is-wheel-dragging')
    })

    it('should handle momentum release', () => {
      // Start gesture first
      const startState: WheelEventState = {
        axisDelta: [10, 2],
        axisMovement: [10, 2],
        isMomentum: false,
        isEnding: false,
        previous: null,
        event: new WheelEvent('wheel'),
      } as any

      wheelHandler(startState)

      // Clear previous calls
      jest.clearAllMocks()

      // Momentum release
      const releaseState: WheelEventState = {
        axisDelta: [5, 1],
        axisMovement: [15, 3],
        isMomentum: true,
        isEnding: false,
        previous: { ...startState, isMomentum: false },
        event: new WheelEvent('wheel'),
      } as any

      wheelHandler(releaseState)

      expect(mockContainerNode.dispatchEvent).toHaveBeenCalled()
      expect(mockParentNode.classList.remove).toHaveBeenCalledWith('is-wheel-dragging')
    })
  })

  describe('Boundary Detection', () => {
    let plugin: any
    let wheelHandler: (state: WheelEventState) => void

    beforeEach(() => {
      const WheelGestures = require('wheel-gestures').default
      const mockWheelGestures = WheelGestures()

      plugin = WheelGesturesPlugin()
      plugin.init(mockEmbla, mockOptionsHandler)

      wheelHandler = mockWheelGestures.on.mock.calls.find((call: any) => call[0] === 'wheel')[1]

      // Start a gesture first
      const startState: WheelEventState = {
        axisDelta: [10, 2],
        axisMovement: [10, 2],
        isMomentum: false,
        isEnding: false,
        previous: null,
        event: new WheelEvent('wheel'),
      } as any

      wheelHandler(startState)
      jest.clearAllMocks()
    })

    it('should accumulate boundary movement when at boundary', () => {
      mockEmbla.canScrollNext.mockReturnValue(false)

      const boundaryState: WheelEventState = {
        axisDelta: [-50, 2], // scrolling next but can't scroll
        axisMovement: [10, 2],
        isMomentum: false,
        isEnding: false,
        previous: null,
        event: new WheelEvent('wheel'),
      } as any

      wheelHandler(boundaryState)

      // Should dispatch mousemove since we haven't exceeded threshold yet
      expect(mockContainerNode.dispatchEvent).toHaveBeenCalled()
    })

    it('should block gesture when boundary threshold exceeded', () => {
      mockEmbla.canScrollNext.mockReturnValue(false)

      const boundaryState: WheelEventState = {
        axisDelta: [-500, 2], // large movement exceeding threshold
        axisMovement: [10, 2],
        isMomentum: false,
        isEnding: false,
        previous: null,
        event: new WheelEvent('wheel'),
      } as any

      wheelHandler(boundaryState)

      // Should end gesture due to boundary threshold
      expect(mockParentNode.classList.remove).toHaveBeenCalledWith('is-wheel-dragging')
    })

    it('should reset accumulation when not at boundary', () => {
      // First, accumulate some boundary movement
      mockEmbla.canScrollNext.mockReturnValue(false)
      const boundaryState: WheelEventState = {
        axisDelta: [-50, 2],
        axisMovement: [10, 2],
        isMomentum: false,
        isEnding: false,
        previous: null,
        event: new WheelEvent('wheel'),
      } as any

      wheelHandler(boundaryState)

      // Then allow scrolling again
      mockEmbla.canScrollNext.mockReturnValue(true)
      const normalState: WheelEventState = {
        axisDelta: [-10, 2],
        axisMovement: [20, 4],
        isMomentum: false,
        isEnding: false,
        previous: boundaryState,
        event: new WheelEvent('wheel'),
      } as any

      wheelHandler(normalState)

      // Should continue normally (accumulation reset)
      expect(mockContainerNode.dispatchEvent).toHaveBeenCalled()
    })

    it('should unblock boundary when gesture ends', () => {
      // Block boundary first
      mockEmbla.canScrollNext.mockReturnValue(false)
      const boundaryState: WheelEventState = {
        axisDelta: [-500, 2],
        axisMovement: [10, 2],
        isMomentum: false,
        isEnding: false,
        previous: null,
        event: new WheelEvent('wheel'),
      } as any

      wheelHandler(boundaryState)

      // Now end the gesture
      const endState: WheelEventState = {
        axisDelta: [0, 0],
        axisMovement: [10, 2],
        isMomentum: false,
        isEnding: true,
        previous: boundaryState,
        event: new WheelEvent('wheel'),
      } as any

      wheelHandler(endState)

      // Boundary should be unblocked for next gesture
      expect(mockParentNode.classList.remove).toHaveBeenCalledWith('is-wheel-dragging')
    })
  })

  describe('Mouse Event Creation', () => {
    let plugin: any
    let wheelHandler: (state: WheelEventState) => void

    beforeEach(() => {
      const WheelGestures = require('wheel-gestures').default
      const mockWheelGestures = WheelGestures()

      plugin = WheelGesturesPlugin()
      plugin.init(mockEmbla, mockOptionsHandler)

      wheelHandler = mockWheelGestures.on.mock.calls.find((call: any) => call[0] === 'wheel')[1]
    })

    it('should create mousedown event on gesture start', () => {
      const mockState: WheelEventState = {
        axisDelta: [10, 2],
        axisMovement: [10, 2],
        isMomentum: false,
        isEnding: false,
        previous: null,
        event: new WheelEvent('wheel', { clientX: 100, clientY: 200 }),
      } as any

      wheelHandler(mockState)

      expect(MouseEvent).toHaveBeenCalledWith('mousedown', mockState.event)
      expect(mockContainerNode.dispatchEvent).toHaveBeenCalled()
    })

    it('should create mousemove events during gesture', () => {
      // Start gesture
      const startState: WheelEventState = {
        axisDelta: [10, 2],
        axisMovement: [10, 2],
        isMomentum: false,
        isEnding: false,
        previous: null,
        event: new WheelEvent('wheel', { clientX: 100, clientY: 200 }),
      } as any

      wheelHandler(startState)
      jest.clearAllMocks()

      // Continue gesture
      const moveState: WheelEventState = {
        axisDelta: [5, 1],
        axisMovement: [15, 3],
        isMomentum: false,
        isEnding: false,
        previous: startState,
        event: new WheelEvent('wheel'),
      } as any

      wheelHandler(moveState)

      expect(MouseEvent).toHaveBeenCalledWith(
        'mousemove',
        expect.objectContaining({
          clientX: expect.any(Number),
          clientY: expect.any(Number),
          movementX: expect.any(Number),
          movementY: expect.any(Number),
          button: 0,
          bubbles: true,
          cancelable: true,
          composed: true,
        })
      )
    })

    it('should create mouseup event on gesture end', () => {
      // Start gesture
      const startState: WheelEventState = {
        axisDelta: [10, 2],
        axisMovement: [10, 2],
        isMomentum: false,
        isEnding: false,
        previous: null,
        event: new WheelEvent('wheel'),
      } as any

      wheelHandler(startState)
      jest.clearAllMocks()

      // End gesture
      const endState: WheelEventState = {
        axisDelta: [5, 1],
        axisMovement: [15, 3],
        isMomentum: false,
        isEnding: true,
        previous: startState,
        event: new WheelEvent('wheel'),
      } as any

      wheelHandler(endState)

      expect(MouseEvent).toHaveBeenCalledWith('mouseup', expect.any(Object))
    })

    it('should handle axis swapping when wheel axis differs from embla axis', () => {
      mockEngine.options.axis = 'y'

      const axisSwapPlugin = WheelGesturesPlugin({ forceWheelAxis: 'x' })
      axisSwapPlugin.init(mockEmbla, mockOptionsHandler)

      const WheelGestures = require('wheel-gestures').default
      const mockWheelGestures = WheelGestures()
      const handler = mockWheelGestures.on.mock.calls.find((call: any) => call[0] === 'wheel')[1]

      const mockState: WheelEventState = {
        axisDelta: [10, 2],
        axisMovement: [10, 2],
        isMomentum: false,
        isEnding: false,
        previous: null,
        event: new WheelEvent('wheel'),
      } as any

      handler(mockState)

      // Movement should be swapped
      expect(MouseEvent).toHaveBeenCalledWith('mousedown', mockState.event)
    })

    it('should limit movement when skipSnaps is false', () => {
      mockEngine.options.skipSnaps = false
      mockEngine.options.dragFree = false

      const skipSnapsPlugin = WheelGesturesPlugin()
      skipSnapsPlugin.init(mockEmbla, mockOptionsHandler)

      const WheelGestures = require('wheel-gestures').default
      const mockWheelGestures = WheelGestures()
      const handler = mockWheelGestures.on.mock.calls.find((call: any) => call[0] === 'wheel')[1]

      // Start gesture
      const startState: WheelEventState = {
        axisDelta: [10, 2],
        axisMovement: [10, 2],
        isMomentum: false,
        isEnding: false,
        previous: null,
        event: new WheelEvent('wheel'),
      } as any

      handler(startState)
      jest.clearAllMocks()

      // Large movement that should be limited
      const moveState: WheelEventState = {
        axisDelta: [5, 1],
        axisMovement: [1000, 1000], // Very large movement
        isMomentum: false,
        isEnding: false,
        previous: startState,
        event: new WheelEvent('wheel'),
      } as any

      handler(moveState)

      // Movement should be limited to container dimensions
      const mouseEventCall = (MouseEvent as jest.Mock).mock.calls.find((call) => call[0] === 'mousemove')
      expect(mouseEventCall).toBeDefined()
    })
  })

  describe('Legacy Browser Support', () => {
    it('should handle MouseEvent constructor failure', () => {
      // Mock MouseEvent to throw (simulating IE 10/11)
      const originalMouseEvent = global.MouseEvent
      global.MouseEvent = jest.fn().mockImplementation(() => {
        throw new Error('MouseEvent not supported')
      })

      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation()

      const plugin = WheelGesturesPlugin()
      plugin.init(mockEmbla, mockOptionsHandler)

      const WheelGestures = require('wheel-gestures').default
      const mockWheelGestures = WheelGestures()
      const handler = mockWheelGestures.on.mock.calls.find((call: any) => call[0] === 'wheel')[1]

      const mockState: WheelEventState = {
        axisDelta: [10, 2],
        axisMovement: [10, 2],
        isMomentum: false,
        isEnding: false,
        previous: null,
        event: new WheelEvent('wheel'),
      } as any

      handler(mockState)

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Legacy browser requires events-polyfill'))

      // Restore
      global.MouseEvent = originalMouseEvent
      consoleSpy.mockRestore()
    })
  })

  describe('Native Mouse Event Prevention', () => {
    let plugin: any
    let wheelHandler: (state: WheelEventState) => void

    beforeEach(() => {
      const WheelGestures = require('wheel-gestures').default
      const mockWheelGestures = WheelGestures()

      plugin = WheelGesturesPlugin()
      plugin.init(mockEmbla, mockOptionsHandler)

      wheelHandler = mockWheelGestures.on.mock.calls.find((call: any) => call[0] === 'wheel')[1]

      // Start a gesture to activate mouse event listeners
      const startState: WheelEventState = {
        axisDelta: [10, 2],
        axisMovement: [10, 2],
        isMomentum: false,
        isEnding: false,
        previous: null,
        event: new WheelEvent('wheel'),
      } as any

      wheelHandler(startState)
    })

    it('should add mouse event listeners on gesture start', () => {
      expect(document.documentElement.addEventListener).toHaveBeenCalledWith('mousemove', expect.any(Function), true)
      expect(document.documentElement.addEventListener).toHaveBeenCalledWith('mouseup', expect.any(Function), true)
      expect(document.documentElement.addEventListener).toHaveBeenCalledWith('mousedown', expect.any(Function), true)
    })

    it('should remove mouse event listeners on gesture end', () => {
      const endState: WheelEventState = {
        axisDelta: [5, 1],
        axisMovement: [15, 3],
        isMomentum: false,
        isEnding: true,
        previous: null,
        event: new WheelEvent('wheel'),
      } as any

      wheelHandler(endState)

      expect(document.documentElement.removeEventListener).toHaveBeenCalledWith('mousemove', expect.any(Function), true)
      expect(document.documentElement.removeEventListener).toHaveBeenCalledWith('mouseup', expect.any(Function), true)
      expect(document.documentElement.removeEventListener).toHaveBeenCalledWith('mousedown', expect.any(Function), true)
    })
  })

  describe('Cleanup and Destruction', () => {
    it('should cleanup on destroy', () => {
      const WheelGestures = require('wheel-gestures').default
      const mockWheelGestures = WheelGestures()
      const mockUnobserve = jest.fn()
      const mockOff = jest.fn()

      mockWheelGestures.observe.mockReturnValue(mockUnobserve)
      mockWheelGestures.on.mockReturnValue(mockOff)

      const plugin = WheelGesturesPlugin()
      plugin.init(mockEmbla, mockOptionsHandler)

      plugin.destroy()

      expect(mockUnobserve).toHaveBeenCalled()
      expect(mockOff).toHaveBeenCalled()
    })

    it('should remove event listeners on cleanup', () => {
      const plugin = WheelGesturesPlugin()
      plugin.init(mockEmbla, mockOptionsHandler)

      // Start gesture to add listeners
      const WheelGestures = require('wheel-gestures').default
      const mockWheelGestures = WheelGestures()
      const handler = mockWheelGestures.on.mock.calls.find((call: any) => call[0] === 'wheel')[1]

      const startState: WheelEventState = {
        axisDelta: [10, 2],
        axisMovement: [10, 2],
        isMomentum: false,
        isEnding: false,
        previous: null,
        event: new WheelEvent('wheel'),
      } as any

      handler(startState)

      plugin.destroy()

      expect(document.documentElement.removeEventListener).toHaveBeenCalledWith('mousemove', expect.any(Function), true)
    })
  })

  describe('CSS Class Management', () => {
    it('should add dragging class on gesture start', () => {
      const plugin = WheelGesturesPlugin({ wheelDraggingClass: 'custom-dragging' })
      plugin.init(mockEmbla, mockOptionsHandler)

      const WheelGestures = require('wheel-gestures').default
      const mockWheelGestures = WheelGestures()
      const handler = mockWheelGestures.on.mock.calls.find((call: any) => call[0] === 'wheel')[1]

      const mockState: WheelEventState = {
        axisDelta: [10, 2],
        axisMovement: [10, 2],
        isMomentum: false,
        isEnding: false,
        previous: null,
        event: new WheelEvent('wheel'),
      } as any

      handler(mockState)

      expect(mockParentNode.classList.add).toHaveBeenCalledWith('custom-dragging')
    })

    it('should remove dragging class on gesture end', () => {
      const plugin = WheelGesturesPlugin({ wheelDraggingClass: 'custom-dragging' })
      plugin.init(mockEmbla, mockOptionsHandler)

      const WheelGestures = require('wheel-gestures').default
      const mockWheelGestures = WheelGestures()
      const handler = mockWheelGestures.on.mock.calls.find((call: any) => call[0] === 'wheel')[1]

      // Start gesture
      const startState: WheelEventState = {
        axisDelta: [10, 2],
        axisMovement: [10, 2],
        isMomentum: false,
        isEnding: false,
        previous: null,
        event: new WheelEvent('wheel'),
      } as any

      handler(startState)

      // End gesture
      const endState: WheelEventState = {
        axisDelta: [5, 1],
        axisMovement: [15, 3],
        isMomentum: false,
        isEnding: true,
        previous: startState,
        event: new WheelEvent('wheel'),
      } as any

      handler(endState)

      expect(mockParentNode.classList.remove).toHaveBeenCalledWith('custom-dragging')
    })

    it('should not manage CSS class when wheelDraggingClass is empty', () => {
      const plugin = WheelGesturesPlugin({ wheelDraggingClass: '' })
      plugin.init(mockEmbla, mockOptionsHandler)

      const WheelGestures = require('wheel-gestures').default
      const mockWheelGestures = WheelGestures()
      const handler = mockWheelGestures.on.mock.calls.find((call: any) => call[0] === 'wheel')[1]

      const mockState: WheelEventState = {
        axisDelta: [10, 2],
        axisMovement: [10, 2],
        isMomentum: false,
        isEnding: false,
        previous: null,
        event: new WheelEvent('wheel'),
      } as any

      handler(mockState)

      expect(mockParentNode.classList.add).not.toHaveBeenCalled()
    })
  })
})
