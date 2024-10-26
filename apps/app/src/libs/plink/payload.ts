// @generated by protobuf-ts 2.9.4
// @generated from protobuf file "payload.proto" (syntax proto3)
// tslint:disable
import type { BinaryWriteOptions } from '@protobuf-ts/runtime';
import type { IBinaryWriter } from '@protobuf-ts/runtime';
import { WireType } from '@protobuf-ts/runtime';
import type { BinaryReadOptions } from '@protobuf-ts/runtime';
import type { IBinaryReader } from '@protobuf-ts/runtime';
import { UnknownFieldHandler } from '@protobuf-ts/runtime';
import type { PartialMessage } from '@protobuf-ts/runtime';
import { reflectionMergePartial } from '@protobuf-ts/runtime';
import { MessageType } from '@protobuf-ts/runtime';

/**
 * @generated from protobuf message Plink
 */
export interface Plink {
  /**
   * @generated from protobuf field: uint32 version = 1;
   */
  version: number;
  /**
   * @generated from protobuf field: string uuid = 2;
   */
  uuid: string;
  /**
   * @generated from protobuf field: string socketIP = 3;
   */
  socketIP: string;
  /**
   * @generated from protobuf field: uint64 ts = 4;
   */
  ts: bigint;
}
/**
 * @generated from protobuf message Channel
 */
export interface Channel {
  /**
   * @generated from protobuf field: uint32 version = 1;
   */
  version: number;
  /**
   * @generated from protobuf field: uint32 id = 2;
   */
  id: number;
  /**
   * @generated from protobuf field: uint64 ts = 3;
   */
  ts: bigint;
  /**
   * @generated from protobuf oneof: action
   */
  action:
    | {
        oneofKind: 'connect';
        /**
         * @generated from protobuf field: ConnectAction connect = 4;
         */
        connect: ConnectAction;
      }
    | {
        oneofKind: 'disconnect';
        /**
         * @generated from protobuf field: DisconnectAction disconnect = 5;
         */
        disconnect: DisconnectAction;
      }
    | {
        oneofKind: 'data';
        /**
         * @generated from protobuf field: DataAction data = 6;
         */
        data: DataAction;
      }
    | {
        oneofKind: 'sync';
        /**
         * @generated from protobuf field: SyncAction sync = 7;
         */
        sync: SyncAction;
      }
    | {
        oneofKind: 'detect';
        /**
         * @generated from protobuf field: DetectSignal detect = 8;
         */
        detect: DetectSignal;
      }
    | {
        oneofKind: undefined;
      };
}
/**
 * @generated from protobuf message ConnectAction
 */
export interface ConnectAction {
  /**
   * @generated from protobuf field: uint32 seq = 1;
   */
  seq: number;
  /**
   * @generated from protobuf field: uint32 ack = 2;
   */
  ack: number;
}
/**
 * @generated from protobuf message DisconnectAction
 */
export interface DisconnectAction {
  /**
   * @generated from protobuf field: uint32 seq = 1;
   */
  seq: number;
  /**
   * @generated from protobuf field: uint32 ack = 2;
   */
  ack: number;
}
/**
 * @generated from protobuf message DataAction
 */
export interface DataAction {
  /**
   * @generated from protobuf field: uint32 id = 1;
   */
  id: number;
  /**
   * @generated from protobuf field: uint32 index = 2;
   */
  index: number;
  /**
   * @generated from protobuf field: bytes body = 3;
   */
  body: Uint8Array;
}
/**
 * @generated from protobuf message SyncAction
 */
export interface SyncAction {
  /**
   * @generated from protobuf field: uint32 id = 1;
   */
  id: number;
  /**
   * @generated from protobuf oneof: signal
   */
  signal:
    | {
        oneofKind: 'synReady';
        /**
         * @generated from protobuf field: SynReadySignal synReady = 2;
         */
        synReady: SynReadySignal;
      }
    | {
        oneofKind: 'ackReady';
        /**
         * @generated from protobuf field: AckReadySignal ackReady = 3;
         */
        ackReady: AckReadySignal;
      }
    | {
        oneofKind: 'ackChunkFinish';
        /**
         * @generated from protobuf field: AckChunkFinish ackChunkFinish = 4;
         */
        ackChunkFinish: AckChunkFinish;
      }
    | {
        oneofKind: undefined;
      };
}
/**
 * @generated from protobuf message DetectSignal
 */
export interface DetectSignal {
  /**
   * @generated from protobuf field: uint32 rtt = 1;
   */
  rtt: number; // 接收时间戳
  /**
   * @generated from protobuf field: uint32 seq = 2;
   */
  seq: number; // 数据包序号
}
/**
 * @generated from protobuf message SynReadySignal
 */
