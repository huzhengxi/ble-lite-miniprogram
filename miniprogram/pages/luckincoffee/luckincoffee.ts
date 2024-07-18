import { BehaviorWithStore } from "mobx-miniprogram-bindings";

import { bleScanStore, deviceStore } from "../../mobx/index";
import BleScanService from "../../services/BleScanService";
import { permissionTip, uint8Array2hexString } from "../../utils/util";
// @ts-ignore
import Dialog from "@vant/weapp/dialog/dialog";


interface ILuckinData {
  luckinDevices: IBLEDeviceData[];
  scanning: boolean;
  navHeight: number;
  loading: boolean;
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

const filterLuckinDevice = (device: IBluetoothDevice) => {
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
    loading: true,
  },


  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {
    console.log("me--luckin...onShow");

    this.startScan();
    this.setData({
      loading: true
    })
    setTimeout(() => {
      this.clearDevices?.();
      this.setData({
        loading: false,
      });
    }, 1600);
  },

  async startScan() {
    this.clearDevices?.();
    this.setData({
      devices: [],
    });
    const tipContent = permissionTip();
    const showPermissionTip = () => {
       Dialog.alert({
         message: tipContent,
         confirmButtonText: "去授权",
         cancelButtonText: "知道了",
         confirmButtonOpenType: "openSetting",
         showCancelButton: true,
       }).then(() => {});
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
    this.bleScanService?.stopScan(true);
  },

  changeScanStatus() {
    if (this.data.scanning) {
      this.bleScanService?.stopScan(true);
    } else {
      this.startScan();
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
