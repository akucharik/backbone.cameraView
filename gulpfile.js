'use strict';

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
    dest:  './build',
    scripts: {
        dest: './build/scripts',
        source: './src/scripts/oculo.js',
        sourceName: 'oculo.js'
    },
    styles: {
        dest: './build/styles',
        destName: 'oculo.css',
        source: './src/styles/**/*.sass'
    },
    tests: {
        source: './tests/*.js'
    }
};

gulp.task('build', ['scripts', 'styles', 'test', 'docs'], function () {
    
});

gulp.task('clean', function () {
    return del(build.dest);
});

gulp.task('scripts', ['clean'], function () {
    return browserify(build.scripts.source).bundle()
        .pipe(source(build.scripts.sourceName))
        .pipe(gulp.dest(build.scripts.dest))
        // Minify
        .pipe(buffer())
        .pipe(uglify())
        .pipe(rename({
            suffix: '.min'
        }))
        .pipe(gulp.dest(build.scripts.dest));
});

gulp.task('styles', ['clean'], function () {
    return gulp.src(build.styles.source)
        .pipe(sass({
            outputStyle: 'expanded'
        }).on('error', sass.logError))
        .pipe(gulp.dest(build.styles.dest))
        // Minify
        .pipe(buffer())
        .pipe(uglifycss())
        .pipe(rename({
            suffix: '.min'
        }))
        .pipe(gulp.dest(build.styles.dest));
});

gulp.task('styles:watch', ['clean'], function () {
    gulp.watch(build.styles.source, ['sass']);
});

gulp.task('test', function () {
	return gulp.src(build.tests.source, {
            read: false
        })
		.pipe(mocha({
            reporter: 'nyan'
        }));
});

gulp.task('docs', function () {
	executeChildProcess('node ./node_modules/jsdoc/jsdoc.js -c jsdocconfig.json');
});

// set up default task
gulp.task('default', ['build']);