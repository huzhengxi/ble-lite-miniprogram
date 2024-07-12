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
  //key 为 characteristicUUID_read/write/notify
  characteristicsCache: Record<string, ICharacteristicCacheValue[]>;
  valueTypeOptions: IValueTypeOption[];
  dateTypes: Record<string, FormatType>;
  subscribedUUIDs: string[];

  // computed
  currentCharacteristicProperties: IProperty[];
  readable: boolean;
  writable: boolean;
  notify: boolean;
  dataType: FormatType;
  currentCharacteristicReadOrNotifyCache: { time: string; value: string }[];
  currentCharacteristicWriteCache: { time: string; value: string }[];
  currentTypeOption: IValueTypeOption;
  currentCharacteristicSubscribed: boolean;

  // actions
  setCurrentDevice: (device: BleDeviceService) => void;
  getCurrentDevice: () => BleDeviceService | undefined;

  setCurrentCharacteristic: (characteristic: ICharacteristic) => void;
  getCurrentCharacteristic: () => ICharacteristic | undefined;

  subscribedCharacteristic: (characteristicUUID: string) => void;
  unsubscribeCharacteristic: (characteristicUUID: string) => void;

  setConnected: (connected: boolean) => void;
  setCharacteristicCache: (
    value: CharValueChangeType,
    property: "read" | "write" | "notify"
  ) => void;
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
  subscribedUUIDs: [] as string[],

  // computed
  get currentCharacteristicSubscribed() {
    return this.subscribedUUIDs.includes(this.currentCharacteristic!.uuid);
  },
  get dataType() {
    return this.dateTypes[this.currentCharacteristic!.uuid] || "hex";
  },
  get currentTypeOption() {
    return this.valueTypeOptions.find(
      (item: IValueTypeOption) => item.value === this.dataType
    ) as IValueTypeOption;
  },
  get currentCharacteristicProperties() {
    return [
      {
        title: this.readable ? "Readable" : "Un-readable",
        label: this.readable
          ? "Able to be read from"
          : "Unable to be read from",
        icon: this.readable ? "has.png" : "none.png",
      },
      {
        title: this.writable ? "Writable" : "Un-writable",
        label: this.writable
          ? "Able to be written to"
          : "Unable to be written to",
        icon: this.writable ? "has.png" : "none.png",
      },
      {
        title: this.notify
          ? "Support notifications"
          : "Does not support notifications/indications",
        label: this.notify
          ? "Able to be subscribed to notifications on changes to the characteristic"
          : "Unable to be subscribed to notifications/indications on changes to the characteristic",
        icon: this.notify ? "has.png" : "none.png",
      },
    ] as IProperty[];
  },
  get readable() {
    return !!this.currentCharacteristic?.properties.read;
  },
  get writable() {
    return !!this.currentCharacteristic?.properties.write;
  },
  get notify() {
    return !!(
      this.currentCharacteristic?.properties.notify ||
      this.currentCharacteristic?.properties.indicate
    );
  },

  get currentCharacteristicReadOrNotifyCache() {
    if (this.currentCharacteristic === undefined) {
      return [];
    }
    const notifyKey = `${this.currentCharacteristic.uuid}_notify`;
    const readKey = `${this.currentCharacteristic.uuid}_read`;

    const dataType = this.dateTypes[this.currentCharacteristic.uuid] || "hex";
    const cache: ICharacteristicCacheValue[] = [
      ...(this.characteristicsCache[notifyKey] || []),
      ...(this.characteristicsCache[readKey] || []),
    ];


    return cache.map((item) => {
      return {
        time: formatTimeWithoutDate(item.time),
        value: formatBytes(new Uint8Array(item.value), dataType),
      };
    });
  },
  get currentCharacteristicWriteCache() {
    if (this.currentCharacteristic === undefined) {
      return [];
    }
    const dataType = this.dateTypes[this.currentCharacteristic.uuid] || "hex";
    const key = `${this.currentCharacteristic.uuid}_write`;
    const cache: ICharacteristicCacheValue[] =
      this.characteristicsCache[key] || [];
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
    { value, deviceId, characteristicId }: CharValueChangeType,
    property: "read" | "write" | "notify"
  ) {
    if (deviceId !== this.currentDevice?.currentDevice?.deviceId) {
      return;
    }
    const key = `${characteristicId}_${property}`;

    const cache = { ...this.characteristicsCache };
    const cacheValues = cache[key] || [];
    cacheValues.push({ time: new Date(), value });
    cache[key] = cacheValues;
    console.log("setCharacteristicCache:", key, cache);

    this.characteristicsCache = cache;
  }),
  setDateType: action(function (this: IDeviceStore, type: number) {
    if (this.currentCharacteristic === undefined) {
      return;
    }
    this.dateTypes[this.currentCharacteristic.uuid] =
      type === 0 ? "hex" : "str";
    this.characteristicsCache = { ...this.characteristicsCache };
  }),
  subscribedCharacteristic: action(function (
    this: IDeviceStore,
    characteristicUUID: string
  ) {
    this.subscribedUUIDs = [...this.subscribedUUIDs, characteristicUUID];
  }),
  unsubscribeCharacteristic: action(function (
    this: IDeviceStore,
    characteristicUUID: string
  ) {
    this.subscribedUUIDs = [
      ...this.subscribedUUIDs.filter((uuid) => uuid !== characteristicUUID),
    ];
  }),
  clearStore: action(function (this: IDeviceStore) {
    this.currentDevice = undefined;
    this.currentCharacteristic = undefined;
    this.connected = false;
    this.characteristicsCache = {};
    this.dateTypes = {};
    this.subscribedUUIDs = [];
  }),
});