export interface SynReadySignal {
  /**
   * @generated from protobuf field: uint32 length = 1;
   */
  length: number;
  /**
   * @generated from protobuf field: uint32 size = 2;
   */
  size: number;
  /**
   * @generated from protobuf field: string sign = 3;
   */
  sign: string;
  /**
   * @generated from protobuf field: string name = 4;
   */
  name: string;
  /**
   * @generated from protobuf field: DataType type = 5;
   */
  type: DataType;
}
/**
 * @generated from protobuf message AckReadySignal
 */
export interface AckReadySignal {
  /**
   * @generated from protobuf field: uint32 length = 1;
   */
  length: number;
  /**
   * @generated from protobuf field: uint32 size = 2;
   */
  size: number;
  /**
   * @generated from protobuf field: string sign = 3;
   */
  sign: string;
}
/**
 * @generated from protobuf message AckChunkFinish
 */
export interface AckChunkFinish {
  /**
   * @generated from protobuf field: uint32 index = 1;
   */
  index: number;
  /**
   * @generated from protobuf field: FinishStatus status = 2;
   */
  status: FinishStatus;
}
/**
 * @generated from protobuf enum DataType
 */
export enum DataType {
  /**
   * @generated from protobuf enum value: TEXT = 0;
   */
  TEXT = 0,
  /**
   * @generated from protobuf enum value: FILE = 1;
   */
  FILE = 1,
}
/**
 * @generated from protobuf enum FinishStatus
 */
export enum FinishStatus {
  /**
   * @generated from protobuf enum value: Ok = 0;
   */
  Ok = 0,
  /**
   * @generated from protobuf enum value: Err = 1;
   */
  Err = 1,
}
// @generated message type with reflection information, may provide speed optimized methods
class Plink$Type extends MessageType<Plink> {
  constructor() {
    super('Plink', [
      { no: 1, name: 'version', kind: 'scalar', T: 13 /*ScalarType.UINT32*/ },
      { no: 2, name: 'uuid', kind: 'scalar', T: 9 /*ScalarType.STRING*/ },
      { no: 3, name: 'socketIP', kind: 'scalar', T: 9 /*ScalarType.STRING*/ },
      {
        no: 4,
        name: 'ts',
        kind: 'scalar',
        T: 4 /*ScalarType.UINT64*/,
        L: 0 /*LongType.BIGINT*/,
      },
    ]);
  }
  create(value?: PartialMessage<Plink>): Plink {
    const message = globalThis.Object.create(this.messagePrototype!);
    message.version = 0;
    message.uuid = '';
    message.socketIP = '';
    message.ts = 0n;
    if (value !== undefined)
      reflectionMergePartial<Plink>(this, message, value);
    return message;
  }
  internalBinaryRead(
    reader: IBinaryReader,
    length: number,
    options: BinaryReadOptions,
    target?: Plink,
  ): Plink {
    let message = target ?? this.create(),
      end = reader.pos + length;
    while (reader.pos < end) {
      let [fieldNo, wireType] = reader.tag();
      switch (fieldNo) {
        case /* uint32 version */ 1:
          message.version = reader.uint32();
          break;
        case /* string uuid */ 2:
          message.uuid = reader.string();
          break;
        case /* string socketIP */ 3:
          message.socketIP = reader.string();
          break;
        case /* uint64 ts */ 4:
          message.ts = reader.uint64().toBigInt();
          break;
        default:
          let u = options.readUnknownField;
          if (u === 'throw')
            throw new globalThis.Error(
              `Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`,
            );
          let d = reader.skip(wireType);
          if (u !== false)
            (u === true ? UnknownFieldHandler.onRead : u)(
              this.typeName,
              message,
              fieldNo,
              wireType,
              d,
            );
      }
    }
    return message;
  }
  internalBinaryWrite(
    message: Plink,
    writer: IBinaryWriter,
    options: BinaryWriteOptions,
  ): IBinaryWriter {
    /* uint32 version = 1; */
    if (message.version !== 0)
      writer.tag(1, WireType.Varint).uint32(message.version);
    /* string uuid = 2; */
    if (message.uuid !== '')
      writer.tag(2, WireType.LengthDelimited).string(message.uuid);
    /* string socketIP = 3; */
    if (message.socketIP !== '')
      writer.tag(3, WireType.LengthDelimited).string(message.socketIP);
    /* uint64 ts = 4; */
    if (message.ts !== 0n) writer.tag(4, WireType.Varint).uint64(message.ts);
    let u = options.writeUnknownFields;
    if (u !== false)
      (u == true ? UnknownFieldHandler.onWrite : u)(
        this.typeName,
        message,
        writer,
      );
    return writer;
  }
}
/**
 * @generated MessageType for protobuf message Plink
 */
