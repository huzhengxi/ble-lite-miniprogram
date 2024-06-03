import { UuidInfo } from "../../services/UuidInfo";
import { createStoreBindings } from "mobx-miniprogram-bindings";
import { deviceStore } from "../../mobx/index";
import BleConnection from "../../services/BleConnection";
import { getDevicePageItems, getDeviceIcon } from '../../utils/util'

import {
  generateArray,
  mac2Colon,
  number2Hex,
  signedInt2hexString,
} from "../../utils/util";

interface IDevicePageData {
  currentDevice?: IBLEDeviceData;
  // 当前版本号
  currentVersion?: string;
  mac: string;
  // 广播间隔
  broadcastInterval: string;
  // 广播发射功率
  broadcastPower: string;
  // 广播通道
  broadcastChannel: string;

  showOverlay: boolean;
  overlayTitle: string;
  pickerOptions: string[];
  pickerCurrentIndex: number;
  showPicker: boolean;
  setValueType?: "interval" | "power" | "channel";
  showChannelDialog: boolean;
  checkboxResult: string[];
  pageItems?: IDevicePageItems;
  deviceIcon: string;
  onBeforeDialogClose?: (action: "confirm" | "cancel") => void;
}

interface IDevicePageOption {
  storeBinds?: any;
  startConnect: () => void;
  currentBleConnection?: BleConnection;
  onUpdate: () => void;
  setCurrentBleConnection?: (bleConnection: BleConnection) => void;
  showLoading: (title: string) => void;
  hideLoading: () => void;
  showModal: (title: string, content: string) => void;
  onSetBroadcastInterval: () => void;
  onSetBroadcastPower: () => void;
  onHideOverlay: () => void;
  onOverlayConfirm: (event: WechatMiniprogram.CustomEvent) => void;
  onSetBroadcastChannel: () => void;
  onCheckboxChange: (event: WechatMiniprogram.CustomEvent) => void;
  onMacCellLongPress: () => void;
  onGetDeviceLog: () => void
}

