/*global require,module,__dirname*/
const {join} = require('path')
  , moduleFolder = join(__dirname, 'src', 'frontend');

module.exports = env => ({
  'context': moduleFolder,
  'externals': {
    'angular': {
      'global': 'angular',
      'amd': 'angular',
      'root': 'angular'
    },
    'ws': {
      'commonjs': 'ws'
    }
  },
  'entry': {
    'angular-comunicator': './angular-comunicator.js',
    'comunicator': './module/comunicator.js'
  },
  'output': {
    'filename': env.prod ? '[name].min.js' : '[name].js',
    'path': join(__dirname, 'dist'),
    'pathinfo': !env.prod,
    'libraryTarget': 'umd'
  },
  'devtool': env.prod ? 'source-map' : 'eval',
  'module': {
    'loaders': [
      {
        'test': /\.js$/,
        'loaders': ['babel-loader'],
        'exclude': /node_modules/
      }
    ]
  }
});