export const Plink = new Plink$Type();
// @generated message type with reflection information, may provide speed optimized methods
class Channel$Type extends MessageType<Channel> {
  constructor() {
    super('Channel', [
      { no: 1, name: 'version', kind: 'scalar', T: 13 /*ScalarType.UINT32*/ },
      { no: 2, name: 'id', kind: 'scalar', T: 13 /*ScalarType.UINT32*/ },
      {
        no: 3,
        name: 'ts',
        kind: 'scalar',
        T: 4 /*ScalarType.UINT64*/,
        L: 0 /*LongType.BIGINT*/,
      },
      {
        no: 4,
        name: 'connect',
        kind: 'message',
        oneof: 'action',
        T: () => ConnectAction,
      },
      {
        no: 5,
        name: 'disconnect',
        kind: 'message',
        oneof: 'action',
        T: () => DisconnectAction,
      },
      {
        no: 6,
        name: 'data',
        kind: 'message',
        oneof: 'action',
        T: () => DataAction,
      },
      {
        no: 7,
        name: 'sync',
        kind: 'message',
        oneof: 'action',
        T: () => SyncAction,
      },
      {
        no: 8,
        name: 'detect',
        kind: 'message',
        oneof: 'action',
        T: () => DetectSignal,
      },
    ]);
  }
  create(value?: PartialMessage<Channel>): Channel {
    const message = globalThis.Object.create(this.messagePrototype!);
    message.version = 0;
    message.id = 0;
    message.ts = 0n;
    message.action = { oneofKind: undefined };
    if (value !== undefined)
      reflectionMergePartial<Channel>(this, message, value);
    return message;
  }
  internalBinaryRead(
    reader: IBinaryReader,
    length: number,
    options: BinaryReadOptions,
    target?: Channel,
  ): Channel {
    let message = target ?? this.create(),
      end = reader.pos + length;
    while (reader.pos < end) {
      let [fieldNo, wireType] = reader.tag();
      switch (fieldNo) {
        case /* uint32 version */ 1:
          message.version = reader.uint32();
          break;
        case /* uint32 id */ 2:
          message.id = reader.uint32();
          break;
        case /* uint64 ts */ 3:
          message.ts = reader.uint64().toBigInt();
          break;
        case /* ConnectAction connect */ 4:
          message.action = {
            oneofKind: 'connect',
            connect: ConnectAction.internalBinaryRead(
              reader,
              reader.uint32(),
              options,
              (message.action as any).connect,
            ),
          };
          break;
        case /* DisconnectAction disconnect */ 5:
          message.action = {
            oneofKind: 'disconnect',
            disconnect: DisconnectAction.internalBinaryRead(
              reader,
              reader.uint32(),
              options,
              (message.action as any).disconnect,
            ),
          };
          break;
        case /* DataAction data */ 6:
          message.action = {
            oneofKind: 'data',
            data: DataAction.internalBinaryRead(
              reader,
              reader.uint32(),
              options,
              (message.action as any).data,
            ),
          };
          break;
        case /* SyncAction sync */ 7:
          message.action = {
            oneofKind: 'sync',
            sync: SyncAction.internalBinaryRead(
              reader,
              reader.uint32(),
              options,
              (message.action as any).sync,
            ),
          };
          break;
        case /* DetectSignal detect */ 8:
          message.action = {
            oneofKind: 'detect',
            detect: DetectSignal.internalBinaryRead(
              reader,
              reader.uint32(),
              options,
              (message.action as any).detect,
            ),
          };
          break;
        default:
          let u = options.readUnknownField;
          if (u === 'throw')
            throw new globalThis.Error(
              `Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`,
            );
          let d = reader.skip(wireType);
          if (u !== false)
            (u === true ? UnknownFieldHandler.onRead : u)(
              this.typeName,
              message,
              fieldNo,
              wireType,
              d,
            );
      }
    }
    return message;
  }
  internalBinaryWrite(
    message: Channel,
    writer: IBinaryWriter,
    options: BinaryWriteOptions,
  ): IBinaryWriter {
    /* uint32 version = 1; */
    if (message.version !== 0)
      writer.tag(1, WireType.Varint).uint32(message.version);
    /* uint32 id = 2; */
    if (message.id !== 0) writer.tag(2, WireType.Varint).uint32(message.id);
    /* uint64 ts = 3; */
    if (message.ts !== 0n) writer.tag(3, WireType.Varint).uint64(message.ts);
    /* ConnectAction connect = 4; */
    if (message.action.oneofKind === 'connect')
      ConnectAction.internalBinaryWrite(
        message.action.connect,
        writer.tag(4, WireType.LengthDelimited).fork(),
        options,
      ).join();
    /* DisconnectAction disconnect = 5; */
    if (message.action.oneofKind === 'disconnect')
      DisconnectAction.internalBinaryWrite(
        message.action.disconnect,
        writer.tag(5, WireType.LengthDelimited).fork(),
        options,
      ).join();
    /* DataAction data = 6; */
    if (message.action.oneofKind === 'data')
      DataAction.internalBinaryWrite(
        message.action.data,
        writer.tag(6, WireType.LengthDelimited).fork(),
        options,
      ).join();
    /* SyncAction sync = 7; */
    if (message.action.oneofKind === 'sync')
      SyncAction.internalBinaryWrite(
        message.action.sync,
        writer.tag(7, WireType.LengthDelimited).fork(),
        options,
      ).join();
    /* DetectSignal detect = 8; */
    if (message.action.oneofKind === 'detect')
      DetectSignal.internalBinaryWrite(
        message.action.detect,
        writer.tag(8, WireType.LengthDelimited).fork(),
        options,
      ).join();
    let u = options.writeUnknownFields;
    if (u !== false)
      (u == true ? UnknownFieldHandler.onWrite : u)(
        this.typeName,
        message,
        writer,
      );
    return writer;
  }
}
/**
 * @generated MessageType for protobuf message Channel
 */
