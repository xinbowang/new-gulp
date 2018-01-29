// 引入所需模块
import gulp from 'gulp';
import gulpPlugins from 'gulp-load-plugins';
import del from 'del'; // 清空文件
// 配置文件
import env from './gulp.env';
import {Dir, Path} from './gulp.config';
// import handleErrors from '.././util/handleErrors';
// 服务器
let browserSync = require('browser-sync').create();
let reload = browserSync.reload;
// gulp插件不需要写gulp-前缀
let plugins = gulpPlugins();
let flatten = plugins.flatten; // 拆分目录下的文件
let sass = plugins.sass; // 编译sass
let clean = plugins.clean; // 删除文件
let gulpIf = plugins.if; // if判断
let rename = plugins.rename; // 重命名文件
let cssnano = plugins.cssnano; // css压缩
let uglify = plugins.uglify; // js压缩
let htmlmin = plugins.htmlmin; // js压缩
let concat = plugins.concat; // 合并文件
let imagemin = plugins.imagemin; // 图片压缩
let pngquant = require('imagemin-pngquant'); // 使用pngquant深度压缩png图片的imagemin插件
let cache = plugins.cache; //只压缩修改的图片，没有修改的图片直接从缓存文件读取
let babel = plugins.babel; // 编译es6->es5
let sourcemaps = plugins.sourcemaps; // 关联编译文件后所在源文件的位置
let changed = plugins.changed; // 只编译改变的文件
let sequence = plugins.sequence;
let rev = plugins.rev; // 添加版本号
let revCollector = plugins.revCollector;  // 更改版本号路径
// let assetRev = require('gulp-asset-rev'); // 给URL自动加上版本号
let base64 = plugins.base64;
let webpack = plugins.webpack;
let htmlreplace = plugins.htmlReplace;
let plumber = plugins.plumber;
let postcss = plugins.postcss; // 自动添加css3前缀
let cssnext = require('postcss-cssnext');
let shortcss = require('postcss-short');
let autoprefixer = require('autoprefixer');

