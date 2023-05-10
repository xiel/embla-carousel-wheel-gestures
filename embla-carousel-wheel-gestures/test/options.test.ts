import { WheelGesturesPlugin } from '../src'

test('Passed options are returned', () => {
  const wheelGestures = WheelGesturesPlugin({ forceWheelAxis: 'y', target: document.body })
  expect(wheelGestures.options).toMatchInlineSnapshot(`
    Object {
      "forceWheelAxis": "y",
      "target": <body />,
    }
  `)
})

test('No passed options', () => {
  const wheelGestures = WheelGesturesPlugin()
  expect(wheelGestures.options).toMatchInlineSnapshot(`Object {}`)
})
