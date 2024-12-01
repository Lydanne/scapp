import Taro from '@tarojs/taro';

export async function chooseFile(): Promise<Taro.chooseMessageFile.SuccessCallbackResult> {
  return new Promise((resolve, reject) => {
    Taro.chooseMessageFile({
      count: 1,
      type: 'file',
      success: (res) => resolve(res),
      fail: (err) => reject(err),
    });
  });
}
