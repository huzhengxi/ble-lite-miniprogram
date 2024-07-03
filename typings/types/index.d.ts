/// <reference path="./wx/index.d.ts" />

import { EErrorCode } from "@services/define";

/**
 * 错误定义
 */
interface IError {
  errCode: number | EErrorCode;
  errMessage?: string;
}
