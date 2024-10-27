import Taro, { type FileSystemManager } from '@tarojs/taro';

export class FS {
  static async open(
    filePath: string,
    flag: keyof FileSystemManager.flag,
  ): Promise<FSOpen> {
    console.log('[FS] open not supported');
    return new FSOpen('', '');
  }

  static async sign(filePath: string, type: 'md5' | 'sha1') {
    console.log('[FS] sign not supported');
    return '';
  }

  static async remove(filePath: string) {
    console.log('[FS] remove not supported');
  }

  static stdPathStyle(path: string) {
    if (path.startsWith('http') || path.startsWith('wxfile')) {
      return path;
    }
    if (!path.startsWith('/') || !path.startsWith('./')) {
      path = `/${path}`;
    }
    if (!path.startsWith(Taro.env.USER_DATA_PATH as string)) {
      path = `${Taro.env.USER_DATA_PATH}${path}`;
    }
    return path;
  }
}

export class FSOpen {
  constructor(
    private fd: string,
    private _filePath: string,
  ) {}

  get filePath() {
    return this._filePath;
  }

  async read(offset: number, length: number) {
    const buffer = new ArrayBuffer(length);

    return buffer;
  }

  async write(offset: number, buffer: ArrayBuffer) {
    console.log('[FS] write not supported');
    return 0;
  }

  async close() {
    console.log('[FS] close not supported');
  }
}
