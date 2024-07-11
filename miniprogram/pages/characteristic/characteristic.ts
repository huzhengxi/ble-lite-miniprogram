import { BleDeviceService } from "@services/BleDeviceService";
import { BehaviorWithStore } from "mobx-miniprogram-bindings";
import { deviceStore } from "../../mobx/index";
import { IProperty } from "../../mobx/device-store";

interface ICharacteristicData {
  currentCharacteristic?: ICharacteristic;
  connected?: boolean;
  currentDevice?: BleDeviceService;
  currentCharacteristicProperties?: IProperty[];
  currentCharacteristicCache?: { time: string; value: string }[];
  valueTypeOptions: { id: number, name: string, value: string }[]
}

interface ICharacteristicOption {
  behaviors: string[];
  operateBtnTap: () => void;
  onClickLeft: () => void;
  dropdownItemChange: (event: WechatMiniprogram.CustomEvent) => void;
  setDateType?: (type: number) => void;
}

Page<ICharacteristicData, ICharacteristicOption>({
  behaviors: [
    BehaviorWithStore({
      storeBindings: [
        {
          store: deviceStore,
          fields: [
            "dataType",
            "connected",
            "currentDevice",
            "currentCharacteristic",
            "currentCharacteristicProperties",
            "currentCharacteristicCache",
            "valueTypeOptions",
            "currentTypeOption",
          ],
          actions: ["setDateType"],
        },
      ],
    }),
  ],

  /**
   * 页面的初始数据
   */
  data: {},

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
  onShow() {},

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide() {},

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload() {
    // 卸载 behaviors
  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh() {},

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom() {},

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {},

  onClickLeft() {
    wx.navigateBack();
  },
  operateBtnTap() {
    const { currentCharacteristic, currentDevice } = this.data;
    if (!currentCharacteristic || !currentDevice) {
      return;
    }
    //read
    if (currentCharacteristic.properties.read) {
      currentDevice.readAgain(
        currentCharacteristic.serviceUUID,
        currentCharacteristic.uuid
      );
    } else if (
      currentCharacteristic.properties.write ||
      currentCharacteristic.properties.writeDefault ||
      currentCharacteristic.properties.writeNoResponse
    ) {
    } else if (currentCharacteristic.properties.notify) {
    }
  },
  dropdownItemChange(event) {
    const selectId = event.detail.selectId;
    this.setDateType?.(selectId);
  },
});
