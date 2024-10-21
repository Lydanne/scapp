import Taro, { type FileSystemManager } from '@tarojs/taro';

const fsm = Taro.getFileSystemManager();

export class FS {
  static async open(
    filePath: string,
    flag: keyof FileSystemManager.flag,
  ): Promise<FSOpen> {
    filePath = FS.stdPathStyle(filePath);
    const fd: string = await new Promise((resolve, reject) => {
      fsm.open({
        filePath: filePath,
        flag,
        success: async ({ fd }) => {
          resolve(fd);
        },
        fail: reject,
      });
    });
    return new FSOpen(fd, filePath);
  }

  static async sign(filePath: string, type: 'md5' | 'sha1') {
    filePath = FS.stdPathStyle(filePath);
    const sign = await new Promise<string>((resolve, reject) => {
      fsm.getFileInfo({
        filePath: filePath,
        digestAlgorithm: type,
        success: ({ digest }) => {
          resolve(digest as string);
        },
        fail: reject,
      });
    });
    return sign;
  }

  static async remove(filePath: string) {
    filePath = FS.stdPathStyle(filePath);
    await new Promise((resolve) => {
      fsm.removeSavedFile({
        filePath,
        success: resolve,
        fail: resolve,
      });
    });
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

    await new Promise((resolve) => {
      fsm.read({
        fd: this.fd,
        arrayBuffer: buffer,
        position: offset,
        length: length,
        success: resolve,
      });
    });

    return buffer;
  }

  async write(offset: number, buffer: ArrayBuffer) {
    const bytesWritten = await new Promise((resolve, reject) =>
      fsm.write({
        fd: this.fd,
        data: buffer,
        position: offset,
        success(res) {
          resolve(res.bytesWritten);
        },
        fail: reject,
      }),
    );
    return bytesWritten;
  }

  async close() {
    await new Promise((resolve) => {
      fsm.close({
        fd: this.fd,
        success: resolve,
        fail: resolve,
      });
    });
  }
}