export const Channel = new Channel$Type();
// @generated message type with reflection information, may provide speed optimized methods
class ConnectAction$Type extends MessageType<ConnectAction> {
  constructor() {
    super('ConnectAction', [
      { no: 1, name: 'seq', kind: 'scalar', T: 13 /*ScalarType.UINT32*/ },
      { no: 2, name: 'ack', kind: 'scalar', T: 13 /*ScalarType.UINT32*/ },
    ]);
  }
  create(value?: PartialMessage<ConnectAction>): ConnectAction {
    const message = globalThis.Object.create(this.messagePrototype!);
    message.seq = 0;
    message.ack = 0;
    if (value !== undefined)
      reflectionMergePartial<ConnectAction>(this, message, value);
    return message;
  }
  internalBinaryRead(
    reader: IBinaryReader,
    length: number,
    options: BinaryReadOptions,
    target?: ConnectAction,
  ): ConnectAction {
    let message = target ?? this.create(),
      end = reader.pos + length;
    while (reader.pos < end) {
      let [fieldNo, wireType] = reader.tag();
      switch (fieldNo) {
        case /* uint32 seq */ 1:
          message.seq = reader.uint32();
          break;
        case /* uint32 ack */ 2:
          message.ack = reader.uint32();
          break;
        default:
          let u = options.readUnknownField;
          if (u === 'throw')
            throw new globalThis.Error(
              `Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`,
            );
          let d = reader.skip(wireType);
          if (u !== false)
            (u === true ? UnknownFieldHandler.onRead : u)(
              this.typeName,
              message,
              fieldNo,
              wireType,
              d,
            );
      }
    }
    return message;
  }
  internalBinaryWrite(
    message: ConnectAction,
    writer: IBinaryWriter,
    options: BinaryWriteOptions,
  ): IBinaryWriter {
    /* uint32 seq = 1; */
    if (message.seq !== 0) writer.tag(1, WireType.Varint).uint32(message.seq);
    /* uint32 ack = 2; */
    if (message.ack !== 0) writer.tag(2, WireType.Varint).uint32(message.ack);
    let u = options.writeUnknownFields;
    if (u !== false)
      (u == true ? UnknownFieldHandler.onWrite : u)(
        this.typeName,
        message,
        writer,
      );
    return writer;
  }
}
/**
 * @generated MessageType for protobuf message ConnectAction
 */
export const ConnectAction = new ConnectAction$Type();
// @generated message type with reflection information, may provide speed optimized methods
class DisconnectAction$Type extends MessageType<DisconnectAction> {
  constructor() {
    super('DisconnectAction', [
      { no: 1, name: 'seq', kind: 'scalar', T: 13 /*ScalarType.UINT32*/ },
      { no: 2, name: 'ack', kind: 'scalar', T: 13 /*ScalarType.UINT32*/ },
    ]);
  }
  create(value?: PartialMessage<DisconnectAction>): DisconnectAction {
    const message = globalThis.Object.create(this.messagePrototype!);
    message.seq = 0;
    message.ack = 0;
    if (value !== undefined)
      reflectionMergePartial<DisconnectAction>(this, message, value);
    return message;
  }
  internalBinaryRead(
    reader: IBinaryReader,
    length: number,
    options: BinaryReadOptions,
    target?: DisconnectAction,
  ): DisconnectAction {
    let message = target ?? this.create(),
      end = reader.pos + length;
    while (reader.pos < end) {
      let [fieldNo, wireType] = reader.tag();
      switch (fieldNo) {
        case /* uint32 seq */ 1:
          message.seq = reader.uint32();
          break;
        case /* uint32 ack */ 2:
          message.ack = reader.uint32();
          break;
        default:
          let u = options.readUnknownField;
          if (u === 'throw')
            throw new globalThis.Error(
              `Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`,
            );
          let d = reader.skip(wireType);
          if (u !== false)
            (u === true ? UnknownFieldHandler.onRead : u)(
              this.typeName,
              message,
              fieldNo,
              wireType,
              d,
            );
      }
    }
    return message;
  }
  internalBinaryWrite(
    message: DisconnectAction,
    writer: IBinaryWriter,
    options: BinaryWriteOptions,
  ): IBinaryWriter {
    /* uint32 seq = 1; */
    if (message.seq !== 0) writer.tag(1, WireType.Varint).uint32(message.seq);
    /* uint32 ack = 2; */
    if (message.ack !== 0) writer.tag(2, WireType.Varint).uint32(message.ack);
    let u = options.writeUnknownFields;
    if (u !== false)
      (u == true ? UnknownFieldHandler.onWrite : u)(
        this.typeName,
        message,
        writer,
      );
    return writer;
  }
}
/**
 * @generated MessageType for protobuf message DisconnectAction
 */
