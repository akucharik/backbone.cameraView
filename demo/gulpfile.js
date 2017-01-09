'use strict';

var babelify = require('babelify');
var babelRegister = require('babel-register');
var browserify = require('browserify');
var buffer = require('vinyl-buffer');
var del = require('del');
var gulp = require('gulp');
var rename = require('gulp-rename');
var sass = require('gulp-sass');
var source = require('vinyl-source-stream');
var uglify = require('gulp-uglify');
var uglifycss = require('gulp-uglifycss');

var build = {
    scripts: {
        destDirectory: './scripts',
        destFileName: 'demo.js',
        source: './src/scripts/demo.js',
        vendor: {
            source: [
                '../dist/TweenMax.min.js', 
                '../dist/Draggable.min.js',
                //'../dist/oculo.js',
                './src/scripts/vendor/prettify-min.js',
                './src/scripts/vendor/ScrollToPlugin.js'
            ]
        }
    },
    styles: {
        destDirectory: './styles',
        paths: [
            './src/styles', 
            '../node_modules/foundation-sites/scss',
            '../node_modules/normalize-scss/sass'
        ],
        source: './src/styles/demo.scss',
        vendor: {
            source: [
                './src/styles/font-awesome.min.css', 
                './src/styles/github-markdown.css'
            ]
        }
    }
};

// set up default task
gulp.task('default', ['build']);

gulp.task('build', ['compile:styles', 'compile:scripts'], function () {
    return;
});

gulp.task('clean:scripts', function () {
    return del(build.scripts.destDirectory);
});

gulp.task('clean:styles', function () {
    return del(build.styles.destDirectory);
});

gulp.task('copy:vendor:scripts', ['clean:scripts'], function () {
    return gulp.src(build.scripts.vendor.source)
        .pipe(gulp.dest(build.scripts.destDirectory));
});

gulp.task('copy:vendor:styles', ['clean:styles'], function () {
    return gulp.src(build.styles.vendor.source)
        .pipe(gulp.dest(build.styles.destDirectory));
});

gulp.task('compile:scripts', ['clean:scripts', 'copy:vendor:scripts'], function () {
    return browserify(build.scripts.source, { 
            debug: true
        })
        .transform(babelify)
        .bundle()
        .on('error', function (error) { 
            console.log('Error: ' + error.message); 
        })
        .pipe(source(build.scripts.destFileName))
        .pipe(gulp.dest(build.scripts.destDirectory))
        // Minify
//        .pipe(buffer())
//        .pipe(uglify())
//        .pipe(rename({
//            suffix: '.min'
//        }))
//        .pipe(gulp.dest(build.scripts.destDirectory));
});

gulp.task('compile:styles', ['clean:styles', 'copy:vendor:styles'], function () {
    return gulp.src(build.styles.source)
        .pipe(sass({
            includePaths: build.styles.paths,
            outputStyle: 'expanded'
        }).on('error', sass.logError))
        .pipe(gulp.dest(build.styles.destDirectory))
        // Minify
//        .pipe(buffer())
//        .pipe(uglifycss())
//        .pipe(rename({
//            suffix: '.min'
//        }))
//        .pipe(gulp.dest(build.styles.destDirectory));
});