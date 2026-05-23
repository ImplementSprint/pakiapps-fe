// Mock for next/font/* — returns a function that produces className/style props
function makeFontMock() {
  return { className: 'mock-font', style: { fontFamily: 'mock' }, variable: '--mock-font' };
}

module.exports = new Proxy(
  {},
  {
    get: () => makeFontMock,
  }
);