export const DisconnectAction = new DisconnectAction$Type();
// @generated message type with reflection information, may provide speed optimized methods
class DataAction$Type extends MessageType<DataAction> {
  constructor() {
    super('DataAction', [
      { no: 1, name: 'id', kind: 'scalar', T: 13 /*ScalarType.UINT32*/ },
      { no: 2, name: 'index', kind: 'scalar', T: 13 /*ScalarType.UINT32*/ },
      { no: 3, name: 'body', kind: 'scalar', T: 12 /*ScalarType.BYTES*/ },
    ]);
  }
  create(value?: PartialMessage<DataAction>): DataAction {
    const message = globalThis.Object.create(this.messagePrototype!);
    message.id = 0;
    message.index = 0;
    message.body = new Uint8Array(0);
    if (value !== undefined)
      reflectionMergePartial<DataAction>(this, message, value);
    return message;
  }
  internalBinaryRead(
    reader: IBinaryReader,
    length: number,
    options: BinaryReadOptions,
    target?: DataAction,
  ): DataAction {
    let message = target ?? this.create(),
      end = reader.pos + length;
    while (reader.pos < end) {
      let [fieldNo, wireType] = reader.tag();
      switch (fieldNo) {
        case /* uint32 id */ 1:
          message.id = reader.uint32();
          break;
        case /* uint32 index */ 2:
          message.index = reader.uint32();
          break;
        case /* bytes body */ 3:
          message.body = reader.bytes();
          break;
        default:
          let u = options.readUnknownField;
          if (u === 'throw')
            throw new globalThis.Error(
              `Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`,
            );
          let d = reader.skip(wireType);
          if (u !== false)
            (u === true ? UnknownFieldHandler.onRead : u)(
              this.typeName,
              message,
              fieldNo,
              wireType,
              d,
            );
      }
    }
    return message;
  }
  internalBinaryWrite(
    message: DataAction,
    writer: IBinaryWriter,
    options: BinaryWriteOptions,
  ): IBinaryWriter {
    /* uint32 id = 1; */
    if (message.id !== 0) writer.tag(1, WireType.Varint).uint32(message.id);
    /* uint32 index = 2; */
    if (message.index !== 0)
      writer.tag(2, WireType.Varint).uint32(message.index);
    /* bytes body = 3; */
    if (message.body.length)
      writer.tag(3, WireType.LengthDelimited).bytes(message.body);
    let u = options.writeUnknownFields;
    if (u !== false)
      (u == true ? UnknownFieldHandler.onWrite : u)(
        this.typeName,
        message,
        writer,
      );
    return writer;
  }
}
/**
 * @generated MessageType for protobuf message DataAction
 */
