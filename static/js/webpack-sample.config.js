const path = require('path');

module.exports = {
  mode: 'development',
  entry: './src/index.js',
  // entry: {
  //   'index': './src/index.js',
  //   'shape-animated': './src/ShapeAnimated.js',
  //   'shape-static': './src/ShapeStatic.js',
  //   'canvas': './src/Canvas.js',
  // },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'main.js',
    // filename: '[name].bundle.js',
  },
}