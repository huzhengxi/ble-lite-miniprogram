/*
 * Created by Tiger on 30/12/2023
 * mobx 设备操作相关 store
 */
import { BleDeviceService } from "../services/BleDeviceService";
import { observable, action } from "mobx-miniprogram";
import { formatTimeWithoutDate, formatBytes } from "../utils/util";

export interface IProperty {
  title: string;
  label: string;
  icon: string;
}

interface ICharacteristicCacheValue {
  time: Date;
  value: ArrayBuffer;
}

interface IValueTypeOption {
  id: 0 | 1;
  name: "Hex" | "UTF-8 String";
  value: FormatType;
}

interface IDeviceStore {
  // 数据字段
  currentDevice?: BleDeviceService;
  currentCharacteristic?: ICharacteristic;
  connected: boolean;
  characteristicsCache: Record<string, ICharacteristicCacheValue[]>;
  valueTypeOptions: IValueTypeOption[];
  dateTypes: Record<string, FormatType>;

  // computed
  currentCharacteristicProperties: IProperty[];
  readable: IProperty;
  writable: IProperty;
  notify: IProperty;
  dataType: FormatType;
  currentCharacteristicCache: { time: string; value: string }[];
  currentTypeOption: IValueTypeOption;

  // actions
  setCurrentDevice: (device: BleDeviceService) => void;
  getCurrentDevice: () => BleDeviceService | undefined;

  setCurrentCharacteristic: (characteristic: ICharacteristic) => void;
  getCurrentCharacteristic: () => ICharacteristic | undefined;

  setConnected: (connected: boolean) => void;

  setCharacteristicCache: (value: CharValueChangeType) => void;
  setDateType: (type: number) => void;
  clearStore: () => void;
}

export const deviceStore: IDeviceStore = observable({
  // 数据字段
  connected: false as boolean,
  currentDevice: undefined as BleDeviceService | undefined,
  currentCharacteristic: undefined as ICharacteristic | undefined,
  characteristicsCache: {} as Record<string, ICharacteristicCacheValue[]>,
  dateTypes: {} as Record<string, FormatType>,
  valueTypeOptions: [
    {
      id: 0,
      name: "Hex",
      value: "hex",
    },
    {
      id: 1,
      name: "UTF-8 String",
      value: "str",
    },
  ] as IValueTypeOption[],

  // computed
  get dataType() {
    return this.dateTypes[this.currentCharacteristic!.uuid] || "hex";
  },
  get currentTypeOption() {
    return this.valueTypeOptions.find(
      (item: IValueTypeOption) => item.value === this.dataType
    ) as IValueTypeOption;
  },
  get currentCharacteristicProperties() {
    return [this.readable, this.writable, this.notify] as IProperty[];
  },
  get readable() {
    return (
      this.currentCharacteristic?.properties.read
        ? {
          title: "Readable",
          label: "Able to be read from",
          icon: "has.png",
        }
        : {
          title: "Un-readable",
          label: "Unable to be read from",
          icon: "none.png",
        }
    ) as IProperty;
  },
  get writable() {
    return (
      this.currentCharacteristic?.properties.write
        ? {
          title: "Writable",
          label: "Able to be written to",
          icon: "has.png",
        }
        : {
          title: "Un-writable",
          label: "Unable to be written to",
          icon: "none.png",
        }
    ) as IProperty;
  },
  get notify() {
    return (
      this.currentCharacteristic?.properties.notify ||
        this.currentCharacteristic?.properties.indicate
        ? {
          title: "Support notifications",
          label:
            "Able to be subscribed to notifications on changes to the characteristic",
          icon: "has.png",
        }
        : {
          title: "Does not support notifications/indications",
          label:
            "Unable to be subscribed to notifications/indications on changes to the characteristic",
          icon: "none.png",
        }
    ) as IProperty;
  },

  get currentCharacteristicCache() {
    if (this.currentCharacteristic === undefined) {
      return [];
    }
    const dataType = this.dateTypes[this.currentCharacteristic.uuid] || "hex";
    const cache: ICharacteristicCacheValue[] =
      this.characteristicsCache[this.currentCharacteristic.uuid];
    return cache.map((item) => {
      return {
        time: formatTimeWithoutDate(item.time),
        value: formatBytes(new Uint8Array(item.value), dataType),
      };
    });
  },

  // actions
  setCurrentDevice: action(function (
    this: IDeviceStore,
    device: BleDeviceService
  ) {
    this.currentDevice = device;
  }),

  getCurrentDevice: action(function (this: IDeviceStore) {
    return this.currentDevice;
  }),

  setCurrentCharacteristic: action(function (
    this: IDeviceStore,
    characteristic: ICharacteristic
  ) {
    this.currentCharacteristic = characteristic;
  }),
  getCurrentCharacteristic: action(function (this: IDeviceStore) {
    return this.currentCharacteristic;
  }),

  setConnected: action(function (this: IDeviceStore, status: boolean) {
    this.connected = status;
  }),

  setCharacteristicCache: action(function (
    this: IDeviceStore,
    { value, deviceId, characteristicId }: CharValueChangeType
  ) {
    if (deviceId !== this.currentDevice?.currentDevice?.deviceId) {
      return;
    }
    const cache = { ...this.characteristicsCache };
    const cacheValues = cache[characteristicId] || [];
    cacheValues.push({ time: new Date(), value });
    cache[characteristicId] = cacheValues;
    this.characteristicsCache = cache;
  }),
  setDateType: action(function (this: IDeviceStore, type: number) {
    if (this.currentCharacteristic === undefined) {
      return;
    }
    this.dateTypes[this.currentCharacteristic.uuid] =
      type === 0 ? "hex" : "str";
    this.characteristicsCache = { ...this.characteristicsCache }
  }),
  clearStore: action(function (this: IDeviceStore) {
    this.currentDevice = undefined;
    this.currentCharacteristic = undefined;
    this.connected = false;
    this.characteristicsCache = {};
    this.dateTypes = {};
  }),
});
