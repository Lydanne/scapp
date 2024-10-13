import Taro from '@tarojs/taro';

export function getLocalIPAddress() {
  return new Promise((resolve, reject) => {
    Taro.getLocalIPAddress({
      success: (res) => {
        if (!res?.localip) {
          reject('localip not found');
          return;
        }
        resolve(res.localip);
      },
      fail: (e) => {
        reject(e);
      },
    });
  });
}
