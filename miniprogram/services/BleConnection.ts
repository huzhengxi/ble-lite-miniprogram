/**
 * BLE
 */

import helper from "./helper";
import {
  hexString2ArrayArraybuffer,
  number2Hex,
  formatBytes,
  strToBytes,
  uint8Array2hexString,
  bytes2SignedInt,
} from "../utils/util";
import { Command, CommandCallback, CommandType } from "./Command";
import { UuidInfo } from "./UuidInfo";

type ConnectStateChangeType =
  WechatMiniprogram.OnBLEConnectionStateChangeListenerResult;
type CharValueChangeType =
  WechatMiniprogram.OnBLECharacteristicValueChangeListenerResult;

export type DataType = boolean | Uint8Array | "disconnect";
interface CommandContext {
  command: Command;
  // 成功时回调
  resolve: (result: DataType) => void;
  // 超时timer id
  timerID: number;
  callback?: CommandCallback;
}

export default class BleConnection {
  // 日志FLAG
  private LogFlag = "BleDevice>> ";
  // 操作超时时间
  private Timeout = 5000;
  // 设备 Id
  private deviceId: string;

  private connected = false;

  // 待回复的命令集合，每次调用 write 方法写入数据时候，都会在这个集合中添加一项，等待
  // onBLECharacteristicValueChange 回调
  private commandMap: Map<string, CommandContext>;
  private checkedServices: Set<string> = new Set();
  private notificationCallbacks: Map<string, { onValueChange: (value: ArrayBuffer) => void }> =
    new Map();

  constructor(deviceId: string) {
    this.deviceId = deviceId;
    this.setupSubscriptions();
    this.commandMap = new Map();
  }

  /**
   * 蓝牙服务是否忙碌
   */
  isBleBusy() {
    return Object.keys(this.commandMap).length > 0;
  }

  /**
   * 获取蓝牙状态
   */
  isConnected() {
    return this.connected;
  }

  /**
   * 连接
   */
  async connect() {
    try {
      //连接
      await wx.createBLEConnection({
        deviceId: this.deviceId,
        timeout: 10000,
      });
      helper.log(this.LogFlag, "连接设备成功", this.deviceId);
      this.connected = true;
    } catch (error) {
      helper.log(this.LogFlag, "连接设备失败", error);
      throw error;
    }
  }

  /**
   * 生成command key
   */
  private generateCommandKey(command: Command) {
    return `${command.notifyServiceUUID || command.serviceUUID}-${command.notifyCharacteristicUUID || command.characteristicUUID
      }`;
  }

  public getPDULength() {
    return wx.getBLEMTU({
      deviceId: this.deviceId,
      writeType: "writeNoResponse",
    });
  }

  /**
   * 写数据到设备
   */
  private write(command: Command): Promise<DataType> {
    if (!this.connected) {
      helper.log(this.LogFlag, "蓝牙断开");
      return Promise.resolve("disconnect");
    }
    helper.log(this.LogFlag, `写入数据,command:${command.toString()}`);
    return new Promise(async (resolve, _) => {
      const commandKey = this.generateCommandKey(command);

      const checked = await this.checkUUIDs(
        command.serviceUUID!,
        command.characteristicUUID!
      );
      if (!checked) {
        helper.log(this.LogFlag, "UUID 不匹配");
        return resolve(false);
      }
      const exist = this.commandMap.get(commandKey);
      if (exist) {
        helper.log(this.LogFlag, "命令已存在，返回");
        return;
      }
      // 创建定时器，超时未回复时调用
      const timerID = setTimeout(
        () => {
          helper.log(this.LogFlag, `命令执行超时:${command.toString()}`);
          resolve(false);
          this.commandMap.delete(commandKey);
        },
        this.Timeout,
        undefined
      );

      // 保存在待处理队列中，在 onBLECharacteristicValueChange 回调中处理
      const dataResponse: CommandContext = {
        timerID,
        resolve,
        command,
      };

      this.commandMap.set(commandKey, dataResponse);

      try {
        await wx.writeBLECharacteristicValue({
          deviceId: this.deviceId!,
          serviceId: command.serviceUUID!,
          characteristicId: command.characteristicUUID!,
          value: command.data!,
        });
        if (command.type === CommandType.WRITE_NO_RESPONSE) {
          clearTimeout(timerID);
          this.commandMap.delete(commandKey);
          resolve(true);
        }
      } catch (error) {
        clearTimeout(timerID);
        this.commandMap.delete(commandKey);
        resolve(false);
        helper.log(this.LogFlag, "写入数据失败", error);
      }
    });
  }

