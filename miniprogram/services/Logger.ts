let fileNameMap = new Map<string, string>();
let stopSave = false;

/**
 * 文件名称，传入 mac 地址 + 当前日期生成文件名称 例如： 00:00:00:00:00:00_2021-01-01.log
 * @param mac
 * @returns
 */
export function getFileName(mac: string) {
  // mac去掉冒号
  mac = mac.replace(/:/g, "");
  // 如果fileNameMap中有mac地址对应的文件名，则直接返回
  if (fileNameMap.has(mac)) {
    return fileNameMap.get(mac);
  }
  // 如果没有，则生成文件名并保存到fileNameMap中
  const date = new Date();
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const fileName = `${mac}_${year}-${month}-${day}.log`;
  fileNameMap.set(mac, fileName);
  return fileName;
}

/**
 * 保存日志 TextDecoder is not defined
 */
export function saveLog(log: ArrayBuffer, mac: string): string {
  if (stopSave) {
    return "";
  }
  const fileName = getFileName(mac);
  const uint8Array = new Uint8Array(log);
  //uint8Array转换成hex string
  let strLog = "";
  const characters: string[] = [];
  // 遍历 Uint8Array 并将每个字节转换为字符
  uint8Array.forEach((byte) => {
    characters.push(String.fromCharCode(byte));
  });

  // 将字符数组连接成一个字符串
  strLog = characters.join("");

  const fileSystem = wx.getFileSystemManager();
  const filePath = `${wx.env.USER_DATA_PATH}/${fileName}`;

  fileSystem.access({
    path: filePath,
    fail: () => {
      fileSystem.writeFileSync(filePath, log);
    },
    success: () => fileSystem.appendFileSync(filePath, log),
  });
  return strLog;
}

/**
 * 分享日志到微信聊天
 */

export function shareLog(mac: string) {
  stopSave = true;
  const fileName = getFileName(mac);
  wx.shareFileMessage({
    filePath: `${wx.env.USER_DATA_PATH}/${fileName}`,
  }).then(() => {
    setTimeout(() => {
      stopSave = false;
    }, 1000);
  });
}

/**
 * 删除fileNameMap中的mac地址对应的文件
 */
export function removeLog() {
  fileNameMap.forEach((fileName, mac) => {
    wx.getFileSystemManager().unlink({
      filePath: `${wx.env.USER_DATA_PATH}/${fileName}`,
    });
  });
  fileNameMap.clear();
}