Page<IDevicePageData, IDevicePageOption>({
  /**
   * 页面的初始数据
   */
  data: {
    checkboxResult: [],
    showChannelDialog: false,
    showPicker: false,
    pickerCurrentIndex: 0,
    pickerOptions: [],
    overlayTitle: "",
    showOverlay: false,
    currentVersion: "",
    broadcastInterval: "",
    broadcastPower: "",
    mac: "",
    broadcastChannel: "",
    deviceIcon: "/assets/devices/big/beacon.png"
  },

  async startConnect() {
    this.showLoading("连接中...");
    try {
      const deviceId = this.data.currentDevice?.deviceId;
      this.currentBleConnection = new BleConnection(deviceId!);
      const connectResult = await this.currentBleConnection.connect();
      this.setCurrentBleConnection?.(this.currentBleConnection);
      console.log("连接成功：", connectResult);
      await this.currentBleConnection.enableNotification(
        UuidInfo.BASE_NOTIFY_SERVICE_UUID,
        UuidInfo.BASE_NOTIFY_CHARACTERISTIC_UUID,
        false
      );

      this.showLoading("获取版本号...");
      // @ts-ignore
      const version: string = await this.currentBleConnection.getVersion();
      this.setData({ currentVersion: version });
      if (this.data.pageItems?.showBroadcastChannel) {
        this.showLoading("获取广播间隔...");
        const broadcastInterval =
          await this.currentBleConnection.getBroadcastInterval();
        this.setData({ broadcastInterval: broadcastInterval.toString() });
      }

      if (this.data.pageItems?.showBroadcastPower) {
        this.showLoading("获取广播发射功率...");
        const broadcastPower =
          await this.currentBleConnection.getBroadcastPower();
        this.setData({ broadcastPower: broadcastPower.toString() });
      }

      if (this.data.pageItems?.showBroadcastInterval) {
        this.showLoading("获取广播通道...");
        const broadcastChannel =
          await this.currentBleConnection.getBroadcastChannel();
        this.setData({ broadcastChannel: broadcastChannel.toString() });
      }

    } catch (error: any) {
      console.log("连接失败：", error);
      wx.showModal({
        title: "连接失败",
        content: `[${error.errno}] ${error.errMsg}`,
        confirmText: "重试",
      }).then((res) => {
        if (res.confirm) {
          // 重试
          this.startConnect();
        } else if (res.cancel) {
          // 取消
          wx.navigateBack();
        }
      });
    } finally {
      this.hideLoading();
    }
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad() {
    this.storeBinds = createStoreBindings(this, {
      store: deviceStore,
      fields: [
        "currentDevice",
        "currentBleConnection",
        "deviceValueItemsArray",
      ],
      actions: ["setCurrentBleConnection", "getDeviceValues"],
    });
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady() {
    wx.setNavigationBarTitle({
      title: this.data.currentDevice?.name ?? "",
    });

    this.setData({
      mac: mac2Colon(this.data.currentDevice?.mac ?? ""),
      pageItems: getDevicePageItems(this.data.currentDevice?.productID),
      deviceIcon: getDeviceIcon(this.data.currentDevice?.productID)
    });


    const platform = wx.getSystemInfoSync().platform;
    if (platform !== "devtools") {
      this.startConnect();
    }
  },
  onUpdate() {
    if(!this.data.pageItems?.canUpdate) {
      return
    }
    console.log("onUpdate");
    wx.navigateTo({
      url: "/pages/versions/versions",
    });
  },
  showLoading(title: string) {
    wx.showLoading({
      title,
      mask: true,
    });
  },
  hideLoading() {
    wx.hideLoading();
  },
  showModal(title: string, content: string) {
    wx.showModal({
      title,
      content,
      showCancel: false,
    });
  },
  onSetBroadcastInterval() {
    const pickerOptions = generateArray(100, 10000, 100).map(
      (value) => `${value} ms`
    );
    this.setData({
      setValueType: "interval",
      overlayTitle: "设置广播间隔",
      showOverlay: true,
      showPicker: true,
      pickerOptions,
      pickerCurrentIndex: pickerOptions.indexOf(
        `${this.data.broadcastInterval} ms`
      ),
    });
  },

  onSetBroadcastPower() {
    const pickerOptions = [
      100, 80, 40, 30, 10, 0, -10, -20, -30, -40, -50, -60, -70, -80, -100,
      -110, -130, -160, -190,
    ].map((value) => `${value} dB`);

    this.setData({
      setValueType: "power",
      overlayTitle: "设置广播发射功率",
      showOverlay: true,
      showPicker: true,
      pickerOptions,
      pickerCurrentIndex: pickerOptions.indexOf(
        `${this.data.broadcastPower} dB`
      ),
    });
  },
  onSetBroadcastChannel() {
    this.setData({
      setValueType: "channel",
      showChannelDialog: true,
      checkboxResult:
        this.data.broadcastChannel === ""
          ? []
          : this.data.broadcastChannel.split(","),
      onBeforeDialogClose: async (action) => {
        if (action === "cancel") {
          return true;
        }
        const checkboxResult = this.data.checkboxResult;
        console.log("onBeforeDialogClose:", action, checkboxResult);
        let channels = 0;
        if (checkboxResult.includes("37")) {
          channels = channels | 0x1;
        }
        if (checkboxResult.includes("38")) {
          channels = channels | 0x2;
        }

        if (checkboxResult.includes("39")) {
          channels = channels | 0x4;
        }

        const hexValue = "021F" + channels.toString(16).padStart(2, "0");
        const result = await this.currentBleConnection?.setBroadcastInfo(
          hexValue
        );
        if (result) {
          this.setData({
            broadcastChannel: checkboxResult.join(","),
          });
          return true;
        }

        wx.showToast({
          icon: "error",
          title: "设置失败！",
        });
        return false;
      },
    });
  },

  onHideOverlay() {
    this.setData({
      showOverlay: false,
    });
    setTimeout(() => {
      this.setData({
        showPicker: false,
      });
    }, 200);
  },
  async onOverlayConfirm(event) {
    console.log("event:", event);
    this.setData({
      showOverlay: false,
    });

    const { value: valueString } = event.detail;
    const value = Number((valueString as string).split(" ")[0]);

    if (this.data.setValueType === "interval") {
      const hexValue = number2Hex(value, 2);
      this.showLoading("设置广播间隔...");
      const result = await this.currentBleConnection?.setBroadcastInfo(
        "0303" + hexValue
      );
      this.hideLoading();
      if (!result) {
        this.showModal("设置失败", "设置广播间隔失败");
        return;
      }
      this.setData({
        broadcastInterval: value.toString(),
      });
    } else if (this.data.setValueType === "power") {
      const hexValue = signedInt2hexString(value);
      this.showLoading("设置广播发射功率...");
      const result = await this.currentBleConnection?.setBroadcastInfo(
        "0305" + hexValue
      );
      this.hideLoading();
      if (!result) {
        this.showModal("设置失败", "设置广播发射功率失败");
        return;
      }
      this.setData({
        broadcastPower: value.toString(),
      });
    }
  },
  onCheckboxChange(event) {
    console.log("onCheckboxChange:", event.detail);
    const checkboxResult = event.detail as string[];
    if (checkboxResult.length < 1) {
      wx.showToast({
        icon: "error",
        title: "请至少选择一个通道",
      });
      return;
    }
    this.setData({
      checkboxResult,
    });
  },
  onMacCellLongPress() {
    // 拷贝到剪切板
    wx.setClipboardData({
      data: this.data.mac,
      success: () => {
        wx.showToast({
          title: "BLE MAC 已复制到剪切板",
        });
      },
    });
  },
  onGetDeviceLog() {
    console.log('onGetDeviceLog');

    wx.navigateTo({
      url: "/pages/log/log",
    });
  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload() {
    this.currentBleConnection?.disconnect();
    this.storeBinds?.destroyStoreBindings();
  },
});
