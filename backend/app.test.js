import app from "./app.js"

test('App module should exist', () => {
  expect.assertions(1);
  expect(app).toBeDefined();
});