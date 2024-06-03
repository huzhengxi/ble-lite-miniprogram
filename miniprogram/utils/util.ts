import { shouldCompute } from "mobx-miniprogram/lib/internal";

export const formatTime = (date: Date = new Date()) => {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const hour = date.getHours();
  const minute = date.getMinutes();
  const second = date.getSeconds();

  return (
    [year, month, day].map(formatNumber).join("/") +
    " " +
    [hour, minute, second].map(formatNumber).join(":")
  );
};

export const currentDate = () => {
  const date = new Date(Date.now());

  return `${date.getFullYear}-${date.getMonth() + 1}-${date.getDate()}`;
};

const formatNumber = (n: number) => n.toString().padStart(2, "0");

/**
 * 解析广播数据中的mac地址
 * @param broadcastHex 广播数据
 */
export function parseMAC(rawMac: string): string {
  let mac = "";
  // for (let i = rawMac.length; i >= 0; i -= 2) {
  //   mac += rawMac.substring(i - 2, i);
  // }
  for (let i = 0; i < rawMac.length; i += 2) {
    mac += rawMac.substring(i, i + 2);
  }
  return mac2Colon(mac);
}

export function hexString2ArrayArraybuffer(hexString: string | number[]) {
  if (typeof hexString === "object") {
    return new Uint8Array([...hexString]).buffer;
  }
  // 如果字符串长度不是偶数，则在前面补0使其成为偶数
  if (hexString.length % 2 !== 0) {
    hexString = "0" + hexString;
  }

  // 创建一个Uint8Array对象来存储字节
  var arrayBuffer = new Uint8Array(hexString.length / 2);

  // 将每两个字符转换成一个字节，并存储在Uint8Array中
  for (var i = 0; i < hexString.length; i += 2) {
    var byteValue = parseInt(hexString.substr(i, 2), 16);
    arrayBuffer[i / 2] = byteValue;
  }

  return arrayBuffer.buffer;
}

export function uint8Array2hexString(uint8Array: Uint8Array) {
  let result = "";
  uint8Array.forEach(
    (d) => (result += d.toString(16).toUpperCase().padStart(2, "0"))
  );
  return result;
}

export function reversedHex(hex: string) {
  const hexList = [];

  let len = hex.length;
  let cursor = 0;
  while (cursor < len) {
    hexList.unshift(hex.substr(cursor, 2));
    cursor += 2;
  }
  return hexList.join("");
}

/**
 * num 转 hex string
 * @param num
 * @param byteLength 字节长度，用于前补0
 */
export function number2Hex(num: number, byteLength = 1) {
  const hex = num.toString(16).padStart(byteLength * 2, "0");
  return byteLength === 1 ? hex : reversedHex(hex);
}

/**
 * 将有符号整数转换为hexstring
 * @param signedInt
 * @returns
 */
export function signedInt2hexString(signedInt: number, length = 4) {
  // 使用 >>> 0 将有符号整数转换为无符号整数
  // 然后使用 toString(16) 转换为十六进制字符串
  const hex = (signedInt >>> 0)
    .toString(16)
    .padStart(length, "0")
    .slice(-length);
  return reversedHex(hex);
}

/**
 * bytes 转 有符号整数
 */
export function bytes2SignedInt(bytes: Uint8Array) {
  const hexString = bytesToHex(bytes.reverse());
  return hex2SignedInt(hexString);
}

/**
 * hex转有符号整数
 * @param bytes
 * @returns
 */
export function hex2SignedInt(hexString: string) {
  const signedInt = parseInt(hexString, 16);
  return (signedInt << 0) >> 0;
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.prototype.map
    .call(bytes, (x) => ("00" + x.toString(16)).slice(-2))
    .join("");
}

function getBytesDecVal(bytes: Uint8Array) {
  return parseInt(bytesToHex(bytes), 16);
}

export function formatBytes(bytes: Uint8Array, format: "hex" | "dec" | "str") {
  if (format === "hex") {
    return bytesToHex(bytes);
  }

  if (format === "dec") {
    console.log("formatBytes：", ...bytes);

    return getBytesDecVal(bytes.reverse());
  }

  return buildUTF8Str(bytes);
}

function buildUTF8Str(data: Uint8Array) {
  return decodeURIComponent(escape(String.fromCharCode(...data)));
}

export function strToBytes(str: string) {
  return unescape(encodeURIComponent(str))
    .split("")
    .map((val) => val.charCodeAt(0));
}

/**
 * px 转 rpx
 */
export function px2rpx(px: number) {
  const { windowWidth } = wx.getSystemInfoSync();
  return (px / 750) * windowWidth;
}

/**
 * rpx 转 px
 */
export function rpx2px(rpx: number) {
  const { windowWidth } = wx.getSystemInfoSync();
  return (rpx / windowWidth) * 750;
}

/**
 * 产品id转产品型号
 * @param productId 产品id
 * @returns
 */
export function ProductId2Model(productId: number) {
  switch (productId) {
    case 0x38:
    case 0x40:
    case 0x41:
      return "Beacon-Medatc";
    default:
      return "Unknown";
  }
}

/**
 * mac地址加冒号:例如：AABBCCDDEEFF -> AA:BB:CC:DD:EE:FF
 */

export function mac2Colon(mac: string) {
  if (mac.includes(":")) return mac;
  return mac
    .toUpperCase()
    .replace(/(.{2})/g, "$1:")
    .slice(0, -1);
}

/**
 * 生成一个数组
 * @param start 开始值
 * @param end 结束值
 * @param step 步长
 */
export function generateArray(start: number, end: number, step: number) {
  const result = [];
  for (let i = start; i <= end; i += step) {
    result.push(i);
  }
  return result;
}

/**
 *
 */

export function getProductOptions() {
  return [
    {
      id: 0,
      name: "全部产品",
      productIds: [],
    },
    {
      id: 1,
      productIds: [0x38, 0x40],
      name: "智能定位标识",
    },
    {
      id: 2,
      name: "动态能量标识",
      productIds: [0x39],
    },
  ];
}

export const permissionTip = () => {
  const platform = wx.getSystemInfoSync().platform;
  let tip =
    "搜索和连接设备，需在系统设置中打开手机蓝牙，并开启 app 蓝牙使用权限。";
  if (platform === "ios") {
    return tip;
  }

  // android
  return (
    tip + "\n" + "Android 手机还需允许 app 使用“位置信息”，并开启“定位服务”。"
  );
};

export const getDevicePageItems: (productId?: number) => IDevicePageItems = (
  productId = 0
) => {
  switch (productId) {
    case 0x38:
    case 0x40:
    case 0x41:
      return {
        canUpdate: true,
        showBroadcastInterval: true,
        showBroadcastPower: true,
        showBroadcastChannel: true,
        showLog: false,
      };
    default:
      return {
        canUpdate: false,
        showBroadcastInterval: false,
        showBroadcastPower: false,
        showBroadcastChannel: false,
        showLog: true,
      };
  }
};

export const getDeviceIcon: (productId?: number) => string = (
  productId = 0
) => {
  switch (productId) {
    case 0x39:
      return "/assets/devices/big/plugcat.png";
    default:
      return "/assets/devices/big/beacon.png";
  }
};
