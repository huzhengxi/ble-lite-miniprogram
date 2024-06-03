import { createStoreBindings } from "mobx-miniprogram-bindings";
import { deviceStore } from "../../mobx/index";
import { downloadFirmware } from "../../utils/http";
import { OtaStatusCode } from "../../services/OtaStatusCode";
import { OtaController } from "../../services/OtaController";
import BleConnection from "../../services/BleConnection";
import OtaSetting from "../../services/OtaSetting";

interface IUpdatePageData {
  // 目标固件版本
  currentFirmware?: IFirmware;
  // 升级进度
  progress: number;
  // 升级状态
  status: IUpdateStatus;
  // 固件地址
  firmwarePath?: string;
  currentBleConnection?: BleConnection;
}

interface IUpdatePageOptions {
  intervalId?: any;
  storeBinds?: any;
  otaController?: OtaController;

  onBack: () => void;
  onSuccessOrFailConfirm: () => void;
  startDownloadFirmware: () => void;
  startUpdate: () => void;
  onOtaProgressUpdate: (progress: number) => void;
  onOtaStatusChanged: (status: OtaStatusCode, info: string) => void;
}

Page<IUpdatePageData, IUpdatePageOptions>({
  /**
   * 页面的初始数据
   */
  data: {
    progress: 0,
    status: "downloading",
  },

  onLoad() {
    this.storeBinds = createStoreBindings(this, {
      store: deviceStore,
      fields: ["currentDevice", "currentFirmware", "currentBleConnection"],
    });
  },
  onShow() {
    // this.intervalId = setInterval(() => {

    //   let { progress, status } = this.data
    //   if (status === 'downloading') {
    //     status = 'updating'
    //     progress = 0
    //   }
    //   if (progress < 100) {
    //     progress++
    //   }

    //   if (progress === 100) {
    //     status = 'success'
    //     clearInterval(this.intervalId)
    //   }

    //   this.setData({
    //     progress,
    //     status
    //   })
    //   console.log(`status:${status}, progress:${progress}`);

    // }, 200)
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady() {
    setTimeout(() => {
      this.startDownloadFirmware();
    }, 200);


  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide() {

  },

  onBack() {
    wx.navigateBack();
  },

  async startDownloadFirmware() {
    if (!this.data.currentFirmware?.file_url) {
      console.log("目标固件下载地址为空：", this.data.currentBleConnection);

      return undefined;
    }

    this.setData({
      status: "downloading",
    });

    //  开始下载固件
    return downloadFirmware(this.data.currentFirmware.file_url, (progress) => {
      console.log("progress:", progress);
      this.setData({
        progress,
      });
    })
      .then((path) => {
        console.log("downloadFirmware:", path);
        this.setData({
          firmwarePath: path,
        });
        this.startUpdate();
      })
      .catch((err) => {
        console.log("downloadFirmware err:", err);
        this.setData({
          status: "downloading-fail",
        });
      });
  },
  async startUpdate() {
    try {
      // 保持屏幕常亮
      wx.setKeepScreenOn({
        keepScreenOn: true
      })
      this.setData({
        status: "updating",
        progress: 0,
      });

      if (!this.data.firmwarePath) {
        return;
      }
      if (!this.otaController) {
        this.otaController = new OtaController(this.data.currentBleConnection!);
        this.otaController.setOtaCallback({
          onOtaProgressUpdate: this.onOtaProgressUpdate,
          onOtaStatusChanged: this.onOtaStatusChanged,
        });
      }

      const otaSetting = new OtaSetting();
      otaSetting.firmwarePath = this.data.firmwarePath;
      // otaSetting.pduLength = (
      //   await this.data.currentBleConnection!.getPDULength()
      // ).mtu - 3;
      otaSetting.pduLength = 23;
      this.otaController.startOta(otaSetting);

    } catch (error) {
      console.log("startOta-升级失败", error);
      this.setData({ status: "fail" });
    }
  },

  onSuccessOrFailConfirm() {
    if (this.data.status === "success") {
      console.log("升级成功返回上一页");
      wx.reLaunch({
        url: '/pages/main/main'
      })
      return;
    }

    console.log("升级失败，重试");

    if (this.data.status === "downloading-fail") {
      this.startDownloadFirmware();
      return;
    }
    this.startUpdate();
  },

  onOtaProgressUpdate(progress) {
    if (!progress || this.data.progress >= progress) return;
    console.log(`onOtaProgressUpdate: ${progress}`);
    this.setData({ progress });
  },

  onOtaStatusChanged(status, info) {
    console.log("onOtaStatusChanged:", status, info);

    if (status === OtaStatusCode.SUCCESS) {
      this.setData({
        status: "success",
        progress: 100
      });
    } else if (status === OtaStatusCode.STARTED) {
    } else {
      this.setData({
        progress: 0,
        status: "fail",
      });
    }
  },
  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload() {
    this.storeBinds?.destroyStoreBindings();
    // 取消屏幕常亮
    wx.setKeepScreenOn({
      keepScreenOn: false
    })
  },
});
