const path = require('path');

module.exports = {
  mode: 'development',
  entry: './static/js/src/index.js',
  output: {
    path: path.resolve(__dirname, 'static/js/dist'),
    filename: 'main.js',
  },
}