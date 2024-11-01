import { Base64 } from '../shared/base64';
import { bufferMd5 } from '../shared/bufferMd5';
import { StringBuffer } from '../shared/stringbuffer';
import { FS, type FSOpen } from '../tapi/fs';
import { MpscChannel } from './MpscChannel';
import { BLOCK_SIZE } from './UdpChannel';
import {
  type DataAction,
  DataType,
  type DetectAction,
  FinishStatus,
  type SynReadySignal,
  type SyncAction,
} from './payload';
import { mergeArrayBuffer } from './shared';

export type SocketIP = `${string}:${number}`;

export enum ChannelStatus {
  init = 0,
  connecting = 1,
  connected = 2,
  disconnecting = 3,
  disconnected = 4,
}

export type ConnectionProps = {
  id: number;
  status: ChannelStatus;
  socketIP: SocketIP;
  seq: number;
};

export type OnData = {
  id: number; // 消息 id
  index: number; // 块序号
  status: OnDataStatus;
  type: DataType;
  progress: number; // 0-100, 0 表示准备好，100 表示完成
  speed: number; // 速度 字节/秒
  head: SynReadySignal;
  body: string;
};

export enum OnDataStatus {
  READY = 0,
  SENDING = 1,
  DONE = 2,
}

export type SendData = {
  id: number;
  type: DataType;
  head: Partial<SynReadySignal>;
  body: string;
};

export class Connection {
  id: number;
  status: ChannelStatus = ChannelStatus.init;
  socketIP: SocketIP;
  seq: number = 0;
  detectAt: number = 0;
  detectErrorCount: number = 0;

  dataMpsc = new MpscChannel<DataAction>();
  syncMpsc = new MpscChannel<SyncAction>();
  detectMpsc = new MpscChannel<DetectAction>();

  constructor(data: ConnectionProps) {
    this.id = data.id;
    this.status = data.status;
    this.socketIP = data.socketIP;
    this.seq = data.seq;
  }

  waitSignal(timeout: number, filter: (signal: SyncAction) => boolean) {
    return new Promise((resolve, reject) => {
      const clear = this.syncMpsc.rx.on((signal) => {
        if (filter(signal)) {
          resolve(undefined);
          clearTimeout(timer);
          clear();
        }
      });
      const timer = setTimeout(() => {
        clear();
        reject(new Error('timeout'));
      }, timeout);
    });
  }

  async send(data: SendData, cb?: (onData: OnData) => any) {
    console.log('send', data);
    const { type, head, body, id } = data;

    const name = encodeURIComponent(head.name ?? '');
    let size: number;
    let sign: string;
    let fd: FSOpen | undefined;
    let getDataChunk: (offset: number, length: number) => Promise<ArrayBuffer>;
    const ts = Date.now();

    if (type === DataType.FILE) {
      const path = body ?? '';
      size = head.size ?? 0;
      console.log('send file', [path, size]);

      sign = await FS.sign(path, 'md5');
      fd = await FS.open(path, 'r');
      getDataChunk = async (offset, length) => await fd!.read(offset, length);
    } else {
      const text = body;
      const base64Text = Base64.encode(text);
      const buffer = StringBuffer.encode(base64Text);
      size = buffer.byteLength;
      sign = bufferMd5(buffer);
      getDataChunk = async (offset, length) => {
        const chunk = buffer.slice(offset, offset + length);
        return chunk;
      };
    }

    const length = Math.ceil(size / BLOCK_SIZE);

    const sync: SyncAction = {
      id,
      signal: {
        oneofKind: 'synReady',
        synReady: {
          size,
          length,
          sign,
          name,
          type,
        },
      },
    };
    await this.syncMpsc.tx.emit(sync);
    await this.waitSignal(
      1000,
      (signal) => signal.signal.oneofKind === 'ackReady' && signal.id === id,
    );

    let index = 0;
    while (1) {
      const offset = index * BLOCK_SIZE;
      const offsetLen = Math.min(size - offset, BLOCK_SIZE);
      const buffer = await getDataChunk(offset, offsetLen);
      const data: DataAction = {
        id,
        index,
        body: new Uint8Array(buffer),
      };

      await this.dataMpsc.tx.emit(data);
      try {
        await this.waitSignal(
          1000,
          (signal) =>
            signal.signal.oneofKind === 'ackChunkFinish' &&
            signal.id === id &&
            signal.signal.ackChunkFinish.index === index &&
            signal.signal.ackChunkFinish.status === FinishStatus.Ok,
        );
        index++;
        const speed = Math.floor(
          ((offset + offsetLen) / (Date.now() - ts)) * 1000,
        );
        cb?.({
          id,
          index,
          status: OnDataStatus.SENDING,
          type,
          progress: Math.floor((index / length) * 100),
          speed,
          head: head as SynReadySignal,
          body: '',
        });
      } catch (error) {
        console.log('发送错误', error);
      }

      if (index === length) {
        break;
      }
    }

    if (type === DataType.FILE && fd) {
      await fd.close();
    }

    cb?.({
      id,
      index: length,
      status: OnDataStatus.DONE,
      type,
      progress: 100,
      speed: 0,
      head: head as SynReadySignal,
      body: '',
    });

    console.log('发送完成', [id, length], Date.now() - ts);
  }

