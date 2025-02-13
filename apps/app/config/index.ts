const path = require('path');

const config = {
  projectName: 'scapp',
  alias: {
    src: path.resolve(__dirname, '..', 'src/'),
  },
  date: '2024-9-29',
  designWidth: 375,
  deviceRatio: {
    640: 2.34 / 2,
    750: 1,
    828: 1.81 / 2,
    375: 2 / 1,
  },
  sourceRoot: 'src',
  outputRoot: `dist/${process.env.TARO_ENV}`,
  plugins: ['@tarojs/plugin-html'],
  defineConstants: {},
  copy: {
    patterns: [
      {
        from: `src/libs/base64/base64_rs_bg.wasm`,
        to: `dist/${process.env.TARO_ENV}/base64_rs_bg.wasm`,
      },
    ],
  },
  framework: 'react',
  compiler: {
    type: 'webpack5',
    prebundle: { enable: false },
  },
  mini: {
    miniCssExtractPluginOption: {
      ignoreOrder: true,
    },
    postcss: {
      pxtransform: {
        enable: true,
        config: {
          selectorBlackList: ['nut-'],
        },
      },
      url: {
        enable: true,
        config: {
          limit: 1024, // 设定转换尺寸上限
        },
      },
      cssModules: {
        enable: true, // 默认为 false，如需使用 css modules 功能，则设为 true
        config: {
          namingPattern: 'module', // 转换模式，取值为 global/module
          generateScopedName: '[name]__[local]___[hash:base64:5]',
        },
      },
    },
  },
  h5: {
    publicPath: '/',
    staticDirectory: 'static',
    // esnextModules: ['nutui-react'],
    devServer: {
      open: false,
    },
    postcss: {
      pxtransform: {
        enable: true,
        config: {
          selectorBlackList: ['nut-'],
        },
      },
      autoprefixer: {
        enable: true,
        config: {},
      },
      cssModules: {
        enable: true, // 默认为 false，如需使用 css modules 功能，则设为 true
        config: {
          namingPattern: 'module', // 转换模式，取值为 global/module
          generateScopedName: '[name]__[local]___[hash:base64:5]',
        },
      },
    },
    webpackChain(chain) {
      chain.merge({
        experiments: {
          asyncWebAssembly: true,
        },
        ignoreWarnings: [/async\/await/], // 忽略警告
        module: {
          rules: [
            {
              test: /\.wasm$/,
              type: 'webassembly/async',
            },
          ],
        },
        // 添加 wbg 别名解析
        resolve: {
          fallback: {
            wbg: false,
          },
        },
      });
    },
  },
};

module.exports = function (merge) {
  if (process.env.NODE_ENV === 'development') {
    return merge({}, config, require('./dev'));
  }
  return merge({}, config, require('./prod'));
};
