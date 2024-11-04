import Taro from '@tarojs/taro';

export function request(options: Taro.request.Option) {
  return Taro.request(options);
}
