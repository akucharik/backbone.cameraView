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

var config = {
    scripts: {
        destDirectory: './scripts',
        destFileName: 'site.js',
        source: './src/scripts/site.js',
        vendor: {
            source: [
                './src/scripts/vendor/TweenMax.min.js', 
                './src/scripts/vendor/Draggable.min.js',
                './src/scripts/vendor/ScrollToPlugin.js',
                //'../dist/oculo.js',
                './src/scripts/vendor/prettify.js'
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
        source: './src/styles/site.scss'
    }
};

// set up default task
gulp.task('default', ['build']);

gulp.task('build', ['compile:styles', 'compile:scripts'], function () {
    return;
});

gulp.task('build:prod', ['env:prod', 'compile:styles', 'compile:scripts'], function () {
    return;
});

gulp.task('env:prod', function() {
    process.env.NODE_ENV = 'production';
});

gulp.task('clean:scripts', function () {
    return del(config.scripts.destDirectory);
});

gulp.task('clean:styles', function () {
    return del(config.styles.destDirectory);
});

gulp.task('copy:vendor:scripts', ['clean:scripts'], function () {
    return gulp.src(config.scripts.vendor.source)
        .pipe(gulp.dest(config.scripts.destDirectory));
});

gulp.task('compile:scripts', ['clean:scripts', 'copy:vendor:scripts'], function () {
    return browserify(config.scripts.source, { 
            debug: true
        })
        .transform(babelify)
        .bundle()
        .on('error', function (error) { 
            console.log('Error: ' + error.message); 
        })
        .pipe(source(config.scripts.destFileName))
        
        // Minify
        .pipe(buffer())
        .pipe(uglify())
        .pipe(rename({
            suffix: '.min'
        }))
        .pipe(gulp.dest(config.scripts.destDirectory));
});

gulp.task('compile:styles', ['clean:styles'], function () {
    return gulp.src(config.styles.source)
        .pipe(sass({
            includePaths: config.styles.paths,
            outputStyle: process.env.NODE_ENV === 'production' ? 'compressed' : 'expanded'
        }).on('error', sass.logError))
        .pipe(rename({
            suffix: '.min'
        }))
        .pipe(gulp.dest(config.styles.destDirectory));
});