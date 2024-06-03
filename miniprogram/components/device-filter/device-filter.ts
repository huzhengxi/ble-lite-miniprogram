import { ComponentWithStore } from "mobx-miniprogram-bindings";
import { bleScanStore } from "../../mobx/ble-scan-store";
import { getProductOptions } from '../../utils/util'

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
    productOptions: getProductOptions(),

    filterForm: [
      {
        label: "名称",
        key: "name",
        placeholder: "根据名称进行过滤",
      },
      {
        label: "MAC",
        key: "mac",
        placeholder: "根据 MAC 地址进行过滤",
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
      this.onHideFilter()
      // @ts-ignore
      this.updateDeviceFilter?.({
        productIds: [],
        productName: '全部产品',
        name: '',
        mac: '',
        rssi: undefined
      })
      this.setData({
        productIDValue: 0
      })
    },
    onHideFilter() {
      this.selectComponent('#dropItem').toggle(false)
    },
    onSliderChange(event: WechatMiniprogram.SliderChange) {
      console.log("onSliderChange：", event);

      // @ts-ignore
      this.updateDeviceFilter?.({
        rssi: event.detail.value * -1,
      });
    },
    dropdownItemChange(event: WechatMiniprogram.CustomEvent) {
      console.log('dropdownItemChange：', event.detail);
      const option = this.data.productOptions.find(item => item.id === Number(event.detail.selectId))
      this.setData({
        productIDValue: Number(event.detail.selectId)
      })
      if (option) {
        // @ts-ignore
        this.updateDeviceFilter?.({
          productIds: option?.productIds ?? [],
          productName: option?.name ?? ''
        })
      }
    }
  },
});
