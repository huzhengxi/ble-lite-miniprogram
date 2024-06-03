// declare var drawQrcode: Function;
export interface DrawQrcodeOption {
  ctx?: any;
  canvasId?: string;
  text: string;
  width?: number;
  height?: number;
  x?: number;
  y?: number;
  typeNumber?: number;
  correctLevel?: number;
  background?: string;
  foreground?: string;
}
export function drawQrcode(option: DrawQrcodeOption): any;
