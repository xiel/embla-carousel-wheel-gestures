import * as ExportedInterface from './index'

test('snapshot exported interface', () => {
  expect(ExportedInterface).toMatchInlineSnapshot(`
    Object {
      "WheelGesturesPlugin": [Function],
    }
  `)
})
