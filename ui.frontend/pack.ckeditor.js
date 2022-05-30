//__dirname is the folder of this file
const path = require('path');
const { styles } = require('@ckeditor/ckeditor5-dev-utils');

module.exports = function (env, argv) {
  return {
    mode: argv.mode === 'production' ? 'production' : 'development',
    devtool: argv.mode === 'production' ? '' : 'source-map',

    entry: './src/main/js/ckeditor/editor.js',
    output: {
      path: path.join(__dirname, 'target/webpack'),
      filename: 'ckeditor/index.js',
      library: ['dc', 'ckeditor'],
      libraryTarget: 'umd',
    },
    module: {
      rules: [
        {
          test: /ckeditor5-[^/\\]+[/\\]theme[/\\]icons[/\\][^/\\]+\.svg$/,
          use: ['raw-loader'],
        },
        {
          test: /ckeditor5-[^/\\]+[/\\]theme[/\\].+\.css$/,

          use: [
            {
              loader: 'style-loader',
              options: {
                injectType: 'singletonStyleTag',
                attributes: {
                  'data-cke': true,
                },
              },
            },
            'css-loader',
            {
              loader: 'postcss-loader',
              options: {
                postcssOptions: styles.getPostCssConfig({
                  themeImporter: {
                    themePath: require.resolve(
                      '@ckeditor/ckeditor5-theme-lark'
                    ),
                  },
                  minify: argv.mode === 'production' ? true : false,
                }),
              },
            },
          ],
        },
      ],
    },
    optimization: {
      minimize: true,
    },
    target: 'web',
  };
};
