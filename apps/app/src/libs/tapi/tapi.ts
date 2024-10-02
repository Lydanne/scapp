import Taro from "@tarojs/taro";

export function getMenuButtonBoundingClientRect() {
  return Taro.getMenuButtonBoundingClientRect();
}

export function getWindowInfo() {
  return Taro.getWindowInfo();
}

export function getDeviceInfo() {
  return Taro.getDeviceInfo();
}

export function canIUse(schema: string) {
  return Taro.canIUse(schema);
}
