const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
require('dotenv').config();

const umamiWebsiteId = process.env.UMAMI_WEBSITE_ID?.trim();
const umamiScriptUrl = process.env.UMAMI_SCRIPT_URL || '/stats.php?file=script.js';
const umamiHostUrl = process.env.UMAMI_HOST_URL || '/stats.php';
const umamiScript = umamiWebsiteId
  ? `<script defer src="${umamiScriptUrl}" data-host-url="${umamiHostUrl}" data-website-id="${umamiWebsiteId}"></script>`
  : '';

module.exports = {
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
      }),
    }),
    new HtmlWebpackPlugin({
      template: 'src/index.html',
      inject: 'body',
      templateParameters: { umamiScript },
    }),
    new MiniCssExtractPlugin({ filename: 'main.css' }),
    new CopyWebpackPlugin({
      patterns: [
        { from: 'i18n', to: 'i18n' },
        { from: 'public', to: '.' },
      ],
    }),
    new (class UmamiInjectPlugin {
      apply(compiler) {
        compiler.hooks.thisCompilation.tap('UmamiInjectPlugin', (compilation) => {
          compilation.hooks.processAssets.tap(
            { name: 'UmamiInjectPlugin', stage: compilation.PROCESS_ASSETS_STAGE_OPTIMIZE + 1 },
            () => {
              const name = 'index.html';
              const asset = compilation.assets[name];
              if (!asset) return;
              let src = asset.source().toString();
              const placeholder = '<script type="text/placeholder" id="umami-inject"></script>';
              if (src.includes(placeholder)) {
                src = src.replace(placeholder, umamiScript);
                compilation.assets[name] = { source: () => src, size: () => src.length };
              }
            }
          );
        });
      }
    })(),
  ],
  devServer: {
    static: { directory: path.join(__dirname, 'dist') },
    port: 3000,
    open: true,
  },
};
