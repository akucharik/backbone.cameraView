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
    demo: {
        destDirectory: './demo/scripts',
        destFileName: 'demo.js',
        source: './demo/src/scripts/demo.js',
        styles: {
            destDirectory: './demo/styles',
            source: './demo/src/styles/**/*.sass'
        }
    },
    destDirectory:  './build',
    scripts: {
        destDirectory: './build/scripts',
        destFileName: 'oculo.js',
        libraries: {
            dest: ['./build/scripts/TweenMax.min.js', './build/scripts/Draggable.min.js', './build/scripts/ModifiersPlugin.min.js'],
            source: ['./src/scripts/lib/TweenMax.min.js', './src/scripts/lib/Draggable.min.js', './src/scripts/lib/ModifiersPlugin.min.js']
        },
        source: './src/scripts/oculo.js'
    },
    styles: {
        destDirectory: './build/styles',
        destFileName: 'oculo.css',
        source: './src/styles/**/*.sass'
    },
    tests: {
        source: './tests/*.js'
    }
};

var docs = {
    destDirectory: './docs'
};

// set up default task
gulp.task('default', ['build']);

gulp.task('build', ['test:scripts', 'compile:styles', 'compile:libraries', 'compile:scripts'], function () {
    return;
});

gulp.task('clean:docs', function () {
    return del(docs.destDirectory);
});

gulp.task('clean:libraries', function () {
    return del(build.scripts.libraries.dest);
});

gulp.task('clean:scripts', function () {
    return del(build.scripts.destDirectory);
});

gulp.task('clean:styles', function () {
    return del(build.styles.destDirectory);
});

gulp.task('compile:demo', function () {
    return browserify(build.demo.source, { debug: true })
        .transform(babelify)
        .bundle()
        .on('error', function (error) { 
            console.log('Error: ' + error.message); 
        })
        .pipe(source(build.demo.destFileName))
        .pipe(gulp.dest(build.demo.destDirectory))
        // Minify
//        .pipe(buffer())
//        .pipe(uglify())
//        .pipe(rename({
//            suffix: '.min'
//        }))
//        .pipe(gulp.dest(build.scripts.destDirectory));
});

gulp.task('compile:libraries', ['clean:libraries'], function () {
    return gulp.src(build.scripts.libraries.source)
        .pipe(gulp.dest(build.scripts.destDirectory));
});

gulp.task('compile:scripts', ['clean:scripts', 'compile:libraries'], function () {
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

gulp.task('compile:styles', ['clean:styles'], function () {
    return gulp.src(build.styles.source)
        .pipe(sass({
            includePaths: [
                './src/styles', 
                './node_modules/foundation-sites/scss',
                './node_modules/normalize-scss/sass'
            ],
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

gulp.task('compile:demo:styles', ['clean:styles'], function () {
    return gulp.src(build.demo.styles.source)
        .pipe(sass({
            includePaths: [
                './demo/src/styles', 
                './node_modules/foundation-sites/scss',
                './node_modules/normalize-scss/sass'
            ],
            outputStyle: 'expanded'
        }).on('error', sass.logError))
        .pipe(gulp.dest(build.demo.styles.destDirectory))
        // Minify
//        .pipe(buffer())
//        .pipe(uglifycss())
//        .pipe(rename({
//            suffix: '.min'
//        }))
//        .pipe(gulp.dest(build.styles.destDirectory));
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

gulp.task('watch:styles', ['clean:styles'], function () {
    gulp.watch(build.styles.source, ['sass']);
});