function dev(dist, env, port) {
// 清空文件夹
  gulp.task('clean:dev', function() {
    return del(dist);
  });

// * asserts文件夹下的所有文件处理
  gulp.task('asserts:dev', function() {
    return gulp.src(Path.asserts)
    //.pipe(changed(dist,{extension:'.js'}))示例
        .pipe(rev()).
        pipe(changed(`${dist}/asserts`)).
        pipe(gulp.dest(`${dist}/asserts`)).
        pipe(rev.manifest('rev-asserts-manifest.json')).
        pipe(gulp.dest(`${dist}/rev`)).
        pipe(reload({
          stream: true
        }));
  });

// * HTML处理
  gulp.task('html:dev', function() {
    var options = {
      removeComments: true,//清除HTML注释
      collapseWhitespace: true,//清除空格，压缩HTML
      collapseBooleanAttributes: false,//省略布尔属性的值 <input checked="true"/> ==> <input />
      removeEmptyAttributes: true,//删除所有空格作属性值 <input id="" /> ==> <input />
      removeScriptTypeAttributes: true,//删除<script>的type="text/javascript"
      removeStyleLinkTypeAttributes: true,//删除<style>和<mixin>的type="text/css"
      minifyJS: true,//压缩页面JS
      minifyCSS: true//压缩页面CSS
    };
    return gulp.src([`${dist}/rev/**/*.json`, Path.html, `!${Path.asserts}`])// 更改内部css版本号json文件
        .pipe(flatten()).pipe(gulpIf(env, htmlreplace({
          'css': {
            src: '/css',
            tpl: '<link rel="stylesheet" type="text/css" href="%s/app.min.css">',
          },
          // 'css': ['css/build.min.css'],
          'js': ['js/app.min.js'],
        }))).pipe(revCollector()) // 更改版本号路径
        .pipe(gulpIf(env, htmlmin(options))).pipe(gulp.dest(dist)).pipe(reload({
          stream: true
        }));
  });

  // * CSS样式处理
  gulp.task('css:dev', function() {
    return gulp.src(Path.css).
        pipe(plumber({
          errorHandler: true
        }))
        .pipe(gulp.dest(`${dist}/css`)).
        pipe(reload({
          stream: true
        }));
  });

// * SASS样式处理
  gulp.task('sass:dev', function() {
    var plug = [
      shortcss,
      cssnext,
      autoprefixer({browsers: ['> 1%', 'last 2 version'], cascade: false}),
    ];
    return gulp.src(Path.sass).
        pipe(plumber({
          errorHandler: true
        })).
        pipe(changed(`${dist}/style`)).
        pipe(base64({
          baseDir: `${Dir.src}/sass`,
          extensions: ['svg', 'png', /\.jpg#datauri$/i],
          maxImageSize: 100 * 1024, // 小于100kb转码
          debug: true,
        })).
        pipe(sourcemaps.init({loadMaps: true})).
        pipe(sass()).
        pipe(postcss(plug)). // 放到编译后面，否则可能报错
        pipe(sourcemaps.write('./map/'))
        .pipe(gulp.dest(`${dist}/css`)).
        pipe(reload({
          stream: true
        }));
  });

// * 清理css文件夹
//   gulp.task('clean', function() {
//     return gulp.src(`${dist}/css/`).on('error', handleErrors)     //交给notify处理错误
//         .pipe(clean())
//   });

// * 合并css并压缩
  gulp.task('css-cssnano',['sass:dev', 'css:dev'], function() {
    return gulp.src(`${dist}/css/*.css`)
        .pipe(sourcemaps.init({loadMaps: true}))
        .pipe(concat('app.css')) // 合并css
        .pipe(rename({
          suffix: '.min'
        })).
        pipe(cssnano()) // 压缩css
        .pipe(rev()).
        pipe(sourcemaps.write('./map/')).
        pipe(gulp.dest(`${dist}/css`)).
        pipe(rev.manifest('rev-concat-min-manifest.json')).
        pipe(gulp.dest(`${dist}/rev`)).
        pipe(reload({
          stream: true
        }));
  });

// * js处理
  gulp.task('js:dev', function() {
    return gulp.src(Path.js).
        pipe(plumber({
          errorHandler: true
        })).
        pipe(sourcemaps.init({loadMaps: true})).
        pipe(babel()).
        pipe(gulp.dest(`${dist}/js`)).
        pipe(webpack({ // 合并js，并将import改成requite方式
          output: {
            filename: 'app.js',
          },
        })).
        pipe(gulpIf(env, rename({
          suffix: '.min'
        }))).
        pipe(gulpIf(env, uglify())) // 压缩js
        .pipe(rev()).
        pipe(sourcemaps.write('./map/')).
        pipe(gulp.dest(`${dist}/js`)).
        pipe(rev.manifest('rev-js-manifest.json')).
        pipe(gulp.dest(`${dist}/rev`)).
        pipe(reload({
          stream: true
        }));
  });

// * 图片处理
  gulp.task('images:dev', function() {
    return gulp.src(Path.img).
        pipe(plumber({
          errorHandler: true
        })).
        pipe(cache(imagemin({
          optimizationLevel: 3, //类型：Number  默认：3  取值范围：0-7（优化等级）
          progressive: true, //类型：Boolean 默认：false 无损压缩jpg图片
          interlaced: true, //类型：Boolean 默认：false 隔行扫描gif进行渲染
          multipass: true, //类型：Boolean 默认：false 多次优化svg直到完全优化
          svgoPlugins: [{removeViewBox: false}], //不要移除svg的viewbox属性
          use: [pngquant()] //使用pngquant深度压缩png图片的imagemin插件
        }))).
        pipe(rev())
        .pipe(gulp.dest(`${dist}/img`)).
        pipe(rev.manifest('rev-img-manifest.json')).
        pipe(gulp.dest(`${dist}/rev`)).
        pipe(reload({
          stream: true
        }));
  });
// 启动服务器
  gulp.task('build', function(cb) {
    if(env){
      sequence('clean:dev', ['css-cssnano', 'asserts:dev', 'js:dev', 'images:dev'],
          'html:dev')(function() {
        browserSync.init({
          server: {
            baseDir: dist
          }
          , notify: false
          , port // 默认3000,
          , index: 'login.html'
        });
      });
    }else{
      sequence('clean:dev', ['sass:dev', 'css:dev', 'asserts:dev', 'js:dev', 'images:dev'],
          'html:dev')(function() {
        browserSync.init({
          server: {
            baseDir: dist
          }
          , notify: false
          , port // 默认3000
          , index: 'login.html'
        });
        gulp.watch(Path.asserts, ['asserts:dev']);
        gulp.watch(Path.sass, ['sass:dev']);
        gulp.watch(Path.css, ['css:dev']);
        // gulp.watch(`${dist}/css/**/*.css`, ['css-concat']);
        gulp.watch(Path.js, ['js:dev']);
        gulp.watch(Path.images, ['images:dev']);
        gulp.watch(Path.html, ['html:dev']);
      });
    }

  });
}

export default dev;