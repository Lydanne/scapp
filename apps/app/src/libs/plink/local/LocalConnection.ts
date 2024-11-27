import { Base64 } from 'src/libs/base64';

import { bufferMd5 } from '../../shared/bufferMd5';
import { StringBuffer } from '../../shared/stringbuffer';
import { FS, type FSOpen } from '../../tapi/fs';
import { IConnection } from '../IChannel';
import { Mpsc } from '../Mpsc';
import {
  AboutStatus,
  type DataAction,
  DataType,
  type DetectAction,
  FinishStatus,
  type SynReadySignal,
  type SyncAction,
} from '../payload';
import { mergeArrayBuffer } from '../shared';
import {
  From,
  type OnData,
  OnDataStatus,
  type SendData,
  SocketIP,
} from '../types';
import { BLOCK_SIZE } from './LocalChannel';

type PipeData = {
  buffers: Uint8Array[];
  head: SynReadySignal;
  received: number;
  receivedBytes: number;
  progress: number;
  speed: number;
  startTime: number;
};

export class MsgManager {
  msgs: number[] = [];
  maps: Map<number, OnData> = new Map();

  push(msg: OnData) {
    this.msgs.push(msg.id);
    this.maps.set(msg.id, msg);
  }

  get(id: number) {
    return this.maps.get(id);
  }

  filter(filter: (msg: OnData) => boolean) {
    return this.msgs
      .filter((id) => filter(this.maps.get(id)!))
      .map((id) => this.maps.get(id)!);
  }
}

export class LocalConnection extends IConnection {
  detectAt: number = 0;
  detectErrorCount: number = 0;

  dataMpsc = new Mpsc<DataAction>();
  syncMpsc = new Mpsc<SyncAction>();
  detectMpsc = new Mpsc<DetectAction>();

  msgs = new MsgManager();

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

    const name = head.name ?? '';
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
      const buffer = await Base64.encode(text);
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

    this.msgs.push({
      id,
      index: 0,
      status: OnDataStatus.READY,
      type,
      progress: 0,
      speed: 0,
      head: head as SynReadySignal,
      body: data.body,
      about: AboutStatus.Resume,
      from: From.LOCAL,
    });

    let index = 0;
    while (1) {
      const msg = this.msgs.get(id);
      if (!msg) {
        console.log('msg not found', id);
        break;
      }
      if (msg.about === AboutStatus.Stop) {
        // 永久停止
        break;
      } else if (msg.about === AboutStatus.Pause) {
        // 临时暂停
        await waitPromise(() => {
          if (msg.about === AboutStatus.Stop) {
            return true;
          }
          return msg.about === AboutStatus.Resume;
        });
      }
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

        if (msg) {
          const speed = Math.floor(
            ((offset + offsetLen) / (Date.now() - ts)) * 1000,
          );
          msg.status = OnDataStatus.SENDING;
          msg.index = index;
          msg.progress = Math.floor((index / length) * 100);
          msg.speed = speed;
          msg.about = AboutStatus.Resume;
          cb?.(msg);
        }
      } catch (error) {
        console.log('没有收到ackChunkFinish', error);
      }

      if (index === length) {
        break;
      }
    }

    if (type === DataType.FILE && fd) {
      await fd.close();
    }

    const msg = this.msgs.get(id);
    if (msg) {
      msg.status = OnDataStatus.DONE;
      msg.progress = 100;
      msg.speed = 0;
      cb?.(msg);
    }

    console.log('发送完成', msg);
  }

  on(cb: (data: OnData) => any) {
    const pipeMap = new Map<number, PipeData>();

    this.syncMpsc.rx.on(async (data) => {
      if (data.signal.oneofKind === 'synReady') {
        const filename = data.signal.synReady.name;
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

        this.msgs.push({
          id: data.id,
          index: 0,
          status: OnDataStatus.READY,
          type: data.signal.synReady.type as DataType,
          progress: 0,
          speed: 0,
          head,
          body: '',
          about: AboutStatus.Resume,
          from: From.REMOTE,
        });

        cb(this.msgs.get(data.id)!);
      } else if (data.signal.oneofKind === 'aboutSend') {
        const msg = this.msgs.get(data.id);
        if (msg) {
          msg.about = data.signal.aboutSend.status;
          cb(msg);
        }
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

      const msg = this.msgs.get(data.id);
      if (msg) {
        msg.index = data.index;
        msg.status = OnDataStatus.SENDING;
        msg.progress = pipe.progress;
        msg.speed = pipe.speed;
        cb(msg!);
      }

      if (pipe.received === pipe.head.length) {
        try {
          const buffer = mergeArrayBuffer(pipe.buffers);
          if (pipe.head.type === DataType.TEXT) {
            const body = await Base64.decode(new Uint8Array(buffer));
            if (msg) {
              msg.status = OnDataStatus.DONE;
              msg.progress = 100;
              msg.speed = 0;
              msg.body = body;
              cb(msg!);
            }
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
            if (msg) {
              msg.status = OnDataStatus.DONE;
              msg.progress = 100;
              msg.speed = 0;
              msg.body = fd.filePath;
              cb(msg!);
            }

            await fd.close();
          }
          pipeMap.delete(data.id);
        } catch (error) {
          console.error('Error processing received data:', error);
        }
      }
    });
  }

  async about(sendId: number, about: AboutStatus) {
    if (sendId === 0) {
      // 关闭所有发送中的消息
      const sendMsgs = this.msgs.filter(
        (msg) => msg.status === OnDataStatus.SENDING,
      );
      sendMsgs.forEach((msg) => {
        const data: SyncAction = {
          id: msg.id,
          signal: {
            oneofKind: 'aboutSend',
            aboutSend: {
              status: about,
            },
          },
        };
        this.syncMpsc.rx.emitSync(data);
        this.syncMpsc.tx.emitSync(data);
      });
    } else {
      const msg = this.msgs.get(sendId);
      if (msg) {
        const data: SyncAction = {
          id: sendId,
          signal: {
            oneofKind: 'aboutSend',
            aboutSend: {
              status: about,
            },
          },
        };
        this.syncMpsc.rx.emitSync(data);
        this.syncMpsc.tx.emitSync(data);
      }
    }
    return true;
  }
}

async function waitPromise(cb: () => boolean) {
  while (!cb()) {
    await sleep(300);
  }
}
function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
