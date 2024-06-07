import { BehaviorWithStore } from "mobx-miniprogram-bindings";

import { bleScanStore, deviceStore } from "../../mobx/index";
import BleScanService from "../../services/BleScanService";
import { permissionTip } from "../../utils/util";

interface IMainData {
  devices: IBLEDeviceData[];
  scanning: boolean;
  navHeight: number;
}

interface IMainOption {
  behaviors: string[];
  bleScanService?: BleScanService;
  changeScanStatus?: () => void;
  onItemTap?: (event: WechatMiniprogram.CustomEvent) => void;
  setCurrentDevice?: (device: IBLEDeviceData) => void;
  clearDevices?: () => void;
  startScan: () => Promise<void>;
}

const mainBehavior = BehaviorWithStore({
  storeBindings: [
    {
      store: bleScanStore,
      fields: ["devices", "scanning"],
      actions: ["clearDevices"],
    },
    {
      store: deviceStore,
      fields: [],
      actions: ["setCurrentDevice"],
    },
  ],
});

Page<IMainData, IMainOption>({
  behaviors: [mainBehavior],
  /**
   * 页面的初始数据
   */
  data: {
    navHeight: wx.getMenuButtonBoundingClientRect().bottom + 10,
    devices: [],
    scanning: false,
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad() {},

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady() {},

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
    this.bleScanService?.startScan();
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide() {
    this.bleScanService?.stopScan();
  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload() {},

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh() {},
  changeScanStatus() {
    if (this.data.scanning) {
      this.bleScanService?.stopScan();
    } else {
      this.bleScanService?.startScan();
    }
  },
  onItemTap(event) {
    const { device } = event.currentTarget.dataset;

    console.log("条目点击：", device);
    this.setCurrentDevice?.(device);
    // if (!supportedProductIds.includes(device.productID)) {
    //   wx.showModal({
    //     title: "",
    //     content: "此设备暂不支持连接",
    //     showCancel: false,
    //   });
    //   return;
    // }

    // wx.navigateTo({
    //   url: `/pages/device/device`,
    // });
    wx.navigateTo({
      url: `/pages/qrcode/qrcode`,
    });
  },
});
