'use strict';

var babelify = require('babelify');
var babelRegister = require('babel-register');
var browserify = require('browserify');
var buffer = require('vinyl-buffer');
var del = require('del');
var executeChildProcess = require('child_process').exec;
var gulp = require('gulp');
var mocha = require('gulp-mocha');
var sass = require('gulp-sass');
var rename = require('gulp-rename');
var source = require('vinyl-source-stream');
var uglify = require('gulp-uglify');
var uglifycss = require('gulp-uglifycss');

var build = {
    scripts: {
        destDirectory: './dist',
        destFileName: 'oculo.js',
        source: './src/scripts/oculo.js'
    },
    tests: {
        source: './tests/*.js'
    },
    vendor: {
        dest: ['./dist/TweenMax.min.js', './dist/Draggable.min.js'],
        source: ['./src/scripts/lib/TweenMax.min.js', './src/scripts/lib/Draggable.min.js']
    }
};

var docs = {
    destDirectory: './docs'
};

// set up default task
gulp.task('default', ['build']);

gulp.task('build', ['compile:scripts', 'test:scripts'], function () {
    return;
});

gulp.task('clean:docs', function () {
    return del(docs.destDirectory);
});

gulp.task('clean:scripts', function () {
    return del(build.scripts.destDirectory);
});

gulp.task('copy:vendor', ['clean:scripts'], function () {
    return gulp.src(build.vendor.source)
        .pipe(gulp.dest(build.scripts.destDirectory));
});

gulp.task('compile:scripts', ['clean:scripts', 'copy:vendor'], function () {
    return browserify(build.scripts.source, { 
            debug: true,
            standalone: 'Oculo'
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

gulp.task('generate:docs', ['clean:docs'], function () {
	executeChildProcess('./node_modules/jsdoc/jsdoc.js -c jsdocconfig.json');
});

gulp.task('test:scripts', function () {
	return gulp.src(build.tests.source)
		.pipe(mocha({
            compilers: {
                js: babelRegister
            },
            reporter: 'nyan'
        }));
});