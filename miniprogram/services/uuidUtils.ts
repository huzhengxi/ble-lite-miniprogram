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
 * 根据 service uuid 获取 service name，如果没有获取到合适的名称则返回 uuid
 */
export function getServiceName(_serviceUUID: string): string {
  const serviceUUID = _serviceUUID.toUpperCase();
  switch (serviceUUID) {
    case servicesUUID.deviceInfo:
      return "Device Information";
    case servicesUUID.battery:
      return "Battery";
    case servicesUUID.heartRate:
      return "Heart Rate";
    case servicesUUID.oad:
      return "OAD";
    default:
      return uuid2Short(serviceUUID);
  }
}

/**
 * 根据 characteristic uuid 获取 characteristic name，如果没有获取到合适的名称则返回 uuid
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
          return "Model Number";
        case characteristicsUUID.deviceInfo.serialNumber:
          return "Serial Number";
        case characteristicsUUID.deviceInfo.firmwareRevision:
          return "Firmware Revision";
        case characteristicsUUID.deviceInfo.hardwareRevision:
          return "Hardware Revision";
        case characteristicsUUID.deviceInfo.softwareRevision:
          return "Software Revision";
        case characteristicsUUID.deviceInfo.manufacturerName:
          return "Manufacturer Name";
        default:
          return uuid2Short(characteristicUUID);
      }
    case servicesUUID.battery:
      switch (characteristicUUID) {
        case characteristicsUUID.battery.batteryLevel:
          return "Battery Level";
        default:
          return uuid2Short(characteristicUUID);
      }
    case servicesUUID.heartRate:
      switch (characteristicUUID) {
        case characteristicsUUID.heartRate.heartRateMeasurement:
          return "Heart Rate Measurement";
        case characteristicsUUID.heartRate.bodySensorLocation:
          return "Body Sensor Location";
        default:
          return uuid2Short(characteristicUUID);
      }
    case servicesUUID.oad:
      switch (characteristicUUID) {
        case characteristicsUUID.oad.oadControl:
          return "OAD Control";
        case characteristicsUUID.oad.oadPacket:
          return "OAD Packet";
        default:
          return uuid2Short(characteristicUUID);
      }
    default:
      return uuid2Short(characteristicUUID);
  }
}
