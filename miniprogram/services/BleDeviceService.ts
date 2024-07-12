/*
 * Created by Tiger on 03/07/2024
 */

import helper from "../utils/helper";
import {
  formatBytes,
  hexString2ArrayArraybuffer,
  strToBytes,
  uint8Array2hexString,
  uuid2Short,
} from "../utils/util";
import { getCharacteristicName, getServiceName } from "./uuidUtils";
import { deviceStore } from "../mobx/device-store";

/**
 * 连接、管理蓝牙设备类
 */
export class BleDeviceService {
  // service map； key 为 service uuid value为 [WechatMiniprogram.BLECharacteristic]
  public services: IDeviceService[] = [];
  public currentDevice: IBLEDeviceData | null = null;

  private static LogTag = "BleDeviceService";
  // 超时时间，默认 20 秒
  private timeout: number = 1000;
  private isConnected: boolean = false;
  private print = (...args: any) =>
    helper.log(BleDeviceService.LogTag, ...args);
  // 待onBLECharacteristicValueChange方法处理的的命令map
  private commandMap: Map<string, ICommand> = new Map();

  constructor(currentDevice: IBLEDeviceData) {
    this.currentDevice = currentDevice;
    this.setupSubscriptions();
  }

  private setConnected(connected: boolean) {
    this.isConnected = connected;
    deviceStore.setConnected(connected);
  }

  public readAgain(serviceUUID: string, characteristicUUID: string) {
    wx.readBLECharacteristicValue({
      deviceId: this.currentDevice!.deviceId,
      serviceId: serviceUUID,
      characteristicId: characteristicUUID,
    });
  }

  private async write(
    serviceId: string,
    characteristicId: string,
    data: string,
    type: FormatType
  ) {
    const value = type === "hex"
      ? hexString2ArrayArraybuffer(data)
      : new Uint8Array(strToBytes(data)).buffer
      
    deviceStore.setCharacteristicCache({
      value,
      deviceId: this.currentDevice!.deviceId,
      characteristicId: characteristicId,
      serviceId
    })

    wx.writeBLECharacteristicValue({
      deviceId: this.currentDevice!.deviceId,
      serviceId,
      characteristicId,
      value
    });
  }

  /**
   * 连接设备
   * @param timeout 超时时间
   */
  public async startConnect(timeout: number = 15000): Promise<boolean> {
    try {
      if (!this.currentDevice) {
        return false;
      }
      // 开始连接前设置屏幕长亮
      wx.setKeepScreenOn({
        keepScreenOn: true,
      });

      await wx.createBLEConnection({
        deviceId: this.currentDevice.deviceId,
        timeout: timeout,
      });

      // 设置连接状态
      this.setConnected(true);

      // 发现服务
      await this.discoverService();
      return true;
    } catch (error) {
      this.print("连接失败", error);
      return false;
    } finally {
      // 结束连接后取消屏幕长亮
      wx.setKeepScreenOn({
        keepScreenOn: false,
      });
    }
  }/*
 * Created by Tiger on 12/07/2024
 */


  private async discoverService() {
    const services = await wx.getBLEDeviceServices({
      deviceId: this.currentDevice!.deviceId,
    });

    for (const service of services.services) {
      const characteristics = await wx.getBLEDeviceCharacteristics({
        deviceId: this.currentDevice!.deviceId,
        serviceId: service.uuid,
      });
      this.print("service:", service, "\n");
      this.print("characteristics:", characteristics.characteristics);

      let characs: ICharacteristic[] = [];
      for (const characteristic of characteristics.characteristics) {
        let value = "";
        let strProperties = "Properties: ";
        if (characteristic.properties.read) {
          const valueRes = await this.read(service.uuid, characteristic.uuid);
          value = valueRes.data || "";
        }
        if (characteristic.properties.write) {
          strProperties += "Write ";
        }
        if (characteristic.properties.read) {
          strProperties += "Read ";
        }
        if (characteristic.properties.notify) {
          strProperties += "Notify ";
        }

        if (characteristic.properties.writeNoResponse) {
          strProperties += "WriteNoResponse ";
        }

        characs.push({
          ...characteristic,
          name: getCharacteristicName(service.uuid, characteristic.uuid),
          value,
          strProperties,
          serviceUUID: service.uuid,
          shortServiceUUID: uuid2Short(service.uuid),
          shortCharacteristicUUID: uuid2Short(characteristic.uuid),
        });
      }
      this.services.push({
        serviceUUID: service.uuid,
        serviceName: getServiceName(service.uuid),
        characteristics: characs,
        shortServiceUUID: uuid2Short(service.uuid),
      });
    }
  }

