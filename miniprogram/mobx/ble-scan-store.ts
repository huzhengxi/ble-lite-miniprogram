/*
 * Created by Tiger on 08/12/2023
 * mobx 蓝牙扫描相关功能 store
 */

import { observable, action } from "mobx-miniprogram";
import { generateFakeBLEDeviceList } from "../utils/fake";
import {
  mac2Colon,
  otherDevicesSort,
  parseMAC,
  uint8Array2hexString,
  usefulDevicesSort,
} from "../utils/util";

export const bleScanStore: IBleScanStore = observable({
  // 数据字段
  deviceList: [] as IBLEDeviceData[],
  // 保存设备上一次搜索到的时间Map，key为mac value为时间戳
  lastScanTimeMap: new Map<string, number>(),
  deviceFilter: {
    rssi: -100,
    name: "",
    broadcastData: "",
    unconnectableSwitch: false,
    unnamedSwitch: false,
    noDataSwitch: false,
  } as IBleBroadcastFilter,
  scanning: false,

  // 计算属性
  get devices() {
    if (this.deviceList.length === 0) {
      this.deviceList = generateFakeBLEDeviceList();
    }

    const {
      name = "",
      rssi = -100,
      broadcastData = "",
      noDataSwitch,
      unnamedSwitch,
      unconnectableSwitch,
    } = this.deviceFilter;

    return this.deviceList.filter(
      ({
        name: newName = "",
        rssi: newRssi = -100,
        broadcastData: newBroadcastData = "",
        rawData,
      }: IBLEDeviceData) => {
        if (unnamedSwitch && newName === "") {
          return false;
        }

        if (unconnectableSwitch && !rawData?.connectable) {
          return false;
        }

        if (noDataSwitch && newBroadcastData === "") {
          return false;
        }

        if (!newName.toUpperCase().includes(name.toUpperCase())) return false;
        if (newRssi < rssi) return false;
        if (
          !newBroadcastData.toUpperCase().includes(broadcastData.toUpperCase())
        )
          return false;
        return true;
      }
    );
  },
  get luckinDevices() {
    return this.deviceList
      .filter(({ scanInterval = 1000 }: IBLEDeviceData) => scanInterval < 900)
      .map((device: IBLEDeviceData) => {
        const newDevice = { ...device };
        const serviceData =
          device.rawData?.serviceData?.[
            "0000FDCD-0000-1000-8000-00805F9B34FB"
          ] ||
          device.rawData?.serviceData?.["0000fdcd-0000-1000-8000-00805f9b34fb"];
        const hexData = uint8Array2hexString(new Uint8Array(serviceData));
        const mac = mac2Colon(parseMAC(hexData.substring(8, 20))) || "";
        newDevice.mac = mac;
        return newDevice;
      });
  },

  get deviceFilterToString() {
    const { name = "", rssi, broadcastData = "" } = this.deviceFilter;

    const addSplit = (str: string) => {
      return str === "" ? str : `${str}, `;
    };
    // 组装，如果有值就显示，没有就不显示
    let str = "";

    if (name) str = `${addSplit(str)}广播名称:${name}`;
    if (rssi) str = `${addSplit(str)}信号强度:${rssi}`;
    if (broadcastData) str = `${addSplit(str)}广播内容:${broadcastData}`;
    return str;
  },

  getAllDevices: function (this: typeof bleScanStore) {
    return this.deviceList;
  },
  // actions
  addDevices: action(function (
    this: typeof bleScanStore,
    devices: IBLEDeviceData[]
  ) {
    // 可能有用的设备
    const usefulDevices = devices.filter(
      (device) => !!device.name && device.connectable
    );
    // 剩下的设备
    const otherDevices = devices.filter(
      (device) => !usefulDevices.includes(device)
    );

    this.deviceList = [
      ...usefulDevices.sort(usefulDevicesSort),
      ...otherDevices.sort(otherDevicesSort),
    ];
  }),
  clearDevices: action(function (this: typeof bleScanStore) {
    this.deviceList = [];
    this.lastScanTimeMap.clear();
  }),

  updateDeviceFilter: action(function (
    this: typeof bleScanStore,
    filter: IBleBroadcastFilter
  ) {
    this.deviceFilter = { ...this.deviceFilter, ...filter };
  }),

  startScan: action(function (this: typeof bleScanStore) {
    this.clearDevices();
    this.scanning = true;
  }),

  stopScan: action(function (this: typeof bleScanStore) {
    this.scanning = false;
  }),
});
