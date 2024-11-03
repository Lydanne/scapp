import { Emitter } from '../shared/emitter';
import type { IChannel, IConnection } from './IChannel';
import { LocalChannel } from './LocalChannel';

export default new (class ChannelManager {
  private currChannelName: string = 'local';
  private channels: Map<string, IChannel<IConnection>> = new Map();

  public emReload = new Emitter<
    (channel: IChannel<IConnection>, prev?: IChannel<IConnection>) => any
  >();

  constructor() {
    this.channels.set('local', new LocalChannel());
    this.load('local');
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
    this.emReload.emitLifeCycle(
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
