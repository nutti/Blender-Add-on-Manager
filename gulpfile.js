var gulp = require('gulp');
var babel = require('gulp-babel');
var plumber = require('gulp-plumber');
var sourcemaps = require('gulp-sourcemaps');
var bower = require('main-bower-files');
var concat = require('gulp-concat');
var watch = require('gulp-watch');

const config = require('./package.json');
var modules = Object.keys(config['dependencies']);
for (var i = 0; i < modules.length; ++i) {
    modules[i] = "./node_modules/" + modules[i] + "/**";
}


// for compass
var compass = require('gulp-compass');

var clientDir = '/client';
var serverDir = '/server';
var srcDir = './src';
var destDir = './build';
var serverSrcDir = srcDir + serverDir;
var serverDestDir = destDir + serverDir;
var clientSrcDir = srcDir + clientDir;
var clientDestDir = destDir + clientDir;

// for electron
var electron = require('electron-connect').server.create({'path': clientDestDir + "/"});


gulp.task('app-file-copy', function() {
    gulp.src(['main.js', 'config/config.json', 'package.json'])
        .pipe(gulp.dest(clientDestDir));
});


gulp.task('html-copy', function() {
    gulp.src(clientSrcDir + '/html/**/*.html')
        .pipe(gulp.dest(clientDestDir + '/html/'));
});


gulp.task('compass', function() {
    gulp.src(clientSrcDir + '/sass/**/*.scss')
        .pipe(plumber())
        .pipe(compass({
            config_file: './config/compass.rb',
            comments: false,
            css: clientDestDir + '/css/',
            sass: clientSrcDir + '/sass/'
        }));
});

gulp.task('babel', function() {
    gulp.src(clientSrcDir + '/js/**/*.js')
        .pipe(plumber())
        .pipe(sourcemaps.init())
        .pipe(babel())
        .pipe(sourcemaps.write('.'))
        .pipe(gulp.dest(clientDestDir + '/js/'));
    gulp.src(srcDir + '/lib/js/**/*.js')
        .pipe(plumber())
        .pipe(sourcemaps.init())
        .pipe(babel())
        .pipe(sourcemaps.write('.'))
        .pipe(gulp.dest('./node_modules/'))
        .pipe(gulp.dest(clientDestDir + '/node_modules/'));
    gulp.src(serverSrcDir + '/js/**/*.js')
        .pipe(plumber())
        .pipe(sourcemaps.init())
        .pipe(babel())
        .pipe(sourcemaps.write('.'))
        .pipe(gulp.dest(serverDestDir + '/js/'));
});


gulp.task('copy-js-ext', function() {
    gulp.src(bower())
        .pipe(concat('ext-lib.js'))
        .pipe(gulp.dest(clientDestDir + '/js/ext/'));
});


gulp.task('copy-images', function () {
    gulp.src('./images/**/*.png')
        .pipe(gulp.dest(clientDestDir + '/images/'));
});


gulp.task('copy-icon', function () {
    gulp.src(['./icon/**/*.png', './icon/**/*.ico'])
        .pipe(gulp.dest(clientDestDir + '/icon/'));
});


gulp.task('copy-node-modules', function () {
    gulp.src(modules, {base: './node_modules'})
        .pipe(gulp.dest(clientDestDir + '/node_modules/'));
});


gulp.task('watch', function() {
    watch(['main.js', 'config/config.json', 'package.json'], function(event) {
        gulp.start('app-file-copy');
    });
    watch(clientSrcDir + '/html/**/*.html', function(event) {
        gulp.start('html-copy');
    });
    watch(clientSrcDir + '/sass/**/*.scss', function(event) {
        gulp.start('compass');
    });
    watch(clientSrcDir + '/js/**/*.js', function(event) {
        gulp.start('babel');
    });
    watch(serverSrcDir + '/js/**/*.js', function(event) {
        gulp.start('babel');
    });
    watch(srcDir + '/lib/js/**/*.js', function(event) {
        gulp.start('babel');
    });
    watch('./bower_components/**/*.js', function(event) {
        gulp.start('copy-js-ext');
    });
    watch('./images/**/*.png', function(event) {
        gulp.start('copy-images');
    });
    watch('./icon/**/*.png', function(event) {
        gulp.start('copy-icon');
    });
});


gulp.task('start', ['watch'], function() {
    electron.start();
    gulp.watch([
        clientDestDir + '/main.js',
        clientDestDir + '/config.json',
        clientDestDir + '/package.json'
    ], electron.restart);
    gulp.watch([
        clientDestDir + '/**/*.*',
        '!' + clientDestDir + '/node_modules/**/*.*'
    ], electron.reload);
});


gulp.task('default', [
    'app-file-copy',
    'html-copy',
    'compass',
    'babel',
    'copy-js-ext',
    'copy-images',
    'copy-icon',
    'copy-node-modules',
    ]
);
