import { RSSI2Level } from "../services/BleScanService";
import { random } from 'lodash'

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
      name: generateRandomString(40),
      rssi,
      rssiLevel: RSSI2Level(rssi),
      mac: "582D34000000",
      broadcastData: "hello",
      scanInterval: random(300, 1000),
    });
  }

  return list.sort((a, b) => b.rssi - a.rssi);
};


function generateRandomString(length: number) {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  const charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}