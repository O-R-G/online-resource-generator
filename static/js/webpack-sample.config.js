const path = require('path');

module.exports = {
  mode: 'development',
  entry: ['../../config/config.js', './src/index.js'],
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'main.js',
  },
}