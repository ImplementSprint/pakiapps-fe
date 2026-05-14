const React = require('react');

// Mock for next/image — no prop-types validation needed in test mocks
/* eslint-disable react/prop-types */
function MockImage(props) {
  const { src, alt, ...rest } = props;
  return React.createElement('img', { src, alt, ...rest });
}
/* eslint-enable react/prop-types */

module.exports = MockImage;
module.exports.default = MockImage;
