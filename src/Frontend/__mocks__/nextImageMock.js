const React = require('react');
// Mock for next/image
module.exports = function MockImage({ src, alt, ...props }) {
  return React.createElement('img', { src, alt, ...props });
};
module.exports.default = module.exports;
