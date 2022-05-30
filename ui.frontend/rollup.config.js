import autoInstall from '@rollup/plugin-auto-install';
import replace from '@rollup/plugin-replace';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import { terser } from 'rollup-plugin-terser';
import babel from '@rollup/plugin-babel';
import commonjs from '@rollup/plugin-commonjs';
const url = require('postcss-url');
import postcss from 'rollup-plugin-postcss';
import autoprefixer from 'autoprefixer';
import sassvars from 'postcss-simple-vars';
import unwrap_nested from 'postcss-nested';
import csslatest from 'postcss-cssnext';
import cssnano from 'cssnano';
import strip from '@rollup/plugin-strip';
import peerDepsExternal from 'rollup-plugin-peer-deps-external';
import json from '@rollup/plugin-json';
import image from '@rollup/plugin-image';

module.exports = function (env, argv) {
  const configs = (function () {
    let glob = require('glob');

    let jsObj = glob
      .sync('src/main/js/**/index.js', { cwd: __dirname })
      .map(function (inputFile) {
        let {
          groups: { g1 },
        } = new RegExp('src/main/js/(?<g1>[^/]*)/index.js', 'g').exec(
          inputFile
        ) ?? {
          groups: { g1: 'aem' },
        };

        const url_options = [
          {
            filter: '**/*.njk',
            url: 'copy',
            assetsPath: `${__dirname}/target/webpack/${g1}/resources`,
            useHash: false,
          },
          {
            filter: '**/*.js',
            url: 'copy',
            assetsPath: `${__dirname}/target/webpack/${g1}/resources`,
            useHash: false,
          },
          {
            filter: '**/*',
            url: 'copy',
            assetsPath: `${__dirname}/target/webpack/${g1}/resources`,
            useHash: true, //avoid duplicates, and image name conflict
          },
        ];
        return {
          input: inputFile,
          plugins: [
            nodeResolve({
              preferBuiltins: false,
              browser: true,
              jsnext: true,
              main: true,
            }),
            autoInstall(),
            json(),
            image(),
            commonjs({
              include: ['node_modules/**', 'src/**/cjs/*'],
            }),
            replace({
              preventAssignment: true,
              exclude: 'node_modules/**',
              'process.env.NODE_ENV': JSON.stringify(
                process.env.NODE_ENV || 'development'
              ),
              ENV: JSON.stringify(process.env.NODE_ENV || 'development'),
            }),
            process.env.NODE_ENV === 'production' &&
              strip({
                functions: ['console.log', 'MyClass.*'],
                include: ['**/*.js'],
              }),
            //!g1.endsWith('_react') && peerDepsExternal(),
            babel({
              babelHelpers: 'runtime',
              exclude: 'node_modules/**', // exclude any codes here from transformation
              presets: [
                ['@babel/preset-modules'], // even smaller bundle
                [
                  // a smart preset that allows you to use the latest JavaScript by polyfills
                  // preset-env without options will compile ES2015+ down to ES5
                  '@babel/preset-env',
                ],

                // Transform React JSX into regular JavaScript code
                ['@babel/preset-react'],
              ],
              plugins: [
                // https://github.com/AlexGilleran/jsx-control-statements
                // make your jsx condition clear
                ['jsx-control-statements'],
                // transforms ES2015 modules to CommonJS, which is not what I want
                //['@babel/plugin-transform-modules-commonjs']

                // Compile ES2015 destructuring to ES5
                ['@babel/plugin-transform-destructuring'],
                ['@babel/plugin-transform-runtime'], // so I can use async and await

                ['@babel/plugin-proposal-class-properties'],
                ['@babel/plugin-proposal-object-rest-spread'],
                [
                  '@babel/plugin-transform-react-jsx',
                  {
                    runtime: g1 === 'form_react' ? 'automatic' : 'classic',
                    pragma: g1 === 'form_react' ? '' : 'createElement',
                    pragmaFrag: g1 === 'form_react' ? '' : "'fragment'",
                  },
                ],
              ],
            }),
            process.env.NODE_ENV === 'production' && terser(), // comments this for non-mini format
            postcss({
              plugins: [
                autoprefixer(),
                url(url_options),
                sassvars(),
                unwrap_nested(),
                csslatest({ warnForDuplicates: false }),
              ],
              extensions: ['.css'],
              extract: true, // separate file index.css, good for AEM clientlib
              sourceMap:
                process.env.NODE_ENV === 'production' ? false : 'inline',
              minimize: process.env.NODE_ENV === 'production',
              to: `${__dirname}/target/webpack/${g1}/c/d`,
            }),
          ],
          onwarn: function (warning, warner) {
            if (warning.code === 'CIRCULAR_DEPENDENCY') {
              if (
                warning.importer &&
                warning.importer.startsWith('node_modules/')
              ) {
                return;
              }
            }
            warner(warning);
          },
          // external:['jquery'], // exclude some module to be part of generated bundle
          output: {
            file: `target/webpack/${g1}/index.js`,
            format: 'umd', // umd and iife both works on browser
            name: `dc.${g1}`, // this is the name of the global object
            esModule: false,
            exports: 'named',
            sourcemap: process.env.NODE_ENV === 'production' ? false : 'inline', // a sourcemap is extremely useful when debugging code
          },
        };
      });
    // console.log(jsObj);
    return jsObj;
  })();

  return configs;
};
