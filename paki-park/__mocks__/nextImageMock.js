const React = require('react');

// Mock for next/image — no prop-types validation needed in test mocks
 
function MockImage(props) {
  const { src, alt, ...rest } = props;
  return React.createElement('img', { src, alt, ...rest });
}
 

module.exports = MockImage;
module.exports.default = MockImage;