  /**
   * 断开蓝牙
   */
  async disconnect() {
    if (this.connected) {
      // 移除状态监听
      this.removeSubscriptions();
      await wx.closeBLEConnection({
        deviceId: this.deviceId,
      });
    }
  }

  /**
   * 检查服务
   */
  private async checkUUIDs(serviceUUID: string, characteristicUUID: string) {
    const key = `${serviceUUID}-${characteristicUUID}`;
    if (this.checkedServices.has(key)) {
      return Promise.resolve(true);
    }

    this.checkedServices.add(key);
    // 发现服务
    const services = await wx.getBLEDeviceServices({ deviceId: this.deviceId });

    // 注册服务
    const findServices = services.services.filter((service) => {
      return service.uuid.toLowerCase().includes(serviceUUID.toLowerCase());
    });

    if (findServices.length === 0) {
      helper.log(this.LogFlag, "未找到目标服务");
      return Promise.resolve(false);
    }

    // 获取特征
    const characteristics = await wx.getBLEDeviceCharacteristics({
      deviceId: this.deviceId,
      serviceId: findServices[0].uuid,
    });

    const findCharacteristics = characteristics.characteristics.filter((c) =>
      c.uuid.toLowerCase().includes(characteristicUUID.toLowerCase())
    );

    if (findCharacteristics.length === 0) {
      helper.log(this.LogFlag, "未找到目标特征");
      return Promise.resolve(false);
    }
    return Promise.resolve(true);
  }

  /**
   * 注册服务
   */
  public async enableNotification(
    serviceId: string,
    characteristicId: string,
    ignoreError: boolean = true,
    onValueChange: (value: ArrayBuffer) => void = () => { }
  ) {
    try {
      const services = await wx.getBLEDeviceServices({
        deviceId: this.deviceId,
      });
      helper.log(
        this.LogFlag,
        "all-services:",
        services.services.map((s) => s.uuid).join(",")
      );
      // 获取蓝牙低功耗设备某个服务中所有特征 (characteristic)。
      const characteristics = await wx.getBLEDeviceCharacteristics({
        deviceId: this.deviceId,
        serviceId,
      });

      helper.log(
        this.LogFlag,
        "获取到所有特征:",
        characteristics.characteristics
      );

      // 查找通知服务
      const findNotifyCharacteristics = characteristics.characteristics.filter(
        (c) =>
          c.uuid.toLowerCase().includes(characteristicId.toLowerCase()) &&
          c.properties.notify
      );
      if (findNotifyCharacteristics.length === 0) {
        helper.log(this.LogFlag, "未找到通知特征");
        return ignoreError ? true : false;
      }

      const key = `${serviceId}-${characteristicId}`;
      this.notificationCallbacks.set(key, {
        onValueChange,
      });

      // 通知监听
      return wx.notifyBLECharacteristicValueChange({
        deviceId: this.deviceId,
        serviceId,
        characteristicId,
        state: true,
      });
    } catch (error) {
      helper.log(this.LogFlag, error);
    }
  }

  public disableNotification(serviceId: string,
    characteristicId: string) {
    wx.notifyBLECharacteristicValueChange({
      deviceId: this.deviceId,
      serviceId,
      characteristicId,
      state: false
    })
  }

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
   * 蓝牙低功耗设备的特征值变化事件的监听函数
   */
  private onBLEConnectionStateChange = ({
    deviceId,
    connected,
  }: ConnectStateChangeType) => {
    helper.log(this.LogFlag, "蓝牙状态发生变化:", connected);
    if (deviceId === this.deviceId) {
      this.connected = connected;
    }
  };

