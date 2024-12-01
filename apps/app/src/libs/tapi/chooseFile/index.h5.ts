import { open } from '@tauri-apps/plugin-dialog';
import { stat } from '@tauri-apps/plugin-fs';

import { APP } from '../platform';

export async function chooseFile(): Promise<Taro.chooseMessageFile.SuccessCallbackResult> {
  if (APP) {
    const res = await open({
      title: '选择文件',
      multiple: true,
      directory: false,
    });
    const tempFiles: Taro.chooseMessageFile.ChooseFile[] = await Promise.all(
      res?.map(async (path) => {
        const name = path.split('/').pop() as string;
        const size = await stat(path).then((stat) => stat.size);
        return {
          name,
          path,
          size,
          time: Math.floor(Date.now() / 1000),
          type: 'file',
        };
      }) ?? [],
    );
    console.log('res', tempFiles);
    return {
      tempFiles,
      errMsg: 'chooseMessageFile:ok',
    };
  } else {
    throw new Error('not implemented');
  }
}
