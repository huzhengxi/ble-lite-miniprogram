import { BehaviorWithStore } from "mobx-miniprogram-bindings";

import { bleScanStore, deviceStore } from "../../mobx/index";
import BleScanService from "../../services/BleScanService";
import { permissionTip, uint8Array2hexString } from "../../utils/util";

interface ILuckinData {
  luckinDevices: IBLEDeviceData[];
  scanning: boolean;
  navHeight: number;
}

interface ILuckinOption {
  behaviors: string[];
  bleScanService?: BleScanService;
  changeScanStatus?: () => void;
  onItemTap?: (event: WechatMiniprogram.CustomEvent) => void;
  setCurrentDevice?: (device: IBLEDeviceData) => void;
  clearDevices?: () => void;
  startScan: () => Promise<void>;
}

const filterLuckinDevice = (device: IBlueToothDevice) => {
  const { serviceData = {} } = device;
  const fdcdData =
    serviceData["0000FDCD-0000-1000-8000-00805F9B34FB"] ||
    serviceData["0000fdcd-0000-1000-8000-00805f9b34fb"];
  if (!fdcdData) {
    return false;
  }

  const byteData = new Uint8Array(fdcdData);
  const hexData = uint8Array2hexString(byteData).toUpperCase();

  return hexData.startsWith("01FF0110");
};

const luckinBehavior = BehaviorWithStore({
  storeBindings: [
    {
      store: bleScanStore,
      fields: ["luckinDevices", "scanning"],
      actions: ["clearDevices"],
    },
    {
      store: deviceStore,
      fields: [],
      actions: ["setCurrentDevice"],
    },
  ],
});

Page<ILuckinData, ILuckinOption>({
  behaviors: [luckinBehavior],
  /**
   * 页面的初始数据
   */
  data: {
    navHeight: wx.getMenuButtonBoundingClientRect().bottom + 10,
    luckinDevices: [],
    scanning: false,
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {
    this.startScan();
  },

  async startScan() {
    this.clearDevices?.();
    this.setData({
      devices: [],
    });
    const tipContent = permissionTip();
    const showPermissionTip = () => {
      wx.showModal({
        title: "",
        content: tipContent,
        showCancel: false,
        confirmText: "知道了",
      });
    };
    try {
      // 检查定位权限和蓝牙权限
      const platform = wx.getSystemInfoSync().platform;
      const res = await wx.getSetting();
      // 只有 Android 才需要检查定位权限
      if (platform === "android" && !res.authSetting["scope.userLocation"]) {
        const authorizeLocationResult = await wx.authorize({
          scope: "scope.userLocation",
        });
        if (!authorizeLocationResult) {
          showPermissionTip();
        }
      }
      if (!res.authSetting["scope.bluetooth"]) {
        const authorizeBluetoothResult = await wx.authorize({
          scope: "scope.bluetooth",
        });
        if (!authorizeBluetoothResult) {
          showPermissionTip();
          return;
        }
      }
    } catch (error) {
      showPermissionTip();
    }

    if (!this.bleScanService) {
      this.bleScanService = new BleScanService();
    }
    this.bleScanService?.startScan(filterLuckinDevice);
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide() {
    this.bleScanService?.stopScan();
  },

  changeScanStatus() {
    if (this.data.scanning) {
      this.bleScanService?.stopScan();
    } else {
      this.startScan()
    }
  },
  onItemTap(event) {
    const { device } = event.currentTarget.dataset;

    console.log("条目点击：", device);
    this.setCurrentDevice?.(device);
    wx.navigateTo({
      url: `/pages/qrcode/qrcode`,
    });
  },
});
