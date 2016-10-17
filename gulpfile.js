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
    destDirectory:  './build',
    libraries: {
        destDirectory: './build/scripts',
        destFileName: 'oculo-libraries.js',
        destPath: function () {
            return build.libraries.destDirectory + build.libraries.destFileName;
        }
    },
    scripts: {
        destDirectory: './build/scripts',
        destFileName: 'oculo.js',
        destPath: function () {
            return build.scripts.destDirectory + build.scripts.destFileName;
        },
        source: './src/scripts/oculo.js'
    },
    styles: {
        destDirectory: './build/styles',
        destFileName: 'oculo.css',
        destPath: function () {
            return build.styles.destDirectory + build.styles.destFileName;
        },
        source: './src/styles/**/*.sass'
    },
    tests: {
        source: './tests/*.js'
    }
};

var docs = {
    destDirectory: './docs'
};

gulp.task('build', ['tests', 'docs', 'styles', 'libraries', 'scripts'], function () {
    
});

gulp.task('cleanBuild', function () {
    return del(build.destDirectory);
});

gulp.task('cleanDocs', function () {
    return del(docs.destDirectory);
});

gulp.task('cleanLibraries', function () {
    return del(build.libraries.destPath());
});

gulp.task('cleanScripts', function () {
    return del(build.scripts.destPath());
});

gulp.task('cleanStyles', function () {
    return del(build.styles.destPath());
});

gulp.task('docs', ['cleanDocs'], function () {
	executeChildProcess('node ./node_modules/jsdoc/jsdoc.js -c jsdocconfig.json');
});

gulp.task('libraries', ['cleanLibraries'], function () {
    return browserify()
        .require('gsap')
        .bundle()
        .on('error', function (error) { 
            console.log('Error: ' + error.message); 
        })
        .pipe(source(build.libraries.destFileName))
        .pipe(gulp.dest(build.libraries.destDirectory))
});

gulp.task('scripts', ['cleanScripts'], function () {
    return browserify(build.scripts.source, { debug: true })
        .external('gsap')
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

gulp.task('styles', ['cleanStyles'], function () {
    return gulp.src(build.styles.source)
        .pipe(sass({
            outputStyle: 'expanded'
        }).on('error', sass.logError))
        .pipe(gulp.dest(build.styles.destDirectory))
        // Minify
        .pipe(buffer())
        .pipe(uglifycss())
        .pipe(rename({
            suffix: '.min'
        }))
        .pipe(gulp.dest(build.styles.destDirectory));
});

gulp.task('styles:watch', ['cleanStyles'], function () {
    gulp.watch(build.styles.source, ['sass']);
});

gulp.task('tests', function () {
	return gulp.src(build.tests.source, {
            read: false
        })
		.pipe(mocha({
            compilers: {
                js: babelRegister
            },
            reporter: 'nyan'
        }));
});

// set up default task
gulp.task('default', ['build']);