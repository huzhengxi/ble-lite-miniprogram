/// <reference path="./types/index.d.ts" />

interface IAppOption {
  globalData: {
    userInfo?: WechatMiniprogram.UserInfo;
  };
  userInfoReadyCallback?: WechatMiniprogram.GetUserInfoSuccessCallback;
}

type IBlueToothDevice = WechatMiniprogram.BlueToothDevice;

interface IBLEDeviceData {
  deviceId: string;
  // 设备名称
  name: string;
  // 设备信号强度
  rssi: number;
  // 设备信号强度等级(RSSI转换得到一个0~5的数字)
  rssiLevel: number;
  // 设备 MAC 地址
  mac: string;
  // 电池电量
  battery?: number;
  // 是否是绑定包
  isBind: boolean;

  // productID
  productID: number;
  // 原始数据
  rawData?: IBlueToothDevice;
  // 广播数据
  broadcastData: string;
}

// 广播过滤条件
interface IBleBroadcastFilter {
  // 设备名称
  name?: string;
  // 设备信号强度
  rssi?: number;
  // 设备 MAC 地址
  mac?: string;
  // 电池电量
  battery?: number;
  // productID
  productID?: number;
  // 广播数据
  broadcastData?: string;

  // 过滤产品id
  productIds: number[];
  // 过滤产品名称
  productName: string
}

/**
 * @description: mobx ble scan store
 */
interface IBleScanStore {
  // 数据字段
  deviceList: IBLEDeviceData[];
  lastScanTimeMap: Map<string, number>;
  deviceFilter: IBleBroadcastFilter;
  scanning: boolean;

  // computed
  devices: () => IBLEDeviceData[];
  deviceFilterToString: string;

  // actions
  addDevices: (devices: IBLEDeviceData[]) => void;
  clearDevices: () => void;
  updateDeviceFilter: (filter: IBleBroadcastFilter) => void;
  startScan: () => void;
  stopScan: () => void;
}

interface IDeviceValueItem {
  label: string;
  id: string;
  status: "loading" | "success" | "fail" | "idle";
  value?: number | string;
}

interface IDeviceStore {
  // 数据字段
  currentDevice?: IBLEDeviceData;
  currentFirmware?: IFirmware;
  currentBleConnection?: any;
  deviceValueItems: Map<string, IDeviceValueItem>;

  // computed
  deviceValueItemsArray: IDeviceValueItem[];

  // actions
  setCurrentDevice: (device: IBLEDeviceData) => void;
  setCurrentFirmware: (firmware: IFirmware) => void;
  setCurrentBleConnection: (bleConnection: any) => void;
  getDeviceValues: () => Promise<void>;
  // getDeviceValue: () => Promise<void>;
}

/**
 * @description: 固件信息
 */
interface IFirmware {
  title: string;
  version: string;
  file_url: string;
}

// 升级状态
type IUpdateStatus =
  | "idle"
  | "downloading"
  | "updating"
  | "success"
  | "downloading-fail"
  | "fail";



interface IDevicePageItems {
  canUpdate: boolean
  showBroadcastInterval: boolean
  showBroadcastPower: boolean
  showBroadcastChannel: boolean
  showLog: boolean
}
