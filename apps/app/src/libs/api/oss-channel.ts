import config from 'src/config';

import { randId } from '../plink/shared';
import { service } from './core';

export const OssChannel = new (class OssChannel {
  async listen() {
    const port = randId();
    const res = await service('POST', '/oss/listen', {
      data: {
        port,
      },
    });
    return port;
  }
})();