export const DataAction = new DataAction$Type();
// @generated message type with reflection information, may provide speed optimized methods
class SyncAction$Type extends MessageType<SyncAction> {
  constructor() {
    super('SyncAction', [
      { no: 1, name: 'id', kind: 'scalar', T: 13 /*ScalarType.UINT32*/ },
      {
        no: 2,
        name: 'synReady',
        kind: 'message',
        oneof: 'signal',
        T: () => SynReadySignal,
      },
      {
        no: 3,
        name: 'ackReady',
        kind: 'message',
        oneof: 'signal',
        T: () => AckReadySignal,
      },
      {
        no: 4,
        name: 'ackChunkFinish',
        kind: 'message',
        oneof: 'signal',
        T: () => AckChunkFinish,
      },
    ]);
  }
  create(value?: PartialMessage<SyncAction>): SyncAction {
    const message = globalThis.Object.create(this.messagePrototype!);
    message.id = 0;
    message.signal = { oneofKind: undefined };
    if (value !== undefined)
      reflectionMergePartial<SyncAction>(this, message, value);
    return message;
  }
  internalBinaryRead(
    reader: IBinaryReader,
    length: number,
    options: BinaryReadOptions,
    target?: SyncAction,
  ): SyncAction {
    let message = target ?? this.create(),
      end = reader.pos + length;
    while (reader.pos < end) {
      let [fieldNo, wireType] = reader.tag();
      switch (fieldNo) {
        case /* uint32 id */ 1:
          message.id = reader.uint32();
          break;
        case /* SynReadySignal synReady */ 2:
          message.signal = {
            oneofKind: 'synReady',
            synReady: SynReadySignal.internalBinaryRead(
              reader,
              reader.uint32(),
              options,
              (message.signal as any).synReady,
            ),
          };
          break;
        case /* AckReadySignal ackReady */ 3:
          message.signal = {
            oneofKind: 'ackReady',
            ackReady: AckReadySignal.internalBinaryRead(
              reader,
              reader.uint32(),
              options,
              (message.signal as any).ackReady,
            ),
          };
          break;
        case /* AckChunkFinish ackChunkFinish */ 4:
          message.signal = {
            oneofKind: 'ackChunkFinish',
            ackChunkFinish: AckChunkFinish.internalBinaryRead(
              reader,
              reader.uint32(),
              options,
              (message.signal as any).ackChunkFinish,
            ),
          };
          break;
        default:
          let u = options.readUnknownField;
          if (u === 'throw')
            throw new globalThis.Error(
              `Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`,
            );
          let d = reader.skip(wireType);
          if (u !== false)
            (u === true ? UnknownFieldHandler.onRead : u)(
              this.typeName,
              message,
              fieldNo,
              wireType,
              d,
            );
      }
    }
    return message;
  }
  internalBinaryWrite(
    message: SyncAction,
    writer: IBinaryWriter,
    options: BinaryWriteOptions,
  ): IBinaryWriter {
    /* uint32 id = 1; */
    if (message.id !== 0) writer.tag(1, WireType.Varint).uint32(message.id);
    /* SynReadySignal synReady = 2; */
    if (message.signal.oneofKind === 'synReady')
      SynReadySignal.internalBinaryWrite(
        message.signal.synReady,
        writer.tag(2, WireType.LengthDelimited).fork(),
        options,
      ).join();
    /* AckReadySignal ackReady = 3; */
    if (message.signal.oneofKind === 'ackReady')
      AckReadySignal.internalBinaryWrite(
        message.signal.ackReady,
        writer.tag(3, WireType.LengthDelimited).fork(),
        options,
      ).join();
    /* AckChunkFinish ackChunkFinish = 4; */
    if (message.signal.oneofKind === 'ackChunkFinish')
      AckChunkFinish.internalBinaryWrite(
        message.signal.ackChunkFinish,
        writer.tag(4, WireType.LengthDelimited).fork(),
        options,
      ).join();
    let u = options.writeUnknownFields;
    if (u !== false)
      (u == true ? UnknownFieldHandler.onWrite : u)(
        this.typeName,
        message,
        writer,
      );
    return writer;
  }
}
/**
 * @generated MessageType for protobuf message SyncAction
 */
export const SyncAction = new SyncAction$Type();
// @generated message type with reflection information, may provide speed optimized methods
class DetectSignal$Type extends MessageType<DetectSignal> {
  constructor() {
    super('DetectSignal', [
      { no: 1, name: 'rtt', kind: 'scalar', T: 13 /*ScalarType.UINT32*/ },
      { no: 2, name: 'seq', kind: 'scalar', T: 13 /*ScalarType.UINT32*/ },
    ]);
  }
  create(value?: PartialMessage<DetectSignal>): DetectSignal {
    const message = globalThis.Object.create(this.messagePrototype!);
    message.rtt = 0;
    message.seq = 0;
    if (value !== undefined)
      reflectionMergePartial<DetectSignal>(this, message, value);
    return message;
  }
  internalBinaryRead(
    reader: IBinaryReader,
    length: number,
    options: BinaryReadOptions,
    target?: DetectSignal,
  ): DetectSignal {
    let message = target ?? this.create(),
      end = reader.pos + length;
    while (reader.pos < end) {
      let [fieldNo, wireType] = reader.tag();
      switch (fieldNo) {
        case /* uint32 rtt */ 1:
          message.rtt = reader.uint32();
          break;
        case /* uint32 seq */ 2:
          message.seq = reader.uint32();
          break;
        default:
          let u = options.readUnknownField;
          if (u === 'throw')
            throw new globalThis.Error(
              `Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`,
            );
          let d = reader.skip(wireType);
          if (u !== false)
            (u === true ? UnknownFieldHandler.onRead : u)(
              this.typeName,
              message,
              fieldNo,
              wireType,
              d,
            );
      }
    }
    return message;
  }
  internalBinaryWrite(
    message: DetectSignal,
    writer: IBinaryWriter,
    options: BinaryWriteOptions,
  ): IBinaryWriter {
    /* uint32 rtt = 1; */
    if (message.rtt !== 0) writer.tag(1, WireType.Varint).uint32(message.rtt);
    /* uint32 seq = 2; */
    if (message.seq !== 0) writer.tag(2, WireType.Varint).uint32(message.seq);
    let u = options.writeUnknownFields;
    if (u !== false)
      (u == true ? UnknownFieldHandler.onWrite : u)(
        this.typeName,
        message,
        writer,
      );
    return writer;
  }
}
/**
 * @generated MessageType for protobuf message DetectSignal
 */
