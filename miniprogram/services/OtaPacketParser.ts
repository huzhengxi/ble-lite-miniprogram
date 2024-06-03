//将 ../android-ota/ble/OtaPacketParser.java是Android ble 的代码，内部有一个 OtaPacketParser 类，用于解析 OTA 数据包，这里将其转换为 TypeScript;

export class OtaPacketParser {
  private total: number = 0;
  private index: number = -1;
  private data!: Int8Array;
  private progress: number = 0;
  private pduLength: number = 16;

  public set(data: Int8Array, pduLen: number) {
    this.clear();
    this.data = data;
    this.pduLength = pduLen;
    let length = this.data.byteLength;
    if (length % pduLen == 0) {
      this.total = length / pduLen;
    } else {
      this.total = Math.floor(length / pduLen + 1);
    }
  }

  public clear() {
    this.progress = 0;
    this.total = 0;
    this.index = -1;
    this.data = new Int8Array(0);
  }

  public getFirmwareVersion(): string {
    if (this.data.byteLength < 6) return "";
    let version = new Int8Array(this.data, 2, 4);
    return this.ab2hex(new Uint8Array(version));
  }

  public hasNextPacket(): boolean {
    console.log(`total:${this.total}, this.index:${this.index}, FirmwareLen:${this.data.byteLength}`);

    return this.total > 0 && this.index + 1 < this.total;
  }

  public isLast(): boolean {
    return this.index + 1 == this.total;
  }

  public getNextPacketIndex(): number {
    return this.index + 1;
  }

  public getNextPacket(): ArrayBuffer {
    let index = this.getNextPacketIndex();
    let packet = this.getPacket(index);
    this.index = index;
    return packet;
  }

  public getPacket(index: number): ArrayBuffer {
    let length = this.data.byteLength;
    let packetSize: number;
    if (length > this.pduLength) {
      if (index + 1 == this.total) {
        packetSize = length - index * this.pduLength; // 剩余 data
      } else {
        packetSize = this.pduLength;
      }
    } else {
      packetSize = length;
    }
    let totalSize: number;
    if (packetSize == this.pduLength) {
      totalSize = this.pduLength + 4; //
    } else {
      let dataSize =
        packetSize % 16 == 0
          ? packetSize
          : (Math.floor(packetSize / 16) + 1) * 16;
      totalSize = dataSize + 4;
      console.log("last:" + totalSize);

      //  (int) Math.ceil(((double) packetSize) /// 16) * 16;
    }
    let packetView = new Int8Array(totalSize);
    for (let i = 0; i < totalSize; i++) {
      packetView[i] = 0xff;
    }
    let dataView = new Int8Array(this.data);
    packetView.set(
      dataView.slice(
        index * this.pduLength,
        index * this.pduLength + packetSize
      ),
      2
    );
    this.fillIndex(packetView, index);
    let crc = this.crc16(packetView);
    // console.log(
    //   `ota package ---> index : ${index}  total : ${this.total} crc : ${crc
    //     .toString(16)
    //     .padStart(4, "0")
    //     .toUpperCase()} content : ${this.ab2hex(
    //     new Uint8Array(packetView.buffer)
    //   )}`
    // );
    this.fillCrc(packetView, crc);

    // console.log(
    //   `ota package ---> index : ${index}  total : ${
    //     this.total
    //   } crc : ${crc.toString(16)} content : ${this.ab2hex(
    //     new Uint8Array(packetView.buffer)
    //   )}`
    // );

    return packetView.buffer;
  }

  getCheckPacket(): ArrayBuffer {
    let packet = new ArrayBuffer(16);
    let packetView = new Int8Array(packet);
    for (let i = 0; i < 16; i++) {
      packetView[i] = 0xff;
    }
    let index = this.getNextPacketIndex();
    this.fillIndex(packetView, index);
    let crc = this.crc16(packetView);
    this.fillCrc(packetView, crc);
    return packetView;
  }

  fillIndex(packetView: Int8Array, index: number) {
    let offset = 0;
    packetView[offset++] = index & 0xff;
    packetView[offset] = (index >> 8) & 0xff;
  }
  fillCrc(packetView: Int8Array, crc: number) {
    let offset = packetView.length - 2;
    packetView[offset++] = crc & 0xff;
    packetView[offset] = (crc >> 8) & 0xff;
  }
  crc16(packetView: Int8Array): number {
    let length = packetView.length - 2;
    let poly = [0, 0xa001];
    let crc = 0xffff;
    let ds;
    for (let j = 0; j < length; j++) {
      ds = packetView[j];
      for (let i = 0; i < 8; i++) {
        crc = (crc >> 1) ^ (poly[(crc ^ ds) & 1] & 0xffff);
        // console.log("i = " + j + i + "crc = " + crc + " ds = " + ds);
        ds = ds >> 1;
      }
    }
    return crc;
  }
  invalidateProgress(): boolean {
    let a = this.getNextPacketIndex();
    let b = this.total;
    let progress = Math.floor((a / b) * 100);
    if (progress == this.progress) return false;
    this.progress = progress;
    return true;
  }
  getProgress(): number {
    return this.progress;
  }
  getIndex(): number {
    return this.index;
  }
  ab2hex(buffer: Uint8Array): string {
    const hexString = Array.from(buffer)
      .map((byte) => byte.toString(16).padStart(2, "0"))
      .join("");
    return hexString;
  }
}
