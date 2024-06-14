/*
 * Created by Tiger on 08/12/2023
 * mobx 蓝牙扫描相关功能 store
 */

import { observable, action } from "mobx-miniprogram";
import { generateFakeBLEDeviceList } from "../utils/fake";

export const bleScanStore: IBleScanStore = observable({
  // 数据字段
  deviceList: [] as IBLEDeviceData[],
  // 保存设备上一次搜索到的时间Map，key为mac value为时间戳
  lastScanTimeMap: new Map<string, number>(),
  deviceFilter: {
    mac: "",
    name: "",
    productIds: [],
    productName: "全部产品",
  } as IBleBroadcastFilter,
  scanning: false,

  // 计算属性
  get devices() {
    if (this.deviceList.length === 0) {
      this.deviceList = generateFakeBLEDeviceList();
    }
    return this.deviceList.filter((device: IBLEDeviceData) => {
      const { name = "", rssi = -100, broadcastData = "" } = this.deviceFilter;
      // if (!device.name.includes(name)) return false;
      // if (device.rssi < rssi) return false;
      // if (!device.broadcastData.includes(broadcastData)) return false;
      return true;
    });
  },
  get luckinDevices() {
    return this.deviceList.filter(
      ({ scanInterval = 1000 }: IBLEDeviceData) => scanInterval < 500
    );
  },

  get deviceFilterToString() {
    const {
      name = "",
      rssi,
      mac = "",
      broadcastData = "",
      productName,
    } = this.deviceFilter;

    const addSplit = (str: string) => {
      return str === "" ? str : `${str}, `;
    };
    // 组装，如果有值就显示，没有就不显示
    let str = "";

    if (productName !== "") str = `${addSplit(str)}产品:${productName}`;
    if (name) str = `${addSplit(str)}广播名称:${name}`;
    if (rssi) str = `${addSplit(str)}信号强度:${rssi}`;
    if (mac) str = `${addSplit(str)}MAC:${mac}`;
    return str;
  },

  // actions
  addDevices: action(function (
    this: typeof bleScanStore,
    devices: IBLEDeviceData[]
  ) {
    devices.forEach((device) => {
      // 如果没有找到就添加，找到了就更新
      const lastScanTime = this.lastScanTimeMap.get(device.deviceId) || 0;
      const currentScanTime = Date.now();
      this.lastScanTimeMap.set(device.deviceId, Date.now());
      // 扫描间隔
      device.scanInterval = currentScanTime - lastScanTime;

      const index = this.deviceList.findIndex(
        (item) => item.deviceId === device.deviceId
      );

      if (index === -1) {
        this.deviceList = [...this.deviceList, device];
      } else {
        this.deviceList[index] = device;
      }
    });
    this.deviceList = [...this.deviceList.sort((a, b) => b.rssi - a.rssi)];
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
