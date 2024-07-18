import { BehaviorWithStore } from "mobx-miniprogram-bindings";

import { bleScanStore, deviceStore } from "../../mobx/index";
import BleScanService from "../../services/BleScanService";
import { permissionTip } from "../../utils/util";
import { BleDeviceService } from "../../services/BleDeviceService";
// @ts-ignore
import Dialog from "@vant/weapp/dialog/dialog";

interface IMainData {
  devices: IBLEDeviceData[];
  scanning: boolean;
  navHeight: number;
  connectDialogShow: boolean;
  canceledConnect: boolean;
  currentDevice?: BleDeviceService;
}

interface IMainOption {
  behaviors: string[];
  bleScanService?: BleScanService;
  changeScanStatus?: () => void;
  onItemTap?: (event: WechatMiniprogram.CustomEvent) => void;
  setCurrentDevice?: (device: BleDeviceService) => void;
  clearDevices?: () => void;
  startScan: () => Promise<void>;
  onItemLongPress: (event: WechatMiniprogram.CustomEvent) => void;
  onDialogClose: () => void;
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
      fields: ["currentDevice"],
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
    navHeight: wx.getMenuButtonBoundingClientRect().bottom + 20,
    devices: [],
    scanning: false,
    connectDialogShow: false,
    canceledConnect: false,
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
    wx.showShareMenu({
      withShareTicket: true,
      menus: ["shareAppMessage", "shareTimeline"],
    });
    this.startScan();
  },

  async startScan() {
    const sysInfo = wx.getSystemInfoSync();
    if (sysInfo.platform === "devtools") {
      return;
    }
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
      if (!this.bleScanService) {
        this.bleScanService = new BleScanService();
      }
      await this.bleScanService?.startScan();
    } catch (error) {
      this.bleScanService?.stopScan();
      console.log("main-scan-error", error);
      showPermissionTip();
    }
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide() {
    this.bleScanService?.stopScan(true);
    console.log("me--main...onHide");
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
    const device = event.currentTarget.dataset.device as IBLEDeviceData;
    if (!device.connectable) {
      wx.showToast({
        title: "此设备不允许连接",
        icon: "none",
        duration: 1000,
      });
      return;
    }

    this.setData({
      connectDialogShow: true,
      canceledConnect: false,
    });

    if (this.data.scanning) {
      this.bleScanService?.stopScan();
    }
    const deviceService: BleDeviceService = new BleDeviceService(device);
    deviceStore.setCurrentDevice(deviceService);
    deviceService
      .startConnect()
      .then((result) => {
        if (this.data.canceledConnect) {
          // 已经取消连接了返回吧
          return;
        }
        if (!result) {
          this.setData({
            connectDialogShow: false,
          });
          wx.showToast({
            title: "连接失败",
            icon: "none",
            mask: true,
          });
          return;
        }
        console.log("连接成功");

        wx.navigateTo({
          url: "/pages/devicedetail/devicedetail",
        });
      })
      .finally(() => {
        this.setData({
          connectDialogShow: false,
        });
      });
  },
  onItemLongPress(event) {
    const device = event.currentTarget.dataset.device as IBLEDeviceData;
    const shareData = {
      deviceId: device.deviceId,
      name: device.name,
      RSSI: device.rssi,
      broadcastData: device.broadcastData,
      connectable: device.connectable,
    };

    wx.setClipboardData({
      data: JSON.stringify(shareData, null, 2),
      success() {
        wx.showToast({
          title: "复制成功",
          icon: "success",
        });
      },
    });
  },
  onDialogClose() {
    console.log("canceled connect...");
    this.setData({
      canceledConnect: true,
      connectDialogShow: false,
    });

    if (this.data.currentDevice?.currentDevice?.deviceId) {
      wx.closeBLEConnection({
        deviceId: this.data.currentDevice.currentDevice.deviceId,
      });
    }
  },
});
