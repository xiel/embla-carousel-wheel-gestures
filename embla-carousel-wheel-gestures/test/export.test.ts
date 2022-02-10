import * as ExportedInterface from '../src'

test('snapshot exported interface', () => {
  expect(ExportedInterface).toMatchInlineSnapshot(`
    Object {
      "WheelGesturesPlugin": [Function],
    }
  `)
})
