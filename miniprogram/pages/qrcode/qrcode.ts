import { createStoreBindings } from "mobx-miniprogram-bindings";
import { deviceStore } from "../../mobx/index";
import { mac2Colon } from "../../utils/util";
//@ts-ignore
import Notify from "@vant/weapp/notify/notify";
import drawQrcode from "weapp-qrcode";

interface IQRcodePageData {
  currentDevice?: IBLEDeviceData;
  mac: string;
}

interface IQRCodeOption {
  storeBinds?: any;
  macLongPress: () => void;
}

Page<IQRcodePageData, IQRCodeOption>({
  /**
   * 页面的初始数据
   */
  data: {
    mac: "",
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad() {
    this.storeBinds = createStoreBindings(this, {
      store: deviceStore,
      fields: ["currentDevice"],
      actions: [],
    });
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady() {
    const mac = mac2Colon(this.data.currentDevice?.mac ?? "");
    this.setData({
      mac,
    });

    drawQrcode({
      width: 200,
      height: 200,
      canvasId: "macQrcode",
      text: mac,
    });
  },
  macLongPress() {
    //震动一下
    wx.vibrateShort({
      type: "medium"
    })

    // 复制 mac 地址到剪贴板
    wx.setClipboardData({
      data: this.data.mac,
    });
  },
});
