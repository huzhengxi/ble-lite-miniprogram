import { BehaviorWithStore } from "mobx-miniprogram-bindings";
import { deviceStore } from "../../mobx/index";
import { BleDeviceService } from "../../services/BleDeviceService";

interface IDeviceDetailData {
  currentDevice?: BleDeviceService;
  testData: Record<string, any>;
  activeName: string
}

interface IDeviceDetailOption {
  behaviors: string[];
  onCollapseChange: (event: any) => void;
  onCharacteristic: (event: WechatMiniprogram.CustomEvent) => void;
  setCurrentCharacteristic?: (characteristic: ICharacteristic) => void
  clearStore?: () => void
}

Page<IDeviceDetailData, IDeviceDetailOption>({
  behaviors: [
    BehaviorWithStore({
      storeBindings: [
        {
          store: deviceStore,
          fields: ["currentDevice", "connected"],
          actions: ["setCurrentCharacteristic", "clearStore"],
        },
      ],
    }),
  ],
  /**
   * 页面的初始数据
   */
  data: {
    currentDevice: undefined,
    testData: { test: true },
    activeName: ''
  },

  onCollapseChange(event) {
    this.setData({
      activeName: event.detail,
    });
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad() { },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady() { },

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
    this.data.currentDevice?.disconnect();
    this.clearStore?.()
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

  onCharacteristic(event) {
    const { characteristic } = event.currentTarget.dataset;
    this.setCurrentCharacteristic?.(characteristic)
    wx.navigateTo({
      url: '/pages/characteristic/characteristic'
    })
  }
});
