/// <reference path="./types/index.d.ts" />

interface IAppOption {
  globalData: {
    userInfo?: WechatMiniprogram.UserInfo;
  };
  userInfoReadyCallback?: WechatMiniprogram.GetUserInfoSuccessCallback;
}

type IBluetoothDevice = WechatMiniprogram.BlueToothDevice;

interface IBLEDeviceData {
  deviceId: string;
  // 设备名称
  name: string;
  // 设备信号强度
  rssi: number;
  // 设备信号强度等级(RSSI转换得到一个0~5的数字)
  rssiLevel: number;
  // 扫描间隔
  scanInterval?: number;

  // 原始数据
  rawData?: IBluetoothDevice;
  // 广播数据
  broadcastData: string;
  // mac 地址
  mac?: string;
  // serviceData
  serviceData?: Record<string, ArrayBuffer>;
}

// 广播过滤条件
interface IBleBroadcastFilter {
  // 设备名称
  name?: string;
  // 设备信号强度
  rssi?: number;
  mac?: string;
  // 电池电量
  battery?: number;
  // 广播数据
  broadcastData?: string;
  // 移除没有名称的广播
  unnamedSwitch: boolean;
  // 移除没有广播内容的广播
  noDataSwitch: boolean;
  // 异常不能连接的广播
  unconnectableSwitch: boolean;
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
  luckinDevices: () => IBLEDeviceData[];
  deviceFilterToString: string;

  // actions
  addDevices: (devices: IBLEDeviceData[]) => void;
  getAllDevices: () => IBLEDeviceData[];
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
  canUpdate: boolean;
  showBroadcastInterval: boolean;
  showBroadcastPower: boolean;
  showBroadcastChannel: boolean;
  showLog: boolean;
}

type IDeviceFilter = (device: IBluetoothDevice) => boolean;

/**
 * 写入命令参数
 */
interface IWriteCommandOption {
  // 写入数据的特征值 UUID
  writeCharacteristicUUID: string;
  // 回复数据的特征值 UUID (如果noResponse为true，则不需要传)
  notifyCharacteristicUUID?: string;
  // 命令字
  type: number;
  // 是否不需要回复
  noResponse?: boolean;
  // 数据
  data?: ArrayBuffer;
  // 是否分包接收
  isSplitReceive?: boolean;
  // 超时时间
  timeout?: number;
}

// 格式化数据类型
type FormatType = "hex" | "string";

type ConnectStateChangeType =
  WechatMiniprogram.OnBLEConnectionStateChangeListenerResult;
type CharValueChangeType =
  WechatMiniprogram.OnBLECharacteristicValueChangeListenerResult;

/**
 * 蓝牙扫描结果回调
 */
type IBleDeviceFoundCallback = WechatMiniprogram.OnBluetoothDeviceFoundCallback;

/**
 * 微信蓝牙设备
 */
type IWechatBlueToothDevice = WechatMiniprogram.BlueToothDevice;

/**
 * 发送命令
 */
interface ICommand<T = IError | { success: boolean; data: Uint8Array }> {
  // 命令字
  type: number;
  // 是否分包接收
  isSplitReceive?: boolean;
  // 超时定时器 id
  timeoutId: number;
  receivedData: Uint8Array;

  resolve: (value: T) => void;
}
