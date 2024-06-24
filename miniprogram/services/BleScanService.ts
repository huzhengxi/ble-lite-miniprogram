import { bleScanStore } from "../mobx/ble-scan-store";
import helper from "./helper";
import { parseMAC, uint8Array2hexString, permissionTip } from "../utils/util";

export default class BleScanService {
  logType = "蓝牙模块>>";
  scanTimeout: number | null = null;
  // 默认过滤方法
  private defaultFilter: IDeviceFilter = () => true;
  // 自定义过滤方法
  private customFilter: IDeviceFilter = this.defaultFilter;

  onBluetoothDeviceFound: WechatMiniprogram.OnBluetoothDeviceFoundCallback = ({
    devices,
  }) => {
    const parseDevices = devices
      .filter(this.customFilter)
      .map(parseBroadcastData);
    if (parseDevices.length > 0) {
      bleScanStore.addDevices(parseDevices);
    }
  };

  constructor() {
    this.init();
  }

  private async init() {}

  /**
   * 开始扫描
   */
  async startScan(filter: IDeviceFilter = this.defaultFilter) {
    this.customFilter = filter;
    helper.log(this.logType, "开始扫描");
    if (this.scanTimeout) {
      clearTimeout(this.scanTimeout);
      this.scanTimeout = null;
    }
    this.scanTimeout = setTimeout(
      () => {
        this.stopScan();
      },
      20000,
      null
    );
    bleScanStore.startScan();

    const systemInfo = wx.getSystemInfoSync();
    if (systemInfo.platform === "devtools") {
      return;
    }
    const tipContent = permissionTip();
    try {
      // 屏幕常亮
      await wx.setKeepScreenOn({
        keepScreenOn: true,
      });
      // 初始化蓝牙模块
      await wx.openBluetoothAdapter({
        mode: "central",
      });

      // 获取蓝牙状态
      const { available, discovering } = await wx.getBluetoothAdapterState();
      helper.log(this.logType, available);

      if (!available) {
        helper.log(this.logType, "蓝牙未打开");
        await wx.showModal({
          content: "请打开蓝牙后再扫描设备！",
          showCancel: false,
        });
        return;
      }

      if (discovering) {
        helper.log(this.logType, "正在扫描，直接返回");
        return;
      }

      wx.onBluetoothDeviceFound(this.onBluetoothDeviceFound);

      await wx.startBluetoothDevicesDiscovery({
        interval: 50,
        powerLevel: "high",
        allowDuplicatesKey: true,
        // services: ["0000FDCD-0000-1000-8000-00805F9B34FB"],
      });
    } catch (error) {
      // @ts-ignore
      if ([10000, 10001].includes(error.errCode)) {
        wx.showModal({
          title: "",
          content: tipContent,
          showCancel: false,
          confirmText: "知道了",
        });
      }
      helper.log(this.logType, "扫描蓝牙错误：", error);
    }
  }

  async stopScan() {
    if (this.scanTimeout) {
      clearTimeout(this.scanTimeout);
      this.scanTimeout = null;
    }
    bleScanStore.stopScan();
    helper.log(this.logType, "停止扫描");
    // 取消屏幕常亮
    await wx.setKeepScreenOn({
      keepScreenOn: false,
    });

    // 停止搜寻附近的蓝牙外围设备。若已经找到需要的蓝牙设备并不需要继续搜索时，建议调用该接口停止蓝牙搜索。
    await wx.stopBluetoothDevicesDiscovery();

    // 移除搜索到新设备的事件的全部监听函数
    await wx.offBluetoothDeviceFound();
  }
}

export function RSSI2Level(RSSI: number) {
  if (RSSI <= -91) {
    return 0;
  } else if (RSSI <= -81) {
    return 1;
  } else if (RSSI <= -71) {
    return 2;
  } else if (RSSI <= -51) {
    return 3;
  } else {
    return 4;
  }
}
/**
 * 解析广播数据
 * @param
 * @return {} 广播数据
 */
export function parseBroadcastData(
  bleDevice: IBlueToothDevice
): IBLEDeviceData {
  const { serviceData = {}, name, localName, RSSI, deviceId } = bleDevice;
  const rssiLevel = RSSI2Level(RSSI);
  let broadcastData = "";
  // serviceData中数据的key都转为大写,value 为 ArrayBuffer 类型
  const newServiceData = Object.keys(serviceData).reduce((acc, key) => {
    const value = serviceData[key];
    let hexString = uint8Array2hexString(new Uint8Array(value));
    broadcastData = `${
      broadcastData.length === 0
    } ? ${key}: ${hexString} : ${broadcastData} , ${key}: ${hexString}`;
    acc[key.toUpperCase()] = value;
    return acc;
  }, {} as Record<string, ArrayBuffer>);

  return {
    deviceId,
    name: name || localName,
    rssiLevel,
    rssi: RSSI,
    rawData: bleDevice,
    broadcastData,
    serviceData: newServiceData,
  };
}
