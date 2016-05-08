var path = require('path');
var webpack = require('webpack');
var AssetsPlugin = require('assets-webpack-plugin');
var ExtractTextPlugin = require('extract-text-webpack-plugin');

module.exports = {
  context: __dirname,
  entry: {
    app: [
      './client/index',
    ],
    vendor: [
      'babel-polyfill',
      'isomorphic-fetch',
      'react',
      'react-dom',
      'react-redux',
      'react-router',
      'react-router-redux',
      'react-swipe',
      'redux',
      'browser-cookies',
      'jquery',
      'moment',
    ],
  },
  output: {
    path: path.join(__dirname, '../dist/new_static'),
    filename: '[name].[hash].js',
    chunkFilename: '[id].[hash].chunk.js',
    publicPath: '//js.moviefan.com.cn/new_static/',
  },
  plugins: [
    new webpack.optimize.OccurenceOrderPlugin(),
    new webpack.optimize.UglifyJsPlugin({ compress: { warnings: false } }),
    new webpack.optimize.CommonsChunkPlugin('vendor', 'vendor.[hash].js', 2),
    new webpack.NoErrorsPlugin(),
    new webpack.DefinePlugin({
      __DEV__: false,
    }),
    new AssetsPlugin({ filename: 'assets.json', path: __dirname }),
    new ExtractTextPlugin('common.[hash].css'),
  ],
  module: {
    loaders: [
      {
        test: /\.js$/,
        loaders: ['babel'],
        include: __dirname,
        exclude: /node_modules/,
      },
      {
        test: /\.css$/,
        loader: ExtractTextPlugin.extract(
          'style',
          'css?modules&importLoaders=2&localIdentName=[name]_[local]__[hash:base64:5]!autoprefixer?browsers=last 2 version'
        ),
      },
      { test: /\.(jpg|png|gif)$/, loader: 'url-loader?limit=10240' },
    ],
  },
};