export const DetectSignal = new DetectSignal$Type();
// @generated message type with reflection information, may provide speed optimized methods
class SynReadySignal$Type extends MessageType<SynReadySignal> {
  constructor() {
    super('SynReadySignal', [
      { no: 1, name: 'length', kind: 'scalar', T: 13 /*ScalarType.UINT32*/ },
      { no: 2, name: 'size', kind: 'scalar', T: 13 /*ScalarType.UINT32*/ },
      { no: 3, name: 'sign', kind: 'scalar', T: 9 /*ScalarType.STRING*/ },
      { no: 4, name: 'name', kind: 'scalar', T: 9 /*ScalarType.STRING*/ },
      { no: 5, name: 'type', kind: 'enum', T: () => ['DataType', DataType] },
    ]);
  }
  create(value?: PartialMessage<SynReadySignal>): SynReadySignal {
    const message = globalThis.Object.create(this.messagePrototype!);
    message.length = 0;
    message.size = 0;
    message.sign = '';
    message.name = '';
    message.type = 0;
    if (value !== undefined)
      reflectionMergePartial<SynReadySignal>(this, message, value);
    return message;
  }
  internalBinaryRead(
    reader: IBinaryReader,
    length: number,
    options: BinaryReadOptions,
    target?: SynReadySignal,
  ): SynReadySignal {
    let message = target ?? this.create(),
      end = reader.pos + length;
    while (reader.pos < end) {
      let [fieldNo, wireType] = reader.tag();
      switch (fieldNo) {
        case /* uint32 length */ 1:
          message.length = reader.uint32();
          break;
        case /* uint32 size */ 2:
          message.size = reader.uint32();
          break;
        case /* string sign */ 3:
          message.sign = reader.string();
          break;
        case /* string name */ 4:
          message.name = reader.string();
          break;
        case /* DataType type */ 5:
          message.type = reader.int32();
          break;
        default:
          let u = options.readUnknownField;
          if (u === 'throw')
            throw new globalThis.Error(
              `Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`,
            );
          let d = reader.skip(wireType);
          if (u !== false)
            (u === true ? UnknownFieldHandler.onRead : u)(
              this.typeName,
              message,
              fieldNo,
              wireType,
              d,
            );
      }
    }
    return message;
  }
  internalBinaryWrite(
    message: SynReadySignal,
    writer: IBinaryWriter,
    options: BinaryWriteOptions,
  ): IBinaryWriter {
    /* uint32 length = 1; */
    if (message.length !== 0)
      writer.tag(1, WireType.Varint).uint32(message.length);
    /* uint32 size = 2; */
    if (message.size !== 0) writer.tag(2, WireType.Varint).uint32(message.size);
    /* string sign = 3; */
    if (message.sign !== '')
      writer.tag(3, WireType.LengthDelimited).string(message.sign);
    /* string name = 4; */
    if (message.name !== '')
      writer.tag(4, WireType.LengthDelimited).string(message.name);
    /* DataType type = 5; */
    if (message.type !== 0) writer.tag(5, WireType.Varint).int32(message.type);
    let u = options.writeUnknownFields;
    if (u !== false)
      (u == true ? UnknownFieldHandler.onWrite : u)(
        this.typeName,
        message,
        writer,
      );
    return writer;
  }
}
/**
 * @generated MessageType for protobuf message SynReadySignal
 */
