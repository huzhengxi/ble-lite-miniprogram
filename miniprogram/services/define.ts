
/**
 * 错误类型定义（第一个E是enum的意思）
 */
export enum EErrorCode {
  Timeout = 0x0001,
  NotFound,
  Disconnected,
  NotAvailable,
  InProgress,
}

// 连接状态
export enum ECommandStatus {
  // 正在进行
  InProgress = 0x01,
  // 成功
  Success = 0x02,
  // 失败
  Failed = 0x03,
}
