/*
 * Created by Tiger on 03/07/2024
 */

import { ECommandStatus, EErrorCode } from "./define";
import helper from "../utils/helper";
import { formatBytes, strToBytes, uint8Array2hexString } from "../utils/util";
import { IError } from "typings/types";

/**
 * 连接、管理蓝牙设备类
 */
export class BleDeviceService {
  private static LogTag = "BleDeviceService";
  // 超时时间，默认 20 秒
  private timeout: number = 20000;
  private scanTimer: any = null;
  private currentDevice: IBluetoothDevice | null = null;
  private isConnected: boolean = false;
  private print = (...args: any) =>
    helper.log(BleDeviceService.LogTag, ...args);
  // 待onBLECharacteristicValueChange方法处理的的命令map
  private commandMap: Map<string, ICommand> = new Map();

  constructor(currentDevice: IBluetoothDevice) {
    this.currentDevice = currentDevice;
    this.setupSubscriptions();
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
      this.isConnected = true;
      this.debug();
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
  }

  private async debug() {
    const service = await wx.getBLEDeviceServices({
      deviceId: this.currentDevice!.deviceId,
    });

    service.services.forEach(async (item) => {
      const characteristics = await wx.getBLEDeviceCharacteristics({
        deviceId: this.currentDevice!.deviceId,
        serviceId: item.uuid,
      });
      this.print("service:", item, "\n");
      this.print("characteristics:", characteristics.characteristics);

      characteristics.characteristics.forEach(async (characteristic) => {
        const { properties, uuid } = characteristic;
        this.print("characteristic:", characteristic);
        if (properties.write) {
          this.print("write characteristic:", characteristic);
          // await this.write({
          //   writeCharacteristicUUID: uuid,
          //   type: ECommandStatus.GetDeviceStatus,
          //   data: strToBytes(""),
          // });
        }
        if (properties.read) {
          this.print("read characteristic:", characteristic);
          const readValue = await wx.readBLECharacteristicValue({
            deviceId: this.currentDevice!.deviceId,
            serviceId: item.uuid,
            characteristicId: uuid,
          });

          this.print("readValue:", readValue);
        }
        if (properties.notify) {
          this.print("notify characteristic:", characteristic);
          // await this.notify({
          //   notifyCharacteristicUUID: uuid,
          //   type: ECommandStatus.GetDeviceStatus,
          // });
        }
      });

      this.print("\n\n\n");
    });
  }

  /**
   * 写入数据，这里不传 serviceUUID是因为写入的服务是固定不变的
   * @returns
   */
  // private async write({
  //   writeCharacteristicUUID,
  //   type,
  //   data,
  //   noResponse = false,
  //   isSplitReceive = false,
  //   timeout = this.timeout,
  // }: IWriteCommandOption): Promise<
  //   IError | { success: boolean; data: Uint8Array }
  // > {
  //   if (!this.isConnected) {
  //     return Promise.resolve({
  //       errCode: EErrorCode.Disconnected,
  //       errMessage: "蓝牙已断开",
  //     } as IError);
  //   }
  //   const commandKey = `${notifyCharacteristicUUID}_${type}`;
  //   if (this.commandMap.has(commandKey)) {
  //     return Promise.resolve({
  //       errCode: EErrorCode.InProgress,
  //       errMessage: "上一次操作未完成",
  //     } as IError);
  //   }

  //   return new Promise(async (resolve) => {
  //     // 超时回复
  //     const timeoutId = setTimeout(
  //       () => {
  //         this.commandMap.delete(commandKey);
  //         resolve({
  //           errCode: EErrorCode.Timeout,
  //           errMessage: "写入数据超时",
  //         });
  //       },
  //       timeout,
  //       undefined
  //     );
  //     try {
  //       if (!noResponse) {
  //         this.commandMap.set(commandKey, {
  //           type,
  //           timeoutId,
  //           isSplitReceive,
  //           resolve,
  //           receivedData: new Uint8Array([]),
  //         });
  //       }

  //       let writeData = data ? new Uint8Array(data) : new Uint8Array([]);
  //       // writeData 前面增加一个字节，用于标识数据长度
  //       writeData = new Uint8Array([writeData.length + 1, type, ...writeData]);

  //       let total = Math.ceil(writeData.length / 20);
  //       // 如果writeData长度超过20，则分包发送
  //       for (let i = 0; i < total; i++) {
  //         const start = i * 20;
  //         const end = (i + 1) * 20;
  //         const currentData = writeData.slice(start, end);
  //         this.print(
  //           `写入数据[${writeCharacteristicUUID}]`,
  //           uint8Array2hexString(currentData)
  //         );
  //         await wx.writeBLECharacteristicValue({
  //           deviceId: this.currentDevice!.deviceId,
  //           serviceId: QingUUID.DEVICE_BASE_SERVICE_UUID,
  //           characteristicId: writeCharacteristicUUID,
  //           value: currentData.buffer,
  //         });
  //       }

  //       // 不需要回复的话就立即返回，比如分包发送的话 只要发送成功就可以了
  //       if (noResponse) {
  //         clearTimeout(timeoutId);
  //         // 这里延迟100毫秒后再返回
  //         setTimeout(() => {
  //           resolve({ success: true, data: new Uint8Array() });
  //         }, 100);
  //       }
  //     } catch (error: any) {
  //       this.print("写入数据出错：", error);
  //       // 执行失败
  //       resolve(error);
  //       // 清理定时器
  //       clearTimeout(timeoutId);
  //       this.commandMap.delete(commandKey);
  //     }
  //   });
  // }

  /**
   * 蓝牙特征值变化
   */
  private onBLECharacteristicValueChange = ({
    characteristicId,
    deviceId,
    value,
  }: CharValueChangeType) => {
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
  };

  private onBLEConnectionStateChange = ({
    deviceId,
    connected,
  }: ConnectStateChangeType) => {
    this.print("onBLEConnectionStateChange:", deviceId, connected);
    if (deviceId !== this.currentDevice?.deviceId) {
      return;
    }
    this.isConnected = connected;
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
      this.isConnected = false;
      this.currentDevice = null;
      this.removeSubscriptions();
    }
  }

  public release() {
    this.disconnect();
  }
}
