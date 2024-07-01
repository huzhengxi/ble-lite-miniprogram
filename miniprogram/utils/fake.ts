import { RSSI2Level } from "../services/BleScanService";

/**
 * 模拟一个长度为20的IBLEDevice数组 name为随机字符串，rssi为0 ~ 4之间的随机数
 */
export const generateFakeBLEDeviceList = () => {

  const list: IBLEDeviceData[] = [];
  const sysInfo = wx.getSystemInfoSync();
  if (sysInfo.platform !== "devtools") {
    return [];
  }
  for (let i = 0; i < 50; i++) {
    const rssi = Math.floor(Math.random() * 70) - 72;
    list.push({
      deviceId: Math.random().toString(36).substr(2),
      name: Math.random().toString(36).substr(2),
      rssi,
      rssiLevel: RSSI2Level(rssi),
      mac: "582D34000000",
      broadcastData: "hello ",
    });
  }
  
  return list.sort((a, b) => b.rssi - a.rssi);
};
