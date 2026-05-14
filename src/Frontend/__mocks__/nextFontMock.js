// Mock for next/font/* — returns a function that produces className/style props
module.exports = new Proxy(
  {},
  {
    get: () =>
      function () {
        return { className: 'mock-font', style: { fontFamily: 'mock' }, variable: '--mock-font' };
      },
  }
);
