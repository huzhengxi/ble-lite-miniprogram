
import { createStoreBindings } from "mobx-miniprogram-bindings";
import { deviceStore } from "../../mobx/index";
import BleConnection from "../../services/BleConnection";
import { UuidInfo } from "../../services/UuidInfo";
import { saveLog, shareLog, removeLog } from "../../services/Logger";

interface ILogPageData {
  currentDevice?: IBLEDeviceData;
  currentBleConnection?: BleConnection;
  logs: string;
}

interface ILogPageOptions {

  storeBinds?: any;
  shareTo: () => void;
  onBack: ()=> void
}

Page<ILogPageData, ILogPageOptions>({
  /**
   * 页面的初始数据
   */
  data: {
    logs: ``,
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad() { },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady() {
    this.storeBinds = createStoreBindings(this, {
      store: deviceStore,
      fields: ["currentDevice", "currentBleConnection"],
    });

    setTimeout(() => {
      this.data.currentBleConnection?.enableNotification(
        UuidInfo.LOG_SERVICE_UUID,
        UuidInfo.LOG_NOTIFY_CHARACTERISTIC_UUID,
        true,
        (value) => {
          const finalValue = saveLog(value, this.data.currentDevice?.mac || "");
          this.setData({
            logs: this.data.logs + finalValue,
          });
          console.log("log:", finalValue);
        }
      );
    }, 500);
  },

  shareTo() {
    shareLog(this.data.currentDevice?.mac || "")
  },
  onBack(){
    wx.navigateBack()
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() { },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide() { },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload() {
    this.data.currentBleConnection?.disableNotification(
      UuidInfo.LOG_SERVICE_UUID,
      UuidInfo.LOG_NOTIFY_CHARACTERISTIC_UUID)
    removeLog()
  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh() { },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom() { },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() { },
});
