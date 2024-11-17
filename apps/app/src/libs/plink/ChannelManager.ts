import { Emitter } from '../shared/emitter';
import type { IChannel, IConnection } from './IChannel';
import { LocalChannel } from './local/LocalChannel';
import { NativeChannel } from './native/NativeChannel';
import { OssChannel } from './oss/OssChannel';

export default new (class ChannelManager {
  private currChannelName: string = 'local';
  private channels: Map<string, IChannel<IConnection>> = new Map();

  public emLoad = new Emitter<
    (channel: IChannel<IConnection>, prev?: IChannel<IConnection>) => any
  >();

  constructor() {
    this.channels.set('local', new LocalChannel());
    this.channels.set('oss', new OssChannel());
    this.channels.set('native', new NativeChannel());
    this.load('native');
  }

  async close(name: string) {
    if (!this.channels.has(name)) {
      throw new Error(`Channel ${name} not found`);
    }
    return this.channels.get(name)?.close();
  }

  async reload(name: string) {
    if (!this.channels.has(name)) {
      throw new Error(`Channel ${name} not found`);
    }
    await this.load(name);
    return this.channel;
  }

  async load(name: string) {
    if (!this.channels.has(name)) {
      throw new Error(`Channel ${name} not found`);
    }
    this.emLoad.emitLifeCycle(
      this.channels.get(name) as IChannel<IConnection>,
      this.channel,
    );
    this.currChannelName = name;
    await this.channel.listen();

    return this.channel;
  }

  get channel(): IChannel<IConnection> {
    if (!this.channels.has(this.currChannelName)) {
      throw new Error(`Channel ${this.currChannelName} not found`);
    }
    return this.channels.get(this.currChannelName) as IChannel<IConnection>;
  }
})();
