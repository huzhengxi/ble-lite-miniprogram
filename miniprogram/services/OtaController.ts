import { Command, CommandCallback, CommandType } from "./Command";
import { OtaPacketParser } from "./OtaPacketParser";
import OtaSetting, { OtaProtocol } from "./OtaSetting";
import BleConnection from "./BleConnection";
import { OtaStatusCode } from "./OtaStatusCode";
import { TimeoutHandler } from "./TimeoutHandler";
import { UuidInfo } from "./UuidInfo";
import { Opcode } from "./OpCode";
import { Crc } from "../utils/CRC";
import { ResultCode } from "./ResultCode";
import { Arrays } from "../utils/Arrays";

export class OtaController {
  private static readonly TAG_OTA_WRITE = 1;
  private static readonly TAG_OTA_READ = 2;
  private static readonly TAG_OTA_LAST = 3;
  private static readonly TAG_OTA_REQUEST_MTU = 4;
  private static readonly TAG_OTA_VERSION = 5;
  private static readonly TAG_OTA_START = 6;
  private static readonly TAG_OTA_END = 7;
  private static readonly TAG_OTA_START_EXT = 8;
  private static readonly TAG_OTA_FW_VERSION_REQ = 9;

  private static readonly TIMEOUT_VERSION_RSP = 3 * 1000;

  private readonly mOtaParser: OtaPacketParser = new OtaPacketParser();

  private otaSetting!: OtaSetting;

  private otaProtocol!: OtaProtocol;

  private otaRunning: boolean = false;
  private readonly LOG_TAG: string = "GATT-OTA";

  public static readonly OTA_STATE_SUCCESS = 1;
  public static readonly OTA_STATE_FAILURE = 0;
  public static readonly OTA_STATE_PROGRESS = 2;

  protected mTimeoutHandler!: TimeoutHandler;

  private mConnection: BleConnection | null = null;

  private mCallback!: GattOtaCallback;

  private static readonly DEFAULT_READ_INTERVAL = 8;

  private sendPackageTimeout: number = 0;

  private log(...args: any) {
    console.log("OtaController>>", ...args);
  }

  private readonly OTA_FW_VERSION_RSP_TASK = TimeoutHandler.createCallback(
    () => {
      this.resetOta();
      this.onOtaFailure(
        OtaStatusCode.FAIL_FW_VERSION_REQ_TIMEOUT,
        "OTA fail: firmware version request timeout"
      );
    }
  );

  private readonly OTA_TIMEOUT_TASK = TimeoutHandler.createCallback(() => {
    this.resetOta();
    this.onOtaFailure(
      OtaStatusCode.FAIL_FLOW_TIMEOUT,
      "OTA fail: flow timeout"
    );
  });

  public constructor(gattConnection: BleConnection) {
    this.mTimeoutHandler = new TimeoutHandler();
    this.mConnection = gattConnection;
    this.sendPackageTimeout =
      wx.getSystemInfoSync().platform === "ios" ? 10 : 0;
  }

  public setOtaCallback(callback: GattOtaCallback) {
    this.mCallback = callback;
  }

  private clear() {
    this.mOtaParser.clear();
  }

  public async startOta(otaSetting: OtaSetting) {
    if (this.otaRunning) {
      this.onOtaFailure(OtaStatusCode.BUSY, "busy");
      return;
    }

    if (this.mConnection == null || !this.mConnection.isConnected()) {
      this.onOtaFailure(
        OtaStatusCode.FAIL_UNCONNECTED,
        "OTA fail: device not connected"
      );
      return;
    }

    this.otaSetting = otaSetting;
    this.resetOta();

    if (!this.validateOtaSettings()) {
      return;
    }

    this.otaRunning = true;
    this.mTimeoutHandler.postDelayed(this.OTA_TIMEOUT_TASK, otaSetting.timeout);

    const result = await this.mConnection.enableNotification(
      this.getOtaService(),
      this.getOtaCharacteristic()
    );
    if (!result) {
      this.onOtaFailure(
        OtaStatusCode.FAIL_OTA_NOTIFICATION_ERROR,
        "OTA fail: enable notify fail"
      );
      return;
    }

    this.onOtaStart();
    if (this.isLegacyProtocol()) {
      this.sendOTAVersionCmd();
    } else {
      this.sendOtaFwVersionReqCommand();
    }
  }