  private async read(serviceUUID: string, characteristicUUID: string) {
    return new Promise<{ success: boolean; data?: string }>(async (resolve) => {
      const timeoutId = setTimeout(
        () => {
          this.commandMap.delete(characteristicUUID);
          resolve({
            success: false,
          });
        },
        this.timeout,
        undefined
      );
      this.commandMap.set(characteristicUUID, {
        timeoutId,
        resolve,
        formatType: "str",
      });
      try {
        await wx.readBLECharacteristicValue({
          deviceId: this.currentDevice!.deviceId,
          serviceId: serviceUUID,
          characteristicId: characteristicUUID,
        });
      } catch (error) {
        this.print("读取数据失败", error);
        this.commandMap.delete(characteristicUUID);
        clearTimeout(timeoutId);
        resolve({
          success: false,
        });
      }
    });
  }

  /**
   * 蓝牙特征值变化
   */
  private onBLECharacteristicValueChange = (charValue: CharValueChangeType) => {
    const { characteristicId, deviceId, value } = charValue;
    deviceStore.setCharacteristicCache(charValue);
    if (deviceId !== this.currentDevice?.deviceId) {
      this.print("onBLECharacteristicValueChange: deviceId 不匹配", deviceId);
      return;
    }
    this.print(
      "onBLECharacteristicValueChange:",
      characteristicId,
      uint8Array2hexString(new Uint8Array(value)),
      "\n",
      "uf8:",
      formatBytes(new Uint8Array(value), "str")
    );
    const command = this.commandMap.get(characteristicId);
    if (!command) {
      this.print("未找到对应的命令", characteristicId);
      // todo notify command and value
      return;
    }
    clearTimeout(command.timeoutId);
    const resolveData = formatBytes(new Uint8Array(value), command.formatType);
    command.resolve({ success: true, data: resolveData });
  };

  private onBLEConnectionStateChange = ({
    deviceId,
    connected,
  }: ConnectStateChangeType) => {
    this.print("onBLEConnectionStateChange:", deviceId, connected);
    if (deviceId !== this.currentDevice?.deviceId) {
      return;
    }
    this.setConnected(connected);
    if (!connected) {
      this.removeSubscriptions();
    }
  };

  /**
   * 订阅状态变化
   */
  private setupSubscriptions() {
    // 监听蓝牙低功耗设备的特征值变化事件
    wx.onBLECharacteristicValueChange(this.onBLECharacteristicValueChange);
    wx.onBLEConnectionStateChange(this.onBLEConnectionStateChange);
  }

  /**
   * 移除状态
   */
  private removeSubscriptions() {
    wx.offBLECharacteristicValueChange();
    wx.offBLEConnectionStateChange();
  }

  /**
   * 断开连接
   */
  public async disconnect() {
    try {
      if (this.isConnected) {
        await wx.closeBLEConnection({
          deviceId: this.currentDevice!.deviceId,
        });
      }
    } catch (error) {
      this.print("断开连接失败", error);
      throw error;
    } finally {
      this.setConnected(false);

      this.currentDevice = null;
      this.removeSubscriptions();
    }
  }

  public release() {
    this.disconnect();
  }
}
