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
    filterForm: [
      {
        label: "广播名称",
        key: "name",
        placeholder: "输入名称",
      },
      {
        label: "广播数据",
        key: "broadcastData",
        placeholder: "输入广播数据",
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
    onSwitchChange: function (event: WechatMiniprogram.SwitchChange) {
      console.log("onSwitchChange:", event.currentTarget.id);

      // @ts-ignore
      this.updateDeviceFilter?.({
        [event.currentTarget.id]: event.detail.value,
      });
    },

    onClearFilter() {
      this.onHideFilter();
      // @ts-ignore
      this.updateDeviceFilter?.({
        name: "",
        mac: "",
        rssi: undefined,
        unnamedSwitch: false,
        unconnectableSwitch: false,
        noDataSwitch: false,
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
    touchmove() {
      
    }
  },
});
