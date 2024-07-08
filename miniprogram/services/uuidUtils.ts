/*
 * Created by Tiger on 06/07/2024
 * 定义一些公共的 service uuid 和 characteristic uuid
 */

const servicesUUID = {
  deviceInfo: "0000180a-0000-1000-8000-00805f9b34fb",
  battery: "0000180f-0000-1000-8000-00805f9b34fb",
  heartRate: "0000180d-0000-1000-8000-00805f9b34fb",
  oad: "f000ffc0-0451-4000-b000-000000000000",
};

const characteristicsUUID = {
  deviceInfo: {
    modelNumber: "00002a24-0000-1000-8000-00805f9b34fb",
    serialNumber: "00002a25-0000-1000-8000-00805f9b34fb",
    firmwareRevision: "00002a26-0000-1000-8000-00805f9b34fb",
    hardwareRevision: "00002a27-0000-1000-8000-00805f9b34fb",
    softwareRevision: "00002a28-0000-1000-8000-00805f9b34fb",
    manufacturerName: "00002a29-0000-1000-8000-00805f9b34fb",
  },
  battery: {
    batteryLevel: "00002a19-0000-1000-8000-00805f9b34fb",
  },
  heartRate: {
    heartRateMeasurement: "00002a37-0000-1000-8000-00805f9b34fb",
    bodySensorLocation: "00002a38-0000-1000-8000-00805f9b34fb",
  },
  oad: {
    oadControl: "f000ffc1-0451-4000-b000-000000000000",
    oadPacket: "f000ffc2-0451-4000-b000-000000000000",
  },
};

export { servicesUUID, characteristicsUUID };

/**
 * 根据 service uuid 获取 service name，如果没有获取到合适的名称则返回 uuid
 */
export function getServiceName(_serviceUUID: string): string {
  const serviceUUID = _serviceUUID.toLowerCase();
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
      return serviceUUID;
  }
}

/**
 * 根据 characteristic uuid 获取 characteristic name，如果没有获取到合适的名称则返回 uuid
 */
export function getCharacteristicName(
  _serviceUUID: string,
  _characteristicUUID: string
): string {
  const characteristicUUID = _characteristicUUID.toLowerCase();
  const serviceUUID = _serviceUUID.toLowerCase();
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
          return characteristicUUID;
      }
    case servicesUUID.battery:
      switch (characteristicUUID) {
        case characteristicsUUID.battery.batteryLevel:
          return "Battery Level";
        default:
          return characteristicUUID;
      }
    case servicesUUID.heartRate:
      switch (characteristicUUID) {
        case characteristicsUUID.heartRate.heartRateMeasurement:
          return "Heart Rate Measurement";
        case characteristicsUUID.heartRate.bodySensorLocation:
          return "Body Sensor Location";
        default:
          return characteristicUUID;
      }
    case servicesUUID.oad:
      switch (characteristicUUID) {
        case characteristicsUUID.oad.oadControl:
          return "OAD Control";
        case characteristicsUUID.oad.oadPacket:
          return "OAD Packet";
        default:
          return characteristicUUID;
      }
    default:
      return characteristicUUID;
  }
}
