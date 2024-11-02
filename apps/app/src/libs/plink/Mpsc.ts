import { Emitter } from '../shared/emitter';

export class Mpsc<T> {
  tx = new Emitter<(data: T) => any>(); // 发送
  rx = new Emitter<(data: T) => any>(); // 接收
}
