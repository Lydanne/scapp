import Taro from '@tarojs/taro';

import config from 'src/config';

import { request } from '../tapi/request';

/**
 * 获取全局唯一标识符，微信小程序下拿 openid
 */
export async function GUUID() {
  const res = await Taro.login();
  const { code } = res;
  const res2 = await request({
    method: 'POST',
    url: '/auth/login',
    data: {
      appid: config.appId,
      code: code,
    },
  });
  return res2.data.openid;
}
