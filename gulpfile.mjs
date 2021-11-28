'use strict';

/* пути к исходным файлам (src), к готовым файлам (build), а также к тем, за изменениями которых нужно наблюдать (watch) */
var path = {
  build: {
    html: 'assets/build/',
    js: 'assets/build/js/',
    css: 'assets/build/css/',
    img: 'assets/build/img/',
    fonts: 'assets/build/fonts/'
  },
  src: {
    html: 'assets/src/*.html',
    js: 'assets/src/js/main.js',
    style: 'assets/src/style/main.scss',
    img: 'assets/src/img/**/*.*',
    fonts: 'assets/src/fonts/**/*.*'
  },
  watch: {
    html: 'assets/src/**/*.html',
    js: 'assets/src/js/**/*.js',
    css: 'assets/src/style/**/*.scss',
    img: 'assets/src/img/**/*.*',
    fonts: 'assets/src/fonts/**/*.*'
  },
  clean: './assets/build/*'
};

/* настройки сервера */
var config = {
  server: {
    baseDir: './assets/build'
  },
  notify: false
};

import gulp from 'gulp'; // подключаем Gulp
import webserver from 'browser-sync'; // сервер для работы и автоматического обновления страниц
import plumber from 'gulp-plumber'; // модуль для отслеживания ошибок
import rigger from 'gulp-rigger'; // модуль для импорта содержимого одного файла в другой
import sourcemaps from 'gulp-sourcemaps'; // модуль для генерации карты исходных файлов
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
import mozjpeg from 'imagemin-gifsicle';
import optipng from 'imagemin-optipng';
//import svgo from 'imagemin-svgo';

const sass = gulpSass(compilerSass);

/* задачи */

// запуск сервера
gulp.task('webserver', () => {
  webserver(config);
});

// сбор html
gulp.task('html:build', () => {
  return gulp.src(path.src.html) // выбор всех html файлов по указанному пути
    .pipe(plumber()) // отслеживание ошибок
    .pipe(rigger()) // импорт вложений
    .pipe(gulp.dest(path.build.html)) // выкладывание готовых файлов
    .pipe(webserver.reload({ stream: true })); // перезагрузка сервера
});

// сбор стилей
gulp.task('css:build', () => {
  return gulp.src(path.src.style) // получим main.scss
    .pipe(plumber()) // для отслеживания ошибок
    .pipe(sourcemaps.init()) // инициализируем sourcemap
    .pipe(sass()) // scss -> css
    .pipe(autoprefixer()) // добавим префиксы
    .pipe(gulp.dest(path.build.css))
    .pipe(rename({ suffix: '.min' }))
    .pipe(cleanCss()) // минимизируем CSS
    .pipe(sourcemaps.write('./')) // записываем sourcemap
    .pipe(gulp.dest(path.build.css)) // выгружаем в build
    .pipe(webserver.reload({ stream: true })); // перезагрузим сервер
});

// сбор js
gulp.task('js:build', () => {
  return gulp.src(path.src.js) // получим файл main.js
    .pipe(plumber()) // для отслеживания ошибок
    .pipe(rigger()) // импортируем все указанные файлы в main.js
    .pipe(gulp.dest(path.build.js))
    .pipe(rename({ suffix: '.min' }))
    .pipe(sourcemaps.init()) //инициализируем sourcemap
    .pipe(uglify.default()) // минимизируем js
    .pipe(sourcemaps.write('./')) //  записываем sourcemap
    .pipe(gulp.dest(path.build.js)) // положим готовый файл
    .pipe(webserver.reload({ stream: true })); // перезагрузим сервер
});

// перенос шрифтов
gulp.task('fonts:build', () => {
  return gulp.src(path.src.fonts)
    .pipe(gulp.dest(path.build.fonts));
});



// обработка картинок
gulp.task('image:build', () => {
  return gulp.src(path.src.img) // путь с исходниками картинок
    .pipe(imagemin([ // сжатие изображений
      gifsicle({interlaced: true}),
      mozjpeg({quality: 75, progressive: true}),
      optipng({optimizationLevel: 5}),
      //svgo({ plugins: [{ removeViewBox: false }] })
    ]))
    .pipe(gulp.dest(path.build.img)); // выгрузка готовых файлов
});

// удаление каталога build
gulp.task('clean:build', () => {
  return del(path.clean);
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
  gulp.watch(path.watch.html, gulp.series('html:build'));
  gulp.watch(path.watch.css, gulp.series('css:build'));
  gulp.watch(path.watch.js, gulp.series('js:build'));
  gulp.watch(path.watch.img, gulp.series('image:build'));
  gulp.watch(path.watch.fonts, gulp.series('fonts:build'));
});

// задача по умолчанию
gulp.task('default', gulp.series(
  'build',
  gulp.parallel('webserver','watch')
));
