/**
 * 日志模块
 */

import { formatTime } from '../utils/util'

const logFileName = `${wx.env.USER_DATA_PATH}/bletools.log`
const fileSystem = wx.getFileSystemManager()


const initLog = () => {
  // 创建目录
  try {
    fileSystem.getFileInfo({
      filePath: logFileName,
      success: function (state) {
        const size = state.size;
        if (size > 5 * 1024 * 1024) {
          fileSystem.unlink({
            filePath: logFileName,
            success: function () {
              writeLog('file>> 日志文件超过2M，删除文件成功')
            },
            fail: function (error) {
              writeLog('file>> 日志文件超过2M，删除文件失败', error)
            }
          })
        }
      }
    })

  } catch (error) {
    writeLog('file>> ', error)
  }
}

const writeLog = (...args: any) => {
  const time = formatTime()
  // const content = `[${time}] ${[...args]
  //   .map((a) => (typeof a === 'object' ? JSON.stringify(a) : a))
  //   .join(',')}\n`;
  // try {
  //   fileSystem.access({
  //     path: logFileName,
  //     fail: () => {
  //       console.log('文件不存在，创建文件');
  //       fileSystem.writeFileSync(logFileName, content, 'utf-8')
  //     },
  //     success: () => fileSystem.appendFileSync(logFileName, content, 'utf-8')
  //   })
  // } catch (error) {
  //   console.log('写文件失败：', error);

  // }
  console.log(`[${time}] `, ...args)
}

const readLogFile = () => {
  let fileContent = ''
  try {
    fileContent = fileSystem.readFileSync(logFileName, 'utf-8') as string;
    console.log('fileContent:', fileContent);
  } catch (error) {
    console.log('读取文件失败：', error);
  } finally {
    return fileContent
  }
}

const removeLog = () => {
  try {
    fileSystem.unlinkSync(logFileName)
    return true;
  } catch (error) {
    return false
  }
}

export default {
  logFileName,
  initLog,
  log: writeLog,
  readLogFile,
  removeLog
}

module.exports = {
  writeLog,
  logFileName,
  initLog,
  log: writeLog,
  readLogFile,
  removeLog
}