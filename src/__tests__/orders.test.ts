function sum3(a, b) {
  return a + b;
}

test("adds 1 + 2 to equal 3", () => {
  expect(sum3(1, 2)).toBe(3);
});
