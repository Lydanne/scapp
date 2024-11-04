import Taro from '@tarojs/taro';

import config from 'src/config';

import { service } from '../api/core';

/**
 * 获取全局唯一标识符，微信小程序下拿 openid
 */
export async function guuid() {
  const res = await Taro.login();
  const { code } = res;
  const res2 = await service('POST', '/auth/login', {
    data: {
      appid: config.appId,
      code: code,
    },
  });
  return res2.openid;
}
