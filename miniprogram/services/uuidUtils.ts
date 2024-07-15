import { uuid2Short } from "../utils/util";
/*
 * Created by Tiger on 06/07/2024
 * 定义一些公共的 service uuid 和 characteristic uuid
 */

const servicesUUID = {
  deviceInfo: "0000180A-0000-1000-8000-00805F9B34FB",
  battery: "0000180F-0000-1000-8000-00805F9B34FB",
  heartRate: "0000180D-0000-1000-8000-00805F9B34FB",
  oad: "F000FFC0-0451-4000-B000-000000000000",
};

const characteristicsUUID = {
  deviceInfo: {
    modelNumber: "00002A24-0000-1000-8000-00805F9B34FB",
    serialNumber: "00002A25-0000-1000-8000-00805F9B34FB",
    firmwareRevision: "00002A26-0000-1000-8000-00805F9B34FB",
    hardwareRevision: "00002A27-0000-1000-8000-00805F9B34FB",
    softwareRevision: "00002A28-0000-1000-8000-00805F9B34FB",
    manufacturerName: "00002A29-0000-1000-8000-00805F9B34FB",
  },
  battery: {
    batteryLevel: "00002A19-0000-1000-8000-00805F9B34FB",
  },
  heartRate: {
    heartRateMeasurement: "00002A37-0000-1000-8000-00805F9B34FB",
    bodySensorLocation: "00002A38-0000-1000-8000-00805F9B34FB",
  },
  oad: {
    oadControl: "F000FFC1-0451-4000-B000-000000000000",
    oadPacket: "F000FFC2-0451-4000-B000-000000000000",
  },
};

export { servicesUUID, characteristicsUUID };

/**
 * 根据 service uuid 获取 服务名称（中文描述），如果没有获取到合适的名称则返回 uuid
 */
export function getServiceName(_serviceUUID: string): string {
  const serviceUUID = _serviceUUID.toUpperCase();
  switch (serviceUUID) {
    case servicesUUID.deviceInfo:
      return "设备信息";
    case servicesUUID.battery:
      return "电池";
    case servicesUUID.heartRate:
      return "心率";
    case servicesUUID.oad:
      return "OAD";
    default:
      return uuid2Short(serviceUUID);
  }
}

/**
 * 根据 characteristic uuid 获取 characteristic 名称，如果没有获取到合适的名称则返回 uuid
 */
export function getCharacteristicName(
  _serviceUUID: string,
  _characteristicUUID: string
): string {
  const characteristicUUID = _characteristicUUID.toUpperCase();
  const serviceUUID = _serviceUUID.toUpperCase();
  switch (serviceUUID) {
    case servicesUUID.deviceInfo:
      switch (characteristicUUID) {
        case characteristicsUUID.deviceInfo.modelNumber:
          return "型号";
        case characteristicsUUID.deviceInfo.serialNumber:
          return "序列号";
        case characteristicsUUID.deviceInfo.firmwareRevision:
          return "固件版本";
        case characteristicsUUID.deviceInfo.hardwareRevision:
          return "硬件版本";
        case characteristicsUUID.deviceInfo.softwareRevision:
          return "软件版本";
        case characteristicsUUID.deviceInfo.manufacturerName:
          return "制造商";
        default:
          return uuid2Short(characteristicUUID);
      }
    case servicesUUID.battery:
      switch (characteristicUUID) {
        case characteristicsUUID.battery.batteryLevel:
          return "电量";
        default:
          return uuid2Short(characteristicUUID);
      }
    case servicesUUID.heartRate:
      switch (characteristicUUID) {
        case characteristicsUUID.heartRate.heartRateMeasurement:
          return "心率测量";
        case characteristicsUUID.heartRate.bodySensorLocation:
          return "传感器位置";
        default:
          return uuid2Short(characteristicUUID);
      }
    case servicesUUID.oad:
      switch (characteristicUUID) {
        case characteristicsUUID.oad.oadControl:
          return "OAD 控制";
        case characteristicsUUID.oad.oadPacket:
          return "OAD 数据包";
        default:
          return uuid2Short(characteristicUUID);
      }
    default:
      return uuid2Short(characteristicUUID);
  }
}
