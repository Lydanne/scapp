import type { SocketIP } from './types';

export interface Channel {
  connect(socketIP: SocketIP): void;
}