  private onBLECharacteristicValueChange = (data: CharValueChangeType) => {
    const { deviceId, serviceId, characteristicId: uuid, value } = data;
    const key = `${serviceId}-${uuid}`;
    const commandContext = this.commandMap.get(key);
    if (this.notificationCallbacks.has(key)) {
      const onValueChange = this.notificationCallbacks.get(key)?.onValueChange;
      onValueChange?.(value);
    }

    if (deviceId !== this.deviceId || !commandContext) {
      return;
    }

    const recvUint8ArrayValue = new Uint8Array(value);
    helper.log(
      this.LogFlag,
      "CharacteristicValueChange",
      deviceId,
      serviceId,
      uuid,
      uint8Array2hexString(recvUint8ArrayValue)
    );

    commandContext.callback?.success(this, commandContext.command, value);
    commandContext.resolve(new Uint8Array(value));
    clearTimeout(commandContext.timerID);
    this.commandMap.delete(key);
  };

  private writeCommand(
    callback: CommandCallback | undefined,
    command: Command
  ) {
    return this.write(command)
      .then((result) => {
        if (result === "disconnect") {
          callback?.error(this, command, "蓝牙已断开");
          return "disconnect";
        } else if (result) {
          callback?.success(this, command, result);
          return result;
        } else {
          callback?.error(this, command, "写入数据失败");
          return false;
        }
      })
      .catch((error) => {
        callback?.error(this, command, error);
        return false;
      });
  }

  private enableNotifyCommand(callback: CommandCallback, command: Command) {
    this.enableNotification(command.serviceUUID!, command.characteristicUUID!)
      .then((result) => {
        if (result) {
          callback.success(this, command, result);
        } else {
          callback.error(this, command, "开启通知失败");
        }
      })
      .catch((error) => {
        callback.error(this, command, error);
      });
  }

  private async readCommand(
    callback: CommandCallback | undefined,
    command: Command
  ) {
    const checked = await this.checkUUIDs(
      command.serviceUUID!,
      command.characteristicUUID!
    );
    if (!checked) {
      callback?.error(this, command, "UUID 不匹配");
      throw new Error("UUID 不匹配");
    }

    return new Promise<DataType>((resolve, reject) => {
      const key = `${command.serviceUUID}-${command.characteristicUUID}`;
      const exist = this.commandMap.get(key);
      if (exist) {
        callback?.error(this, command, "命令已存在");
        reject("命令已存在");
      }
      const timerID = setTimeout(() => {
        callback?.error(this, command, "读取数据超时");
        this.commandMap.delete(key);
        reject("读取数据超时");
      }, this.Timeout);

      const dataResponse: CommandContext = {
        timerID,
        resolve,
        command,
        callback,
      };
      this.commandMap.set(key, dataResponse);

      wx.readBLECharacteristicValue({
        deviceId: this.deviceId,
        serviceId: command.serviceUUID!,
        characteristicId: command.characteristicUUID!,
      }).catch((error) => {
        callback?.error(this, command, error);
        reject(error);
      });
    });
  }

  private async disableNotifyCommand(
    callback: CommandCallback,
    command: Command
  ) {
    const key = `${command.serviceUUID}-${command.characteristicUUID}`;
    this.notificationCallbacks.delete(key);
    callback.success(this, command, true);
  }

  public sendCommand(callback: CommandCallback, command: Command) {
    switch (command.type) {
      case CommandType.WRITE:
      case CommandType.WRITE_NO_RESPONSE:
        this.writeCommand(callback, command);

        break;
      case CommandType.READ:
        this.readCommand(callback, command);
        break;
      case CommandType.ENABLE_NOTIFY:
        this.enableNotifyCommand(callback, command);
        break;
      case CommandType.DISABLE_NOTIFY:
        this.disableNotifyCommand(callback, command);
        break;
      case CommandType.REQUEST_MTU:
        // this.requestMtuCommand(callback, command);
        break;
      default:
        break;
    }
  }

