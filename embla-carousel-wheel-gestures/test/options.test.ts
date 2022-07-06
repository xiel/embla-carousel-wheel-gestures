import { WheelGesturesPlugin } from '../src'

test('Passed options merged with defaults', () => {
  const wheelGestures = WheelGesturesPlugin({ forceWheelAxis: 'y', target: document.body })
  expect(wheelGestures.options).toMatchInlineSnapshot(`
    Object {
      "active": true,
      "breakpoints": Object {},
      "forceWheelAxis": "y",
      "target": <body />,
      "wheelDraggingClass": "is-wheel-dragging",
    }
  `)
})

test('No passed options, no global options', () => {
  const wheelGestures = WheelGesturesPlugin()
  expect(wheelGestures.options).toMatchInlineSnapshot(`
    Object {
      "active": true,
      "breakpoints": Object {},
      "forceWheelAxis": undefined,
      "target": undefined,
      "wheelDraggingClass": "is-wheel-dragging",
    }
  `)
})

test('Global options are merged correctly', () => {
  WheelGesturesPlugin.globalOptions = {
    forceWheelAxis: 'x',
    wheelDraggingClass: 'abc',
  }

  const wheelGestures = WheelGesturesPlugin()

  const wheelGestures2 = WheelGesturesPlugin({
    wheelDraggingClass: 'passed-class',
    target: document.body,
  })

  expect(wheelGestures.options).toMatchInlineSnapshot(`
    Object {
      "active": true,
      "breakpoints": Object {},
      "forceWheelAxis": "x",
      "target": undefined,
      "wheelDraggingClass": "abc",
    }
  `)
  expect(wheelGestures2.options).toMatchInlineSnapshot(`
    Object {
      "active": true,
      "breakpoints": Object {},
      "forceWheelAxis": "x",
      "target": <body />,
      "wheelDraggingClass": "passed-class",
    }
  `)
})