export const SynReadySignal = new SynReadySignal$Type();
// @generated message type with reflection information, may provide speed optimized methods
class AckReadySignal$Type extends MessageType<AckReadySignal> {
  constructor() {
    super('AckReadySignal', [
      { no: 1, name: 'length', kind: 'scalar', T: 13 /*ScalarType.UINT32*/ },
      { no: 2, name: 'size', kind: 'scalar', T: 13 /*ScalarType.UINT32*/ },
      { no: 3, name: 'sign', kind: 'scalar', T: 9 /*ScalarType.STRING*/ },
    ]);
  }
  create(value?: PartialMessage<AckReadySignal>): AckReadySignal {
    const message = globalThis.Object.create(this.messagePrototype!);
    message.length = 0;
    message.size = 0;
    message.sign = '';
    if (value !== undefined)
      reflectionMergePartial<AckReadySignal>(this, message, value);
    return message;
  }
  internalBinaryRead(
    reader: IBinaryReader,
    length: number,
    options: BinaryReadOptions,
    target?: AckReadySignal,
  ): AckReadySignal {
    let message = target ?? this.create(),
      end = reader.pos + length;
    while (reader.pos < end) {
      let [fieldNo, wireType] = reader.tag();
      switch (fieldNo) {
        case /* uint32 length */ 1:
          message.length = reader.uint32();
          break;
        case /* uint32 size */ 2:
          message.size = reader.uint32();
          break;
        case /* string sign */ 3:
          message.sign = reader.string();
          break;
        default:
          let u = options.readUnknownField;
          if (u === 'throw')
            throw new globalThis.Error(
              `Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`,
            );
          let d = reader.skip(wireType);
          if (u !== false)
            (u === true ? UnknownFieldHandler.onRead : u)(
              this.typeName,
              message,
              fieldNo,
              wireType,
              d,
            );
      }
    }
    return message;
  }
  internalBinaryWrite(
    message: AckReadySignal,
    writer: IBinaryWriter,
    options: BinaryWriteOptions,
  ): IBinaryWriter {
    /* uint32 length = 1; */
    if (message.length !== 0)
      writer.tag(1, WireType.Varint).uint32(message.length);
    /* uint32 size = 2; */
    if (message.size !== 0) writer.tag(2, WireType.Varint).uint32(message.size);
    /* string sign = 3; */
    if (message.sign !== '')
      writer.tag(3, WireType.LengthDelimited).string(message.sign);
    let u = options.writeUnknownFields;
    if (u !== false)
      (u == true ? UnknownFieldHandler.onWrite : u)(
        this.typeName,
        message,
        writer,
      );
    return writer;
  }
}
/**
 * @generated MessageType for protobuf message AckReadySignal
 */
export const AckReadySignal = new AckReadySignal$Type();
// @generated message type with reflection information, may provide speed optimized methods
class AckChunkFinish$Type extends MessageType<AckChunkFinish> {
  constructor() {
    super('AckChunkFinish', [
      { no: 1, name: 'index', kind: 'scalar', T: 13 /*ScalarType.UINT32*/ },
      {
        no: 2,
        name: 'status',
        kind: 'enum',
        T: () => ['FinishStatus', FinishStatus],
      },
    ]);
  }
  create(value?: PartialMessage<AckChunkFinish>): AckChunkFinish {
    const message = globalThis.Object.create(this.messagePrototype!);
    message.index = 0;
    message.status = 0;
    if (value !== undefined)
      reflectionMergePartial<AckChunkFinish>(this, message, value);
    return message;
  }
  internalBinaryRead(
    reader: IBinaryReader,
    length: number,
    options: BinaryReadOptions,
    target?: AckChunkFinish,
  ): AckChunkFinish {
    let message = target ?? this.create(),
      end = reader.pos + length;
    while (reader.pos < end) {
      let [fieldNo, wireType] = reader.tag();
      switch (fieldNo) {
        case /* uint32 index */ 1:
          message.index = reader.uint32();
          break;
        case /* FinishStatus status */ 2:
          message.status = reader.int32();
          break;
        default:
          let u = options.readUnknownField;
          if (u === 'throw')
            throw new globalThis.Error(
              `Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`,
            );
          let d = reader.skip(wireType);
          if (u !== false)
            (u === true ? UnknownFieldHandler.onRead : u)(
              this.typeName,
              message,
              fieldNo,
              wireType,
              d,
            );
      }
    }
    return message;
  }
  internalBinaryWrite(
    message: AckChunkFinish,
    writer: IBinaryWriter,
    options: BinaryWriteOptions,
  ): IBinaryWriter {
    /* uint32 index = 1; */
    if (message.index !== 0)
      writer.tag(1, WireType.Varint).uint32(message.index);
    /* FinishStatus status = 2; */
    if (message.status !== 0)
      writer.tag(2, WireType.Varint).int32(message.status);
    let u = options.writeUnknownFields;
    if (u !== false)
      (u == true ? UnknownFieldHandler.onWrite : u)(
        this.typeName,
        message,
        writer,
      );
    return writer;
  }
}
/**
 * @generated MessageType for protobuf message AckChunkFinish
 */
export const AckChunkFinish = new AckChunkFinish$Type();
