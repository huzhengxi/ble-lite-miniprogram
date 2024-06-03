/*
 * Created by Tiger on 30/12/2023
 * mobx 设备操作相关 store
 */
import { observable, action } from "mobx-miniprogram";

export const deviceStore: IDeviceStore = observable({
  // 数据字段
  deviceValueItems: new Map([
    [
      "version",
      {
        label: "版本号",
        id: "version",
        status: "idle",
        value: 0,
      },
    ],
    [
      "broadcastInterval",
      {
        label: "广播间隔",
        id: "broadcastInterval",
        status: "idle",
        value: 0,
      },
    ],
    [
      "broadcastPower",
      {
        label: "广播功率",
        id: "broadcastPower",
        status: "idle",
        value: 0,
      },
    ],
    [
      "broadcastChannel",
      {
        label: "广播信道",
        id: "broadcastChannel",
        status: "idle",
        value: 0,
      },
    ],
  ]) as Map<string, IDeviceValueItem>,

  // computed
  get deviceValueItemsArray() {
    return Array.from(this.deviceValueItems.values()) as IDeviceValueItem[];
  },

  // actions
  setCurrentDevice: action(function (
    this: IDeviceStore,
    device: IBLEDeviceData
  ) {
    this.currentDevice = device;
  }),

  setCurrentFirmware: action(function (
    this: IDeviceStore,
    firmware: IFirmware
  ) {
    this.currentFirmware = firmware;
  }),

  setCurrentBleConnection: action(function (
    this: IDeviceStore,
    bleConnection: any
  ) {
    this.currentBleConnection = bleConnection;
  }),

  getDeviceValues: action(async function (this: IDeviceStore) {
    const versionValueItem = this.deviceValueItems.get("version");
    if (versionValueItem) {
      versionValueItem.value = "1.1.1";
      versionValueItem.label = "hello";
      versionValueItem.status = "loading";
      this.deviceValueItems.set("version", versionValueItem);
    }
  }),
});
