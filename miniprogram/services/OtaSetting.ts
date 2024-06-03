export enum OtaProtocol {
  Legacy,
  Extend,
}
export default class OtaSetting {
  protocol: OtaProtocol = OtaProtocol.Legacy;
  firmwarePath: string = "";
  checkFirmwareCrc: boolean = false;
  serviceUUID: string = "";
  characteristicUUID: string = "";
  readInterval: number = 0;
  pduLength: number = 16;
  versionCompare: boolean = false;
  firmwareVersion: number[] = [];
  timeout: number = 5 * 60 * 1000;
}
