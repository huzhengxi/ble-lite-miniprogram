/*
 * Created by Tiger on 30/12/2023
 * mobx 设备操作相关 store
 */
import { BleDeviceService } from "../services/BleDeviceService";
import { observable, action } from "mobx-miniprogram";

interface IDeviceStore {
  // 数据字段
  currentDevice?: BleDeviceService;
  currentCharacteristic?: ICharacteristic;
  connected: boolean

  // computed

  // actions
  setCurrentDevice: (device: BleDeviceService) => void;
  getCurrentDevice: () => BleDeviceService | undefined;

  setCurrentCharacteristic: (characteristic: ICharacteristic) => void;
  getCurrentCharacteristic: () => ICharacteristic | undefined;

  setConnected: (connected: boolean) => void
}

export const deviceStore: IDeviceStore = observable({
  // 数据字段
  connected: false,

  // computed

  // actions
  setCurrentDevice: action(function (
    this: IDeviceStore,
    device: BleDeviceService
  ) {
    this.currentDevice = device;
  }),

  getCurrentDevice: action(function (this: IDeviceStore) {
    return this.currentDevice;
  }),

  setCurrentCharacteristic: action(function (
    this: IDeviceStore,
    characteristic: ICharacteristic
  ) {
    this.currentCharacteristic = characteristic;
  }),
  getCurrentCharacteristic: action(function (this: IDeviceStore) {
    return this.currentCharacteristic;
  }),

  setConnected: action(function (this: IDeviceStore, status: boolean) {
    this.connected = status
  })
});
