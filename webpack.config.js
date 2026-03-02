const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
require('dotenv').config();

const pkg = require('./package.json');

module.exports = {
  entry: './src/index.ts',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'main.[contenthash:8].js',
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
        exclude: [/node_modules/, /\.test\.ts$/],
      },
      {
        test: /\.css$/,
        use: [MiniCssExtractPlugin.loader, 'css-loader', 'postcss-loader'],
      },
    ],
  },
  plugins: [
    new webpack.DefinePlugin({
      __CONFIG__: JSON.stringify({
        notificationWebhookUrl: process.env.NOTIFICATION_WEBHOOK_URL || '',
        dataPolicyUrl: process.env.DATA_POLICY_URL || '',
        privacyUrl: process.env.PRIVACY_URL || '',
        impressumUrl: process.env.IMPRESSUM_URL || '',
        repoUrl: process.env.REPO_URL || 'https://github.com/CaseyRo/puppyCal',
        umamiWebsiteId: process.env.UMAMI_WEBSITE_ID?.trim() || '',
        version: pkg.version,
      }),
    }),
    new HtmlWebpackPlugin({
      template: 'src/index.html',
      inject: 'body',
    }),
    new MiniCssExtractPlugin({ filename: 'main.[contenthash:8].css' }),
    new CopyWebpackPlugin({
      patterns: [
        { from: 'i18n', to: 'i18n' },
        {
          from: 'public',
          to: '.',
          globOptions: { ignore: ['**/icon-master-square.png', '**/icon-original-full.png'] },
          transform: {
            transformer(content, absoluteFrom) {
              if (absoluteFrom.endsWith('sw.js')) {
                return content.toString().replace('__VERSION__', pkg.version);
              }
              return content;
            },
          },
        },
      ],
    }),
  ],
  devServer: {
    static: { directory: path.join(__dirname, 'dist') },
    port: 3000,
    open: true,
  },
};
