import config from 'src/config';

import { GUUID } from '../guuid';
import { request } from '../tapi/request';

export type Method = 'GET' | 'POST' | 'PUT' | 'DELETE';

export async function service<T = any>(
  method: Method,
  path: string,
  options: Partial<Taro.request.Option>,
): Promise<T> {
  const guuid = await GUUID();
  return await new Promise((resolve, reject) =>
    request({
      url: config.baseUrl + path,
      method,
      data: options.data as any,
      header: Object.assign(
        {
          'Content-Type': 'application/json',
          'X-GUUID': guuid,
        },
        options.header,
      ),
      success: (res) => {
        resolve(res.data);
      },
      fail: (err) => {
        reject(err);
      },
    }),
  );
}
