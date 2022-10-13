/*
 *
 *  ©2016-2017 EdgeVerve Systems Limited (a fully owned Infosys subsidiary),
 *  Bangalore, India. All Rights Reserved.
 *
 */

const gulp = require('gulp');
const concat = require('gulp-concat');
const watch = require('gulp-watch');
const insert = require('gulp-insert');
const clean = require('gulp-clean');
const peg = require('./utils/dev/gulp-pegjs');
const minimist = require('minimist');
const gutil = require('gulp-util');
const mocha = require('gulp-mocha');
var istanbul = require('gulp-istanbul');
const eslint = require('gulp-eslint');
const through = require('through2');

const knownOptions = {
  string: 'expr',
  default: '',
};

const options = minimist(process.argv.slice(2), knownOptions);

const log = label => {
  const log = (file, enc, cb) => {
    console.log(`${label} : ${file.path}`);
    cb(null, file);
  };
  return through.obj(log);
};

gulp.task('lint', () => {
  return gulp.src(['**/*.js','!node_modules/**'])
      .pipe(log('linting'))
      .pipe(eslint())
      .pipe(eslint.format())
      .pipe(eslint.failAfterError());
});

gulp.task('src:lint', ()=>{
return gulp.src(['src/*.js'])
      .pipe(eslint())
      .pipe(eslint.format())
      .pipe(eslint.failAfterError());
});

gulp.task('initialize:feel', () => gulp.src('./grammar/feel-initializer.js')
		.pipe(insert.transform((contents, file) => {
  let initializer_start = '{ \n',
    initializer_end = '\n }';
  return initializer_start + contents + initializer_end;
}))
		.pipe(gulp.dest('./temp')));

gulp.task('concat:feel', gulp.series('initialize:feel', () => gulp.src(['./temp/feel-initializer.js', './grammar/feel.pegjs'])
		.pipe(concat('feel.pegjs'))
		.pipe(gulp.dest('./src/'))));


gulp.task('clean:temp', gulp.series('initialize:feel', 'concat:feel', () => gulp.src('./temp', {
  allowEmpty: true, read: false,
})
		.pipe(clean())));

gulp.task('clean:dist:feel', gulp.series('src:lint', () => gulp.src('./dist/feel.js', {
  allowEmpty: true,read: false,
})
		.pipe(clean())));

gulp.task('clean:dist:feel:ast', gulp.series('src:lint', () => gulp.src('./dist/feel-ast*.js', {
  allowEmpty: true, read: false,
})
		.pipe(clean())));

gulp.task('clean:src:feel', () => gulp.src('./src/feel.pegjs', {
  allowEmpty: true, read: false,
})
		.pipe(clean()));

gulp.task('generate:parser',gulp.series('clean:dist:feel', () => gulp.src('src/feel.pegjs')
		.pipe(peg({
  format: 'commonjs',
  cache: true,
  allowedStartRules: ["Start", "SimpleExpressions", "SimpleUnaryTests"]
}))
		.pipe(gulp.dest('./dist'))));

gulp.task('dist:feel:ast', gulp.series('clean:dist:feel:ast', () => gulp.src('src/feel-ast.js')
		.pipe(gulp.dest('./dist'))));

gulp.task('dist:feel:ast:parser', gulp.series('clean:dist:feel:ast', () => gulp.src('src/feel-ast-parser.js')
		.pipe(gulp.dest('./dist'))));


gulp.task('mocha', () => gulp.src(['test/*.js'], {
  allowEmpty: true, read: false,
})
		.pipe(mocha({
  reporter: 'list',
}))
		.on('error', gutil.log));


gulp.task('utils:lint', ()=>{
  return gulp.src(['utils/*.js'])
        .pipe(eslint())
        .pipe(eslint.format())
        .pipe(eslint.failAfterError());
});

gulp.task('pre-test-ci', function () {
  return gulp.src(['./dist/**/*.js','./utils/**/*.js','!./dist/**/feel.js','!./utils/**/index.js'])
    .pipe(istanbul())
    .pipe(istanbul.hookRequire());
});

gulp.task('test-ci', gulp.series('pre-test-ci', function () {
  return gulp.src(['test/**/*.spec.js'])
    .pipe(mocha())
    .pipe(istanbul.writeReports({
      dir: './coverage',
      reporters: [ 'lcovonly'],
      reportOpts: { dir: './coverage' }
    }))
    .pipe(istanbul.enforceThresholds({ thresholds:{ global: {statements: 85, branches: 70, lines: 85, functions: 90 }} }));
}));

gulp.task('test-ci-html', gulp.series('pre-test-ci', function () {
  return gulp.src(['test/**/*.spec.js'])
    .pipe(mocha())
    .pipe(istanbul.writeReports({
      dir: './coverage',
      reporters: [ 'lcov'],
      reportOpts: { dir: './coverage' }
    }))
    .pipe(istanbul.enforceThresholds({ thresholds:{ global: {statements: 85, branches: 70, lines: 85, functions: 90 }} }));
}));

gulp.task('build', gulp.series('initialize:feel', 'clean:src:feel', 'concat:feel', 'clean:temp'));

gulp.task('generate', gulp.series('generate:parser'));

gulp.task('default', gulp.series('build', 'generate', 'mocha'));

gulp.task('watch', () => {
  gulp.watch('./grammar/*', ['build']);
  gulp.watch('./src/*.pegjs',['generate:parser']);
  gulp.watch('./src/*.js', ['dist:feel:ast', 'dist:feel:ast:parser']);
  gulp.watch('./utils/*.js', ['utils:lint']);
});
