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
  version: number; // 2 Byte
  /**
   * @generated from protobuf field: string uuid = 2;
   */
  uuid: string; // 36 Byte offset 2
  /**
   * @generated from protobuf field: string inip = 3;
   */
  inip: string; // 32 Byte offset 38
  /**
   * @generated from protobuf field: uint64 ts = 4;
   */
  ts: bigint; // 8 Byte offset 70
}
// @generated message type with reflection information, may provide speed optimized methods
class Plink$Type extends MessageType {
  constructor() {
    super('Plink', [
      { no: 1, name: 'version', kind: 'scalar', T: 13 /*ScalarType.UINT32*/ },
      { no: 2, name: 'uuid', kind: 'scalar', T: 9 /*ScalarType.STRING*/ },
      { no: 3, name: 'inip', kind: 'scalar', T: 9 /*ScalarType.STRING*/ },
      {
        no: 4,
        name: 'ts',
        kind: 'scalar',
        T: 4 /*ScalarType.UINT64*/,
        L: 0 /*LongType.BIGINT*/,
      },
    ]);
  }
  create(value?: PartialMessage): Plink {
    const message = globalThis.Object.create(this.messagePrototype!);
    message.version = 0;
    message.uuid = '';
    message.inip = '';
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
        case /* string inip */ 3:
          message.inip = reader.string();
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
    /* string inip = 3; */
    if (message.inip !== '')
      writer.tag(3, WireType.LengthDelimited).string(message.inip);
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
