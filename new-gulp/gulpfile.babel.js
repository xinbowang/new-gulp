// 配置文件
import env from './env/gulp.env';
import {Dir} from './env/gulp.config';
// 引入dev
import dev from './env/dev';
// 判断环境
if (env === 'production') { // 生产环境
  dev(Dir.build, true, 8001);
} else { // 开发环境
  dev(Dir.dist, false, 8000);
}


