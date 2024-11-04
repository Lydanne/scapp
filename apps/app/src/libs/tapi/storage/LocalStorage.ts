import Taro from '@tarojs/taro';

export class LocalStorage {
  constructor(private scope: string) {}

  async get<T>(key: string, defaultValue?: T): Promise<T | undefined> {
    const res = await Taro.getStorage({ key: `${this.scope}:${key}` });
    if (res.data) {
      const { value, expire } = res.data;
      if (expire && expire < Date.now()) {
        await this.remove(key);
      }
      return value;
    }
    return defaultValue;
  }

  async set<T>(key: string, value: T, expire: number = 0) {
    const keys = await Taro.getStorage({
      key: `${this.scope}:__keys__`,
    });
    const keysData = keys.data || [];
    keysData.push(key);
    await Taro.setStorage({
      key: `${this.scope}:__keys__`,
      data: keysData,
    });
    return await Taro.setStorage({
      key: `${this.scope}:${key}`,
      data: {
        value,
        expire,
      },
    });
  }

  async remove(key: string) {
    return await Taro.removeStorage({ key: `${this.scope}:${key}` });
  }

  async clear() {
    return await Taro.clearStorage();
  }

  async keys() {
    const keys = await Taro.getStorage({
      key: `${this.scope}:__keys__`,
    });
    return keys.data || [];
  }
}
