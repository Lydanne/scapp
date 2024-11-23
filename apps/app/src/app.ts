import React, { useEffect } from 'react';

import { useDidHide, useDidShow } from '@tarojs/taro';
import { attachConsole } from '@tauri-apps/plugin-log';

// 全局样式
import './app.scss';
import base64 from './libs/base64';
import { APP } from './libs/tapi/platform';

console.log(base64());

if (APP) {
  attachConsole();
}

function App(props) {
  // 可以使用所有的 React Hooks
  useEffect(() => {});

  // 对应 onShow
  useDidShow(() => {});

  // 对应 onHide
  useDidHide(() => {});

  return props.children;
}

export default App;
