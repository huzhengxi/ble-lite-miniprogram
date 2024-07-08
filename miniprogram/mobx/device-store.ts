/*
 * Created by Tiger on 30/12/2023
 * mobx 设备操作相关 store
 */
import { BleDeviceService } from "../services/BleDeviceService";
import { observable, action } from "mobx-miniprogram";

interface IDeviceStore {
  // 数据字段
  currentDevice?: BleDeviceService;

  // computed

  // actions
  setCurrentDevice: (device: BleDeviceService) => void;
  getCurrentDevice: () => BleDeviceService | undefined;
}

export const deviceStore: IDeviceStore = observable({
  // 数据字段
  currentDevice: undefined,

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
});
