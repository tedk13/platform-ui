const { src, dest, series, parallel } = require('gulp');
const autoprefixer = require('autoprefixer');
const babel = require('gulp-babel');
const clean = require('gulp-clean');
const concat = require('gulp-concat');
const connect = require('gulp-connect');
const header = require('gulp-header');
const merge = require('merge-stream');
const cssnano = require('cssnano');
const pjson = require('./package.json');
const postcss = require('gulp-postcss');
const rename = require('gulp-rename');
const run = require('gulp-run');
const sass = require('gulp-sass')(require('sass'));
const sourcemaps = require('gulp-sourcemaps');
const uglify = require('gulp-uglify');
const year = new Date().getFullYear();
const { watch } = require('gulp');

const puiHeader = ['/*!',
  '  Platform UI v' + pjson.version + ' | ' + pjson.name + '\n',
  '  ' + pjson.description + ' (' + pjson.homepage + ')',
  '  ©' + year + ' ' + pjson.author,
  '  ' + pjson.bugs.url,
  '  Released under the ' + pjson.license + ' license.',
  '*/',
  ''].join('\n');

function serve() {
  connect.server({
    root: './',
    port: 8001,
    livereload: true
  });
}

function copyStaticAssets() {
  return src([
      'src/assets/images/**/*',
      'src/assets/stylesheets/**/*',
      '!src/assets/stylesheets/sass/**',
      'src/assets/js/*.js'], { base: 'src/assets' })
    .pipe(dest('./styleguide/site-assets'))
    .pipe(connect.reload());
}

function generateIconAssets() {
    const iconsCss = src('dist/platform-icons.css', {'allowEmpty' : true})
      .pipe(clean())
      .pipe(rename('_platform-icons.scss'))
      .pipe(dest('src/assets/stylesheets/sass'));

    const iconsFonts = src([
        './dist/*.eot',
        './dist/*.svg',
        './dist/*.ttf',
        './dist/*.woff',
        './dist/*.woff2',
      ])
      .pipe(dest('src/assets/stylesheets/'));

    return merge(iconsCss, iconsFonts)
      .pipe(connect.reload());
}

function css() {
  const plugins = [
    autoprefixer(),
    cssnano()
  ];
  return src([
      'node_modules/normalize.css/normalize.css',             // normalize.css
      'src/assets/stylesheets/sass/main.scss',                // platform ui scss
    ])
    .pipe(sass())
    .pipe(concat('platform-ui.min.css'))
    .pipe(postcss( plugins ))
    .pipe(header( puiHeader ))
    .pipe(dest('src/assets/stylesheets/'))
    .pipe(dest('dist/'))
    .pipe(connect.reload())
}

function js() {
  return src([
      'src/assets/js/polyfill/main.js',
      'src/assets/js/src/*.js'
      ])
    .pipe(sourcemaps.init())
    .pipe(babel())
    .pipe(concat('platform-ui.min.js'))
    .pipe(uglify())
    .pipe(header( puiHeader ))
    .pipe(sourcemaps.write())
    .pipe(dest('src/assets/js'))
    .pipe(dest('dist/js'))
    .pipe(connect.reload())
}

function generateIconFonts() {
  return run('npm run generate-assets').exec();
}

function watchFiles() {
  watch('./src/assets/icons/svg/**/*', generateIconFonts);
  watch('./src/assets/stylesheets/sass/*', css);
  watch('./src/assets/js/src/*', js);
  watch([
    './src/assets/js/src/*',
    './src/assets/stylesheets/sass/*',
    './src/assets/icons/svg/**/*'],
    copyStaticAssets);
}

exports.build = series(generateIconFonts, generateIconAssets, css, js, copyStaticAssets);
exports.css = css;
exports.js = js;
exports.generateIconAssets = generateIconAssets;
exports.generateIconFonts = generateIconFonts;
exports.serve = serve;
exports.copyStaticAssets = copyStaticAssets;
exports.default = parallel(series(generateIconFonts, generateIconAssets, css, copyStaticAssets), js, serve, watchFiles);
