import Taro from '@tarojs/taro';

export function getMenuButtonBoundingClientRect() {
  if (Taro.getEnv() === Taro.ENV_TYPE.WEAPP) {
    return Taro.getMenuButtonBoundingClientRect();
  } else {
    return {
      bottom: 83,
      height: 32,
      left: 334,
      right: 421,
      top: 0,
      width: 87,
    };
  }
}

export function getWindowInfo() {
  const winfo = Taro.getWindowInfo();
  return Object.assign({}, winfo, {
    statusBarHeight: winfo.statusBarHeight || 20,
  });
}

export function getDeviceInfo() {
  return Taro.getDeviceInfo();
}

export function canIUse(schema: string) {
  return Taro.canIUse(schema);
}
