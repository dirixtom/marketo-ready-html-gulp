const { src, dest, watch, series } = require('gulp'); // Importing required Gulp modules
const postcss = require('gulp-postcss');
const cssnano = require('cssnano');
const terser = require('gulp-terser');
const browsersync = require('browser-sync').create(); // Creating a BrowserSync instance
const babel = require('gulp-babel');
const gulp = require('gulp');
const sass = require('gulp-dart-sass');
const inject = require('gulp-inject');
const replace = require('gulp-replace');
const minify = require('gulp-minify');

// HTML Task
function htmlTask(cb) {
    // let content = gulp.src(['./dist/css/main.css', './dist/js/main.js'], {read: false}); // Use instead of gulp-inject if you do not want inline code but rather a link to the files

    let content = inject(gulp.src(['./dist/css/main.css', './dist/js/main-min.js']), {
        starttag: '<!-- inject:{{ext}} -->', // Define the starttag for the injected code, based on extension. Eg: <!-- inject:css -->
        transform: function (filePath, file) {
            let fileContents = file.contents.toString('utf8'); // Getting the file contents and stringifying them

            if (filePath.endsWith('.css')) return '<style>\n\t\t' + fileContents + '\n\t</style>'; // Wrapping CSS in style tags
            if (filePath.endsWith('.js')) return '<script>\n\t\t' + fileContents + '\n\t</script>'; // Wrapping JS in script tags

            return fileContents;
        }
    })

    return src('*.html')
        .pipe(replace('<link href="dist/css/main.css" rel="stylesheet" />', '<!-- inject:css -->\n\t<!-- endinject -->')) // Replacing CSS link with injected CSS
        .pipe(replace('<script src="dist/js/main.js"></script>', '<!-- inject:js -->\n\t<!-- endinject -->')) // Replacing JS link with injected JS
        //.pipe(sources) // Use instead of gulp-inject if you do not want inline code but rather a link to the files
        .pipe(content)
        .pipe(dest('./dist')); // Saving the modified HTML files to the dist directory
}

// Sass Task
function scssTask() {
    return src('sass/main.sass', {
            sourcemaps: false
        })
        .pipe(sass( {
            includePaths: ['node_modules']
        }))
        .pipe(postcss([cssnano()])) // Applying CSS post-processing
        .pipe(dest('./dist/css')); // Saving the compiled CSS files to the dist directory
}

// JavaScript Task
function jsTask() {
    return src('js/*.js', {
            sourcemaps: false
        })
        .pipe(terser()) // Minifying JS files
        .pipe(babel({
            presets: ['@babel/preset-env']
        })) // Transpiling JS files
        .pipe(minify()) // Minifying JS files
        .pipe(dest('./dist/js')); // Saving the modified JS files to the dist directory
}

function browsersyncServe(cb) {
    browsersync.init({
        server: {
            baseDir: './'
        }
    }); // Initializing the BrowserSync server
    cb();
}

function browsersyncReload(cb) {
    browsersync.reload(); // Reloading the BrowserSync server
    cb();
}

// Watch Task
function watchTask() {
    watch('*.html', browsersyncReload); // Watching for changes in HTML files
    watch(['./**/**/**.sass', './js/**.js'], series(scssTask, jsTask, browsersyncReload)); // Watching for changes in Sass and JS files
}

// Default Gulp Task
exports.default = series(
    scssTask,
    jsTask,
    browsersyncServe,
    watchTask
); // Defining the default Gulp task that runs the Sass, JS, BrowserSync, and Watch tasks in series

// Gulb Build Task
exports.build = series(
    scssTask,
    jsTask,
    htmlTask
); // Defining the Gulp Build task that runs the Sass, JS, and HTML tasks in series