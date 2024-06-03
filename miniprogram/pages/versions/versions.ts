import { checkAvailableFirmwares } from "../../utils/http";
import { ProductId2Model } from "../../utils/util";
import { createStoreBindings } from "mobx-miniprogram-bindings";
import { deviceStore } from "../../mobx/index";

interface IVersionsPageData {
  availableFirmwares: IFirmware[];
  currentDevice?: IBLEDeviceData;
}

interface IVersionsPageOptions {
  storeBinds?: any;

  onBack: () => void;
  onUpdate: (event: WechatMiniprogram.CustomEvent) => void;
  setCurrentFirmware?: (firmware: IFirmware) => void;
}

Page<IVersionsPageData, IVersionsPageOptions>({
  /**
   * 页面的初始数据
   */
  data: {
    availableFirmwares: [],
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad() { },

  onReady() {
    this.storeBinds = createStoreBindings(this, {
      store: deviceStore,
      fields: ["currentDevice"],
      actions: ["setCurrentFirmware"],
    });

    wx.showLoading({
      title: "检查更新...",
      mask: true,
    });
    setTimeout(() => {
      let currentDevice = this.data.currentDevice;
      // @ts-ignore
      currentDevice = {
        mac: '1212',
        productID: 0x38,
      }
      if (currentDevice) {
        checkAvailableFirmwares({
          mac: currentDevice.mac,
          model: ProductId2Model(currentDevice.productID),
          version: "",
        })
          .then((availableFirmwares) => {
            this.setData({ availableFirmwares });
          })
          .finally(() => {
            wx.hideLoading();
          });
      } else {
        wx.hideLoading();
      }
    }, 500);
  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload() {
    this.storeBinds?.destroyStoreBindings();
  },

  onBack() {
    wx.navigateBack();
  },
  onUpdate(event) {
    const { index } = event.currentTarget.dataset;
    const firmware = this.data.availableFirmwares[index];
    this.setCurrentFirmware?.(firmware);
    console.log("targetFirmware:", firmware);
    wx.navigateTo({
      url: `/pages/update/update`,
    });
  },
});
