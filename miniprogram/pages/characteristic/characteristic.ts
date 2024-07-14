import { BleDeviceService } from "@services/BleDeviceService";
import { BehaviorWithStore } from "mobx-miniprogram-bindings";
import { deviceStore } from "../../mobx/index";
import { IProperty } from "../../mobx/device-store";
import Notify from "@vant/weapp/notify/notify";

interface ICharacteristicData {
  currentCharacteristicSubscribed?: boolean;
  dataType?: FormatType;
  currentCharacteristic?: ICharacteristic;
  connected?: boolean;
  currentDevice?: BleDeviceService;
  currentCharacteristicProperties?: IProperty[];
  currentCharacteristicReadOrNotifyCache?: { time: string; value: string }[];
  valueTypeOptions?: { id: number; name: string; value: string }[];
}

interface ICharacteristicOption {
  behaviors: string[];
  operateBtnTap: (event: WechatMiniprogram.CustomEvent) => void;
  dropdownItemChange: (event: WechatMiniprogram.CustomEvent) => void;
  setDateType?: (type: number) => void;
  onNotify: (charUUID: string, hexValue: string) => void;
}

Page<ICharacteristicData, ICharacteristicOption>({
  behaviors: [
    BehaviorWithStore({
      storeBindings: [
        {
          store: deviceStore,
          fields: [
            "readable",
            "writable",
            "notify",
            "dataType",
            "connected",
            "currentDevice",
            "currentCharacteristic",
            "currentCharacteristicProperties",
            "currentCharacteristicReadOrNotifyCache",
            "currentCharacteristicWriteCache",
            "currentCharacteristicSubscribed",
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
  onShow() {
    this.data.currentDevice?.setNotify(this.onNotify);
  },

  operateBtnTap(event) {
    const type = event.currentTarget.dataset.type;
    console.log("operateBtnTap:", event);

    const { currentCharacteristic, currentDevice } = this.data;
    if (!currentCharacteristic || !currentDevice) {
      return;
    }
    //read
    if (type === "read") {
      currentDevice.readAgain(
        currentCharacteristic.serviceUUID,
        currentCharacteristic.uuid
      );
      return;
    }

    if (type === "write") {
      //write
      // 先让用户输入一个dataType类型的数据
      wx.showModal({
        title: "请输入...",
        placeholderText: `请输入类型为 ${this.data.dataType} 的数据`,
        editable: true,
        success: (res) => {
          if (res.cancel) return;
          // 用户点击确定
          const value = res.content || "";
          if (value.length === 0) {
            return;
          }
          this.data.currentDevice?.write(
            this.data.currentCharacteristic!.serviceUUID,
            this.data.currentCharacteristic!.uuid,
            value,
            this.data.dataType!
          );
        },
      });
      return;
    }

    if (type === "notify") {
      //notify
      this.data.currentDevice?.notify(
        this.data.currentCharacteristic!.serviceUUID,
        this.data.currentCharacteristic!.uuid,
        !this.data.currentCharacteristicSubscribed
      );
    }
  },
  dropdownItemChange(event) {
    const selectId = event.detail.selectId;
    this.setDateType?.(selectId);
  },

  onUnload() {},

  onNotify(uuid, value) {
    Notify({
      type: "success",
      message: `${uuid} ${value}`,
      safeAreaInsetTop: true,
      background: "#0191F1",
      duration: 2500,
    });
  },
});