  on(cb: (data: OnData) => any) {
    const pipeMap = new Map<
      number,
      {
        buffers: Uint8Array[];
        head: SynReadySignal;
        received: number;
        receivedBytes: number;
        progress: number;
        speed: number;
        startTime: number;
      }
    >();

    this.syncMpsc.rx.on(async (data) => {
      if (data.signal.oneofKind === 'synReady') {
        const filename = decodeURIComponent(data.signal.synReady.name);
        const head = {
          ...data.signal.synReady,
          name: filename,
        };
        pipeMap.set(data.id, {
          buffers: new Array(data.signal.synReady.length),
          head,
          received: 0,
          receivedBytes: 0,
          progress: 0,
          speed: 0,
          startTime: Date.now(),
        });

        const ackReady: SyncAction = {
          id: data.id,
          signal: {
            oneofKind: 'ackReady',
            ackReady: {
              length: data.signal.synReady.length,
              sign: data.signal.synReady.sign,
              size: data.signal.synReady.size,
            },
          },
        };
        this.syncMpsc.tx.emitSync(ackReady);

        cb({
          id: data.id,
          index: 0,
          status: OnDataStatus.READY,
          type: data.signal.synReady.type as DataType,
          progress: 0,
          speed: 0,
          head,
          body: '',
        });
      }
    });

    this.dataMpsc.rx.on(async (data) => {
      const pipe = pipeMap.get(data.id);
      if (!pipe) {
        console.log('pipe not found', data.id);
        return;
      }

      const ackChunkFinish: SyncAction = {
        id: data.id,
        signal: {
          oneofKind: 'ackChunkFinish',
          ackChunkFinish: {
            index: data.index,
            status: FinishStatus.Ok,
          },
        },
      };

      await this.syncMpsc.tx.emit(ackChunkFinish);
      if (pipe.buffers[data.index]) {
        console.warn('chunk already received', data.id, data.index);
        return;
      }
      pipe.received += 1;
      pipe.receivedBytes += data.body.byteLength;
      const now = Date.now();
      pipe.progress = Math.floor((pipe.received / pipe.head.length) * 100);
      pipe.speed = Math.floor(
        (pipe.receivedBytes / (now - pipe.startTime)) * 1000,
      );
      pipe.buffers[data.index] = data.body;

      cb({
        id: data.id,
        index: data.index,
        status: OnDataStatus.SENDING,
        type: pipe.head.type as DataType,
        progress: pipe.progress,
        speed: pipe.speed,
        head: pipe.head,
        body: '',
      });

      if (pipe.received === pipe.head.length) {
        try {
          const buffer = mergeArrayBuffer(pipe.buffers);
          if (pipe.head.type === DataType.TEXT) {
            const base64Text = StringBuffer.decode(new Uint8Array(buffer));
            const body = Base64.decode(base64Text);
            cb({
              id: data.id,
              index: data.index,
              status: OnDataStatus.DONE,
              type: DataType.TEXT,
              progress: 100,
              speed: pipe.speed,
              head: pipe.head,
              body: body,
            });
          } else if (pipe.head.type === DataType.FILE) {
            const filename = pipe.head.name;
            await FS.remove(filename);
            const fd = await FS.open(filename, 'w+');

            for (let index = 0; index < pipe.head.length; index++) {
              const chunk = pipe.buffers[index];
              const offset = index * BLOCK_SIZE;
              const offsetLen = Math.min(pipe.head.size - offset, BLOCK_SIZE);
              const arrayBuffer = new ArrayBuffer(offsetLen);
              const uint8Array = new Uint8Array(arrayBuffer);
              uint8Array.set(chunk.slice(0, offsetLen));
              await fd.write(offset, arrayBuffer);
            }

            console.log('receive file done', data.id, filename);
            cb({
              id: data.id,
              index: data.index,
              status: OnDataStatus.DONE,
              type: DataType.FILE,
              progress: 100,
              speed: pipe.speed,
              head: pipe.head,
              body: fd.filePath,
            });
          }
          pipeMap.delete(data.id);
        } catch (error) {
          console.error('Error processing received data:', error);
        }
      }
    });
  }

  about(id: number) {
    // this.signalSender.emitSync({
    //   id,
    //   signal: {
    //     oneofKind: 'about',
    //   },
    // });
  }

  close() {
    this.about(0);
  }
}
