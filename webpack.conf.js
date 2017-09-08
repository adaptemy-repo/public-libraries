const webpack = require('webpack');

module.exports = {
  entry: {
    main: './index.js'
  },
  output: {
    publicPath: '',
    filename: '[name].[hash].js'
  },
  module: {
    loaders: [
      // static text
      { test: /\.js(x)?$/, loader: 'babel-loader!source-map-loader', exclude: /node_modules(?!\/adaptemy-libs)/ },
      { test: /\.json$/, loader: 'json-loader' },
    ]
  },
  plugins: [
    new webpack.NamedModulesPlugin(),
  ],
  devtool: 'inline-source-map',
};
