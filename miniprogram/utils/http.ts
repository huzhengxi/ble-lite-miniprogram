import helper from "../services/helper";

const isProduction = true;

const httpProductionHost = "https://qing.cleargrass.com";
const httpStagingHost = "https://qing.dev.cleargrass.com";

const httpHost = isProduction ? httpProductionHost : httpStagingHost;

const account = wx.getAccountInfoSync();
const platform = wx.getSystemInfoSync().platform || "ios";

const HttpLog = "HTTP>>";

const log = (...arg: any) => helper.log(HttpLog, ...arg);
/**
 * 获取header
 */
const getHeader = () => {
  const header = {
    "content-type": "application/json",
    "app-id": `wx.miniprogram.${account.miniProgram.appId}`,
    "app-lang": "zh_CN",
    "app-os": platform,
    "app-version": account.miniProgram.version || "1.0.0",
    "app-timezone": "Asia/Shanghai",
    "app-timestamp": new Date().getTime(),
  };
  return header;
};

/**
 * 检查更新
 * @param version 当前版本
 * @param mac 设备mac
 * @param model 设备型号
 */
export const checkUpdate = ({
  version,
  mac,
  model,
}: {
  version: string;
  mac: string;
  model: string;
}) => {
  const url = `${httpHost}/firmware/checkUpdate?model=${model}&version=${version}&mac=${mac}`;
  log("url:", url);

  return new Promise((resolve, reject) => {
    wx.request({
      url,
      method: "GET",
      header: getHeader(),
      success: (res) => {
        resolve(res.data);
      },
      fail: (err) => {
        reject(err);
      },
    });
  });
};

export const checkAvailableFirmwares = ({
  version,
  mac,
  model,
}: {
  version: string;
  mac: string;
  model: string;
}) => {
  return new Promise<IFirmware[]>((resolve, reject) => {
    wx.request<{
      code: number;
      data: IFirmware[];
      msg: string;
    }>({
      url: `${httpHost}/firmware/availableFirmwares?model=${model}&version=${version}&mac=${mac}`,
      method: "GET",
      header: getHeader(),
      success: (res) => {
        if (res.data.code === 0) {
          resolve(res.data.data);
        } else {
          resolve([]);
        }
      },
      fail: (err) => {
        resolve([]);
      },
    });
  });
};

/**
 * 下载固件
 * @param url 固件下载地址
 * @returns 返回固件下载后的临时路径
 */
export const downloadFirmware = (
  url: string,
  onProgressUpdate?: (progress: number) => void
) => {
  return new Promise<string>((resolve, reject) => {
    const downloadTask = wx.downloadFile({
      url,
      success: (res) => {
        log("下载成功：", res);
        resolve(res.tempFilePath);
      },
      fail: (err) => {
        reject(err);
      },
    });

    if (onProgressUpdate) {
      downloadTask.onProgressUpdate((progress) =>
        onProgressUpdate(progress.progress)
      );
    }
  });
};
