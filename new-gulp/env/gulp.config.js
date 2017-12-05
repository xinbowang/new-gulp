import path from 'path';
// 文件夹路径
export let Dir = {
  dist: path.resolve(__dirname,'../dist'), // 开发环境文件目录
  build: path.resolve(__dirname,'../build'),// 生产环境文件目录
  src: path.resolve(__dirname,'../src'), // 编译前文件目录
  asserts: path.resolve(__dirname,'../src/asserts') // 放置不被编译文件，直接输出
}
// 配置文件路径
export let Path = {
  html: Dir.src + '/**/*.html',
  css: Dir.src + '/css/**/*.css',
  js: Dir.src + '/js/**/*.js',
  sass: Dir.src + '/sass/**/*.scss',
  img: Dir.src + '/img/**/*',
  asserts: Dir.src + '/asserts/**/*'
}
