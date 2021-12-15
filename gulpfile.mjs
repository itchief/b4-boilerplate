// пути
const PATH_BUILD = './assets/build';
const PATH_BUILD_HTML = 'assets/build/';
const PATH_BUILD_JS = 'assets/build/js/';
const PATH_BUILD_CSS = 'assets/build/css/';
const PATH_BUILD_IMG = 'assets/build/img/';
const PATH_BUILD_FONTS = 'assets/build/fonts/';

const PATH_SRC_HTML = 'assets/src/*.html';
const PATH_SRC_JS = 'assets/src/js/main.js';
const PATH_SRC_CSS = 'assets/src/style/main.scss';
const PATH_SRC_IMG = 'assets/src/img/**/*.*';
const PATH_SRC_FONTS = 'assets/src/fonts/**/*.*';

const PATH_WATCH_HTML = 'assets/src/**/*.html';
const PATH_WATCH_JS = 'assets/src/js/**/*.js';
const PATH_WATCH_CSS = 'assets/src/style/**/*.scss';
const PATH_WATCH_IMG = 'assets/src/img/**/*.*';
const PATH_WATCH_FONTS = 'assets/src/fonts/**/*.*';

const PATH_CLEAN = './assets/build/*';

// Gulp
import gulp from 'gulp';
// сервер для работы и автоматического обновления страниц
import sync from 'browser-sync';
import rigger from 'gulp-rigger'; // модуль для импорта содержимого одного файла в другой
import compilerSass from 'sass';
import gulpSass from 'gulp-sass'; // модуль для компиляции SASS (SCSS) в CSS
import autoprefixer from 'gulp-autoprefixer'; // модуль для автоматической установки автопрефиксов
import cleanCss from 'gulp-clean-css'; // плагин для минимизации CSS
import uglify from 'gulp-uglify-es'; // модуль для минимизации JavaScript
import cache from 'gulp-cache'; // модуль для кэширования
import del from 'del'; // плагин для удаления файлов и каталогов
import rename from 'gulp-rename';
import imagemin from 'gulp-imagemin'; // плагин для сжатия PNG, JPEG, GIF и SVG изображений
import gifsicle from 'imagemin-gifsicle';
import mozjpeg from 'imagemin-mozjpeg';
import optipng from 'imagemin-optipng';
import svgo from 'imagemin-svgo';
import notify from 'gulp-notify';

const browserSync = sync.create();
const sass = gulpSass(compilerSass);

// запуск сервера
gulp.task('browser-sync', () => {
  browserSync.init({
    server: {
      baseDir: PATH_BUILD
    },
    notify: false
  })
});

// сбор html
gulp.task('html:build', () => {
  return gulp.src(PATH_SRC_HTML) // выбор всех html файлов по указанному пути
    .pipe(rigger()) // импорт вложений
    .pipe(gulp.dest(PATH_BUILD_HTML)) // выкладывание готовых файлов
    .pipe(browserSync.reload({ stream: true })) // перезагрузка сервера
});

// сбор стилей
gulp.task('css:build', () => {
  return gulp.src(PATH_SRC_CSS) // получим main.scss
    .pipe(sass({outputStyle: 'expanded'}).on('error', notify.onError())) // scss -> css
    .pipe(autoprefixer()) // добавим префиксы
    .pipe(gulp.dest(PATH_BUILD_CSS))
    .pipe(rename({suffix: '.min'}))
    .pipe(cleanCss()) // минимизируем CSS
    .pipe(gulp.dest(PATH_BUILD_CSS))
    .pipe(browserSync.stream()) // перезагрузим сервер
});

// сбор js
gulp.task('js:build', () => {
  return gulp.src(PATH_SRC_JS) // получим файл main.js
    .pipe(rigger()) // импортируем все указанные файлы в main.js
    .pipe(gulp.dest(PATH_BUILD_JS))
    .pipe(rename({ suffix: '.min' }))
    .pipe(uglify.default()) // минимизируем js
    .pipe(gulp.dest(PATH_BUILD_JS)) // положим готовый файл
    .pipe(browserSync.reload({ stream: true })) // перезагрузим сервер
});

// перенос шрифтов
gulp.task('fonts:build', () => {
  return gulp.src(PATH_SRC_FONTS)
    .pipe(gulp.dest(PATH_BUILD_FONTS))
});

// обработка картинок
gulp.task('image:build', () => {
  return gulp.src(PATH_SRC_IMG)
    .pipe(imagemin([
      gifsicle({ interlaced: true }),
      mozjpeg({ quality: 75, progressive: true }),
      optipng({ optimizationLevel: 5 }),
      svgo()
    ]))
    .pipe(gulp.dest(PATH_BUILD_IMG))
});

// удаление каталога build
gulp.task('clean:build', () => {
  return del(PATH_CLEAN);
});

// очистка кэша
gulp.task('cache:clear', () => {
  cache.clearAll();
});

// сборка
gulp.task('build',
  gulp.series('clean:build',
    gulp.parallel(
      'html:build',
      'css:build',
      'js:build',
      'fonts:build',
      'image:build'
    )
  )
);

// запуск задач при изменении файлов
gulp.task('watch', () => {
  gulp.watch(PATH_WATCH_HTML, gulp.series('html:build'));
  gulp.watch(PATH_WATCH_CSS, gulp.series('css:build'));
  gulp.watch(PATH_WATCH_JS, gulp.series('js:build'));
  gulp.watch(PATH_WATCH_IMG, gulp.series('image:build'));
  gulp.watch(PATH_WATCH_FONTS, gulp.series('fonts:build'));
});

// задача по умолчанию
gulp.task('default', gulp.series(
  'build',
  gulp.parallel('browser-sync','watch')
));