  private validateOtaSettings(): boolean {
    if (!this.otaSetting || this.otaSetting.firmwarePath == "") {
      this.onOtaFailure(
        OtaStatusCode.FAIL_PARAMS_ERR,
        "OTA fail: params error"
      );
      return false;
    }
    const serviceUUID = this.getOtaService();
    if (!serviceUUID) {
      this.onOtaFailure(
        OtaStatusCode.FAIL_SERVICE_NOT_FOUND,
        "OTA fail: service not found"
      );
      return false;
    }
    if (!this.getOtaCharacteristic()) {
      this.onOtaFailure(
        OtaStatusCode.FAIL_CHARACTERISTIC_NOT_FOUND,
        "OTA fail: characteristic not found"
      );
      return false;
    }

    const firmwareData = this.parseFirmware(
      this.otaSetting.firmwarePath,
      this.otaSetting.checkFirmwareCrc
    );
    if (firmwareData == null) {
      this.onOtaFailure(
        OtaStatusCode.FAIL_FIRMWARE_CHECK_ERR,
        "OTA fail: check selected bin error"
      );
      return false;
    }
    this.otaProtocol = this.otaSetting.protocol;
    const maxPduLength = this.otaSetting.pduLength - 7; // 7 : 1 byte opcode, 2 byte handle, 2 byte pdu index, 2 byte crc
    const checkedLen = Math.min(this.otaSetting.pduLength, maxPduLength);
    console.error("used pdu len: " + checkedLen);
    this.mOtaParser.set(firmwareData, checkedLen);

    return true;
  }

  private parseFirmware(
    fileName: string,
    checkFirmwareCrc: boolean
  ): Int8Array | null {
    if (fileName == "") return null;
    try {
      const firmwareArrayBuffer = wx
        .getFileSystemManager()
        .readFileSync(fileName);
      const firmware = new Int8Array(firmwareArrayBuffer as ArrayBuffer);
      // check firmware crc
      if (checkFirmwareCrc) {
        console.log("check firmware fail");
        return null;
      }
      return firmware;
    } catch (e) {
      console.log(e);
    }
    return null;
  }

  public pushNotification(notificationData: ArrayBuffer) {
    if (notificationData.byteLength < 2) return;

    let opcode =
      new Uint8Array(notificationData, 0, 2)[0] |
      (new Uint8Array(notificationData, 0, 2)[1] << 8);
    console.log(
      "ota notify:",
      Arrays.bytesToHexString(new Uint8Array(notificationData))
    );

    if (opcode == Opcode.CMD_OTA_FW_VERSION_RSP) {
      // cancel rsp timer
      if (notificationData.byteLength < 5) {
        this.onOtaFailure(
          OtaStatusCode.FAIL_VERSION_RSP_ERROR,
          "version response command format error"
        );
        return;
      }
      let index = 2;
      let deviceVersion = new Uint8Array(notificationData, 2, 2);
      index += 2;
      let accept = new Uint8Array(notificationData, index, 1)[0] == 1;
      console.log(
        `version response: version-${Arrays.bytesToHexString(
          deviceVersion,
          ":"
        )} accept${accept.toString()}}`
      );

      this.mTimeoutHandler.removeCallbacks(this.OTA_FW_VERSION_RSP_TASK);
      if (accept) {
        this.sendOtaStartExtCmd();
      } else {
        this.onOtaFailure(
          OtaStatusCode.FAIL_VERSION_COMPARE_ERR,
          "device version compare fail"
        );
      }

      // check is notification data format err
    } else if (opcode == Opcode.CMD_OTA_RESULT) {
      if (!this.otaRunning) return;
      if (notificationData.byteLength < 3) return;
      let result = new Uint8Array(notificationData, 2, 1)[0];
      if (result == ResultCode.OTA_SUCCESS) {
        if (!this.isLegacyProtocol()) {
          this.resetOta();
          this.onOtaSuccess();
        }
      } else {
        this.onOtaFailure(OtaStatusCode.FAIL_OTA_RESULT_NOTIFICATION, "");
      }
    }
  }

  private updateOtaState(code: OtaStatusCode, extra: string) {
    if (this.mCallback !== null && this.mConnection !== null) {
      this.mCallback.onOtaStatusChanged(code, extra, this.mConnection, this);
    }
  }

