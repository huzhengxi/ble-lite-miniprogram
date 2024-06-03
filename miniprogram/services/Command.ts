import { uint8Array2hexString } from "../utils/util";
import BleConnection from "./BleConnection";

export enum CommandType {
  READ,
  READ_DESCRIPTOR,
  WRITE,
  WRITE_NO_RESPONSE,
  WRITE_DESCRIPTOR,
  ENABLE_NOTIFY,
  DISABLE_NOTIFY,
  REQUEST_MTU,
}
export class Command {
  serviceUUID?: string;
  characteristicUUID?: string;
  notifyServiceUUID?: string;
  notifyCharacteristicUUID?: string;
  descriptorUUID?: string;
  type!: CommandType;
  data?: ArrayBuffer;
  tag?: any;
  delay?: number;
  mtu?: number;

  constructor(
    serviceUUID?: string,
    characteristicUUID?: string,
    type: CommandType = CommandType.WRITE,
    data?: ArrayBuffer,
    tag?: any
  ) {
    this.serviceUUID = serviceUUID;
    this.characteristicUUID = characteristicUUID;
    this.type = type;
    this.data = data;
    this.tag = tag;
  }

  public clear() {
    this.serviceUUID = undefined;
    this.characteristicUUID = undefined;
    this.type = CommandType.WRITE;
    this.data = undefined;
    this.descriptorUUID = undefined;
  }

  public toString(): string {
    const data = new Uint8Array(this.data!);
    return `Command: serviceUUID=${this.serviceUUID}, characteristicUUID=${
      this.characteristicUUID
    }, descriptorUUID=${this.descriptorUUID}, type=${
      this.type
    }, data=${uint8Array2hexString(data)}`;
  }
}

export interface CommandCallback {
  success: (peripheral: BleConnection, command: Command, obj: any) => void;
  error: (
    peripheral: BleConnection,
    command: Command,
    errorMsg: string
  ) => void;
  timeout: (peripheral: BleConnection, command: Command) => boolean;
}
