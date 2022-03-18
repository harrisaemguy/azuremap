const fs = require('fs');

const path = require('path');
const getAllFiles = function (dirPath, arrayOfFiles) {
  files = fs.readdirSync(dirPath);

  arrayOfFiles = arrayOfFiles || [];

  files.forEach(function (file) {
    if (fs.statSync(dirPath + '/' + file).isDirectory()) {
      arrayOfFiles = getAllFiles(dirPath + '/' + file, arrayOfFiles);
    } else {
      arrayOfFiles.push(path.join(__dirname, dirPath, '/', file));
    }
  });

  return arrayOfFiles;
};

const getDependencies = function (filePath) {
  let dependencies = [];

  try {
    if (fs.existsSync(filePath)) {
      //file exists
      const data = fs.readFileSync(filePath, 'utf8');
      dependencies = eval(data).map((x) => 'dc.' + x);
    }
  } catch (err) {
    console.error(err);
  }

  return dependencies;
};

// Clientlib [allowProxy, categories, dependencies, longCacheKey, jsProcessor, cssProcessor, resources]
module.exports = {
  // default working directory (can be changed per 'cwd' in every asset option)
  context: __dirname,

  // path to the clientlib root folder (output)
  clientLibRoot: 'build/clientlibs/jcr_root/apps/dcpilot/clientlibs',

  libs: (function () {
    getAllFiles('build/webpack/').map(function (absName) {
      console.log('...... recursive file absName: ' + absName);
    });

    return fs.readdirSync('build/webpack/').map(function (dirName) {
      console.log('...... webpack dirName: ' + dirName);
      let returnObj = {
        allowProxy: true,
        // dependencies : [ "test.base.apps.mainapp" ],
        serializationFormat: 'xml',
        cssProcessor: ['default:none', 'min:none'],
        jsProcessor: ['default:none', 'min:none'],
        longCacheKey: '' + new Date().getTime(),
        assets: {
          js: {},
          css: {},
          resources: {},
        },
      };
      returnObj.name = dirName;
      returnObj.categories = ['dc.' + dirName];
      returnObj.assets.js.files = ['build/webpack/' + dirName + '/**/*.js'];
      returnObj.assets.css.files = ['build/webpack/' + dirName + '/**/*.css'];
      returnObj.assets.resources.files = [
        'build/webpack/' + dirName + '/resources/*',
      ];

      returnObj.dependencies = getDependencies(
        `./src/main/js/${dirName}/dependencies.js`
      );

      return returnObj;
    });
  })(),
};