  protected onOtaStart() {
    this.updateOtaState(OtaStatusCode.STARTED, "OTA started");
  }

  protected onOtaSuccess() {
    this.otaRunning = false;
    this.updateOtaState(OtaStatusCode.SUCCESS, "OTA success");
  }

  protected onOtaFailure(statusCode: number, extra: string) {
    this.updateOtaState(statusCode, extra);
  }

  protected onOtaProgress() {
    if (this.mCallback !== null && this.mConnection !== null) {
      this.mCallback.onOtaProgressUpdate(
        this.getOtaProgress(),
        this.mConnection,
        this
      );
    }
  }

  public getOtaProgress(): number {
    return this.mOtaParser.getProgress();
  }

  private resetOta() {
    this.otaRunning = false;
    this.mTimeoutHandler.stop();
    this.mOtaParser.clear();
  }

  private setOtaProgressChanged() {
    if (this.mOtaParser.invalidateProgress()) {
      this.onOtaProgress();
    }
  }

  private isLegacyProtocol(): boolean {
    return this.otaProtocol == OtaProtocol.Legacy;
  }

  private sendOTAVersionCmd() {
    this.sendOtaCmd(
      Opcode.CMD_OTA_VERSION,
      OtaController.TAG_OTA_VERSION,
      null
    );
  }

  // OTA 开始时发送的命令
  private sendOtaStartCmd() {
    this.sendOtaCmd(Opcode.CMD_OTA_START, OtaController.TAG_OTA_START, null);
  }

  private sendOtaStartExtCmd() {
    let extData = new Int8Array(18);
    extData[0] = this.otaSetting.pduLength;
    extData[1] = this.otaSetting.versionCompare ? 1 : 0;
    // extData[2~18] : Reserved
    this.sendOtaCmd(
      Opcode.CMD_OTA_START_EXT,
      OtaController.TAG_OTA_START_EXT,
      extData
    );
  }

  // OTA 开始时发送的命令
  private sendOtaFwVersionReqCommand() {
    let reqData = new Int8Array(3);
    reqData[0] = this.otaSetting.firmwareVersion[0];
    reqData[1] = this.otaSetting.firmwareVersion[1];
    reqData[2] = this.otaSetting.versionCompare ? 0x01 : 0x00;
    this.sendOtaCmd(
      Opcode.CMD_OTA_FW_VERSION_REQ,
      OtaController.TAG_OTA_FW_VERSION_REQ,
      reqData
    );
    this.mTimeoutHandler.postDelayed(
      this.OTA_FW_VERSION_RSP_TASK,
      OtaController.TIMEOUT_VERSION_RSP
    );
  }

  private sendOtaEndCommand() {
    let index = this.mOtaParser.getIndex();
    let data = new Int8Array(18);
    data[0] = index & 0xff;
    data[1] = (index >> 8) & 0xff;
    data[2] = ~index & 0xff;
    data[3] = (~index >> 8) & 0xff;
    //        int crc = mOtaParser.crc16(data); // include opcode
    //        mOtaParser.fillCrc(data, crc);

    this.sendOtaCmd(Opcode.CMD_OTA_END, OtaController.TAG_OTA_END, data);
  }

  private sendOtaCmd(opcode: number, tag: number, data: Int8Array | null) {
    const cmd = new Command(
      this.getOtaService(),
      this.getOtaCharacteristic(),
      CommandType.WRITE_NO_RESPONSE,
      undefined,
      tag
    );

    let cmdData: Int8Array;
    if (data == null) {
      cmdData = new Int8Array([opcode & 0xff, (opcode >> 8) & 0xff]);
    } else {
      cmdData = new Int8Array(2 + data.length);
      cmdData[0] = opcode & 0xff;
      cmdData[1] = (opcode >> 8) & 0xff;
    }
    cmd.data = cmdData.buffer;
    this.sendGattCmd(cmd, this.OTA_CMD_CB);
  }