  public async getVersion() {
    const command = new Command(
      UuidInfo.VERSION_SERVICE_UUID,
      UuidInfo.VERSION_CHARACTERISTIC_UUID,
      CommandType.READ
    );
    try {
      const version = await this.readCommand(undefined, command);
      if (typeof version === "object") {
        return (formatBytes(version, "str") as string).trim().replace("\0", "");
      }
      return "unknown";
    } catch (error) {
      console.log("读取版本失败", error);
    }
  }

  /**
   * 获取广播间隔
   */
  public async getBroadcastInterval() {
    // data [0x01, 0x03]
    const command = new Command(
      UuidInfo.BASE_WRITE_SERVICE_UUID,
      UuidInfo.BASE_WRITE_CHARACTERISTIC_UUID,
      CommandType.WRITE,
      hexString2ArrayArraybuffer("0103")
    );
    command.notifyCharacteristicUUID = UuidInfo.BASE_NOTIFY_CHARACTERISTIC_UUID;
    try {
      const interval = await this.writeCommand(undefined, command);
      if (typeof interval === "object" && interval.length === 4) {
        return formatBytes(interval.slice(2), "dec") as number;
      }
      return 0;
    } catch (error) {
      console.log("读取广播间隔失败", error);
      return 0;
    }
  }

  /**
   * 获取广播发射功率
   */
  public async getBroadcastPower() {
    // data [0x01, 0x05]
    const command = new Command(
      UuidInfo.BASE_WRITE_SERVICE_UUID,
      UuidInfo.BASE_WRITE_CHARACTERISTIC_UUID,
      CommandType.WRITE,
      hexString2ArrayArraybuffer("0105")
    );
    command.notifyCharacteristicUUID = UuidInfo.BASE_NOTIFY_CHARACTERISTIC_UUID;
    try {
      const interval = await this.writeCommand(undefined, command);
      if (typeof interval === "object" && interval.length === 4) {
        return bytes2SignedInt(interval.slice(2));
      }
      return 0;
    } catch (error) {
      console.log("读取广播发射功率失败", error);
      return 0;
    }
  }

  /**
   * 获取广播通道
   */
  public async getBroadcastChannel() {
    // data [0x01, 0x1f]
    const command = new Command(
      UuidInfo.BASE_WRITE_SERVICE_UUID,
      UuidInfo.BASE_WRITE_CHARACTERISTIC_UUID,
      CommandType.WRITE,
      hexString2ArrayArraybuffer("011f")
    );
    command.notifyCharacteristicUUID = UuidInfo.BASE_NOTIFY_CHARACTERISTIC_UUID;
    try {
      const interval = await this.writeCommand(undefined, command);
      if (typeof interval === "object" && interval.length === 3) {
        // bit0：通道37 bit1: 通道38; bit2: 通道39;
        const originalChannels = formatBytes(
          interval.slice(2),
          "dec"
        ) as number;
        const channelArray: number[] = [];
        if (originalChannels & 0x01) {
          channelArray.push(37);
        }
        if (originalChannels & 0x02) {
          channelArray.push(38);
        }
        if (originalChannels & 0x04) {
          channelArray.push(39);
        }
        return channelArray.join(",");
      }
      return "";
    } catch (error) {
      console.log("读取广播通道失败", error);
      return "";
    }
  }

  /**
   * 设置广播间隔、发射功率、广播通道
   */

  public async setBroadcastInfo(hexValue: string) {
    const command = new Command(
      UuidInfo.BASE_WRITE_SERVICE_UUID,
      UuidInfo.BASE_WRITE_CHARACTERISTIC_UUID,
      CommandType.WRITE,
      hexString2ArrayArraybuffer(hexValue)
    );
    command.notifyCharacteristicUUID = UuidInfo.BASE_NOTIFY_CHARACTERISTIC_UUID;
    try {
      const interval = await this.writeCommand(undefined, command);
      if (typeof interval === "object" && interval.length > 3) {
        return formatBytes(interval.slice(3), "dec") === 0;
      } else if (typeof interval === "boolean") {
        return interval;
      }
      return false;
    } catch (error) {
      console.log("设置广播间隔、发射功率、广播通道失败", error);
      return false;
    }
  }
}
