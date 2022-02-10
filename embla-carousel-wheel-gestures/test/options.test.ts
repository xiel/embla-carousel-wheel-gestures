import { WheelGesturesPlugin } from '../src'

test('Passed options merged with defaults', () => {
  const wheelGestures = WheelGesturesPlugin({ forceWheelAxis: 'y' })
  expect(wheelGestures.options).toMatchInlineSnapshot(`
    Object {
      "forceWheelAxis": "y",
      "wheelDraggingClass": "is-wheel-dragging",
    }
  `)
})

test('No passed options, no global options', () => {
  const wheelGestures = WheelGesturesPlugin()
  expect(wheelGestures.options).toMatchInlineSnapshot(`
    Object {
      "forceWheelAxis": undefined,
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
  })

  expect(wheelGestures.options).toMatchInlineSnapshot(`
    Object {
      "forceWheelAxis": "x",
      "wheelDraggingClass": "abc",
    }
  `)
  expect(wheelGestures2.options).toMatchInlineSnapshot(`
    Object {
      "forceWheelAxis": "x",
      "wheelDraggingClass": "passed-class",
    }
  `)
})
