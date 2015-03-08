var gulp = require('gulp')
  , mocha = require('gulp-mocha')
  , browserify = require('browserify')
  , source = require('vinyl-source-stream')
  , buffer = require('vinyl-buffer')

gulp.task('test', function() {
  require('babel/register');
  return gulp.src('test/**/*.js')
    .pipe(mocha())

})

gulp.task('build', ['test'], function() {
  browserify({ builtins: [], entries: ['./lib/slowfast.js'] }).bundle()
    .pipe(source('slowfast.js'))
    .pipe(buffer())
    .pipe(gulp.dest('dist'))
})

gulp.task('default', ['build'])