  private sendNextOtaPacketCommand() {
    if (this.mOtaParser.hasNextPacket()) {
      let cmd = new Command(
        this.getOtaService(),
        this.getOtaCharacteristic(),
        CommandType.WRITE_NO_RESPONSE,
        this.mOtaParser.getNextPacket()
      );
      if (this.mOtaParser.isLast()) {
        cmd.tag = OtaController.TAG_OTA_LAST;
      } else {
        cmd.tag = OtaController.TAG_OTA_WRITE;
      }
      this.sendGattCmd(cmd, this.OTA_CMD_CB);
      this.setOtaProgressChanged();
    } else {
      console.log("no other packet");
    }
  }

  private validateOta(): boolean {
    return false;
  }

  private sendGattCmd(command: Command, callback: CommandCallback) {
    if (this.mConnection !== null) {
      this.mConnection.sendCommand(callback, command);
    }
  }

  private getOtaService(): string {
    return UuidInfo.OTA_SERVICE_UUID;
  }

  private getOtaCharacteristic(): string {
    return UuidInfo.OTA_CHARACTERISTIC_UUID;
  }

  /**
   * OTA End command send complete
   *
   * @param success is cmd send success
   */

  private onEndCmdComplete(success: boolean) {
    // if (isLegacyProtocol() || success) {
    if (this.isLegacyProtocol()) {
      this.resetOta();
      this.setOtaProgressChanged();
      this.onOtaSuccess();
    } else if (!success) {
      this.onOtaFailure(
        OtaStatusCode.FAIL_PACKET_SENT_ERR,
        "OTA fail: end packet sent err"
      );
    }
  }

  private readonly OTA_CMD_CB: CommandCallback = {
    success: (peripheral: BleConnection, command: Command, obj: any) => {
      if (!this.otaRunning) return;
      if (command.tag === OtaController.TAG_OTA_VERSION) {
        this.sendOtaStartCmd();
      } else if (command.tag === OtaController.TAG_OTA_START) {
        // Ota
        console.log("start success");
        setTimeout(() => {
          this.sendNextOtaPacketCommand();
        }, this.sendPackageTimeout);
      } else if (command.tag === OtaController.TAG_OTA_START_EXT) {
        // this.sendNextOtaPacketCommand();
        setTimeout(() => {
          this.sendNextOtaPacketCommand();
        }, this.sendPackageTimeout);
      } else if (command.tag === OtaController.TAG_OTA_END) {
        // ota success
        this.onEndCmdComplete(true);
      } else if (command.tag === OtaController.TAG_OTA_LAST) {
        this.sendOtaEndCommand();
      } else if (command.tag === OtaController.TAG_OTA_WRITE) {
        if (!this.validateOta()) {
          setTimeout(() => {
            this.sendNextOtaPacketCommand();
          }, this.sendPackageTimeout);
          // this.sendNextOtaPacketCommand();
        }
      } else if (command.tag === OtaController.TAG_OTA_READ) {
        setTimeout(() => {
          this.sendNextOtaPacketCommand();
        }, this.sendPackageTimeout);
        // this.sendNextOtaPacketCommand();
      }
    },

    error: (peripheral: BleConnection, command: Command, errorMsg: string) => {
      if (!this.otaRunning) return;
      console.log(`error packet:${command.tag}, errorMsg:${errorMsg}`);

      if (command.tag === OtaController.TAG_OTA_END) {
        this.onEndCmdComplete(false);
      } else {
        this.resetOta();
        this.onOtaFailure(
          OtaStatusCode.FAIL_PACKET_SENT_ERR,
          "OTA fail: packet sent err"
        );
      }
    },

    timeout: (peripheral: BleConnection, command: Command) => {
      if (!this.otaRunning) return false;
      console.log(`timeout: ${command.toString()}`);

      if (command.tag === OtaController.TAG_OTA_END) {
        this.onEndCmdComplete(false);
      } else {
        this.resetOta();
        this.onOtaFailure(
          OtaStatusCode.FAIL_PACKET_SENT_TIMEOUT,
          "OTA fail: packet sent timeout"
        );
      }
      return false;
    },
  };
}

export interface GattOtaCallback {
  /**
   * @param statusCode {@link OtaStatusCode}
   */
  onOtaStatusChanged(
    statusCode: OtaStatusCode,
    info: string,
    connection?: BleConnection,
    controller?: OtaController
  ): void;

  onOtaProgressUpdate(
    progress: number,
    connection?: BleConnection,
    controller?: OtaController
  ): void;
}
