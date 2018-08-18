const gulp = require('gulp'),
      clean = require('gulp-clean'),
      include = require('gulp-include');

gulp.task('clean', function() {
    return gulp.src('dist', {read: false})
        .pipe(clean());
});

gulp.task('build', ['clean'], function() {
    gulp.src('index.js')
        .pipe(include())
        .on('error', console.log)
        .pipe(gulp.dest('dist'));
});

gulp.task('default', ['build']);