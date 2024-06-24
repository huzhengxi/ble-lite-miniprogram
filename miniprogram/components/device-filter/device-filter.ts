import { ComponentWithStore } from "mobx-miniprogram-bindings";
import { bleScanStore } from "../../mobx/ble-scan-store";

ComponentWithStore({
  options: {
    styleIsolation: "shared",
  },
  storeBindings: {
    store: bleScanStore,
    fields: ["deviceFilter", "deviceFilterToString"],
    actions: ["updateDeviceFilter"],
  },
  /**
   * 组件的属性列表
   */
  properties: {},

  /**
   * 组件的初始数据
   */
  data: {
    productIDValue: 0,

    filterForm: [
      {
        label: "名称",
        key: "name",
        placeholder: "根据名称进行过滤",
      },
      {
        label: "广播内容",
        key: "broadcastData",
        placeholder: "根据广播名称地址进行过滤",
      },
    ],
  },

  /**
   * 组件的方法列表
   */
  methods: {
    onInputValueChange(event: WechatMiniprogram.Input) {
      // @ts-ignore
      this.updateDeviceFilter?.({
        [event.target.dataset.key]: event.detail.value,
      });
    },

    onClearFilter() {
      this.onHideFilter();
      // @ts-ignore
      this.updateDeviceFilter?.({
        name: "",
        mac: "",
        rssi: undefined,
      });
    },
    onHideFilter() {
      this.selectComponent("#dropItem").toggle(false);
    },
    onSliderChange(event: WechatMiniprogram.SliderChange) {
      console.log("onSliderChange：", event);

      // @ts-ignore
      this.updateDeviceFilter?.({
        rssi: event.detail.value * -1,
      });
    },
  },
});
