const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CopyPlugin = require('copy-webpack-plugin');

module.exports = (_, { mode }) => ({
  entry: './src/index.ts',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'main.js',
    clean: true,
  },
  resolve: {
    extensions: ['.ts', '.js'],
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
      {
        test: /\.css$/,
        use: [MiniCssExtractPlugin.loader, 'css-loader', 'postcss-loader'],
      },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './src/index.html',
      inject: 'body',
    }),
    new MiniCssExtractPlugin({ filename: 'main.css' }),
    new CopyPlugin({
      patterns: [
        {
          from: path.resolve(__dirname, '../i18n'),
          to: path.resolve(__dirname, 'dist/i18n'),
        },
      ],
    }),
  ],
  devServer: mode === 'development' ? {
    static: { directory: path.join(__dirname, 'dist') },
    port: 8080,
    hot: false,
    open: true,
  } : undefined,
});
