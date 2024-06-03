// public final class Arrays {

//     private Arrays() {
//     }

//     /**
//      * 反转byte数组
//      *
//      * @param a
//      * @return
//      */
//     public static byte[] reverse(byte[] a) {

//         if (a == null)
//             return null;

//         int p1 = 0, p2 = a.length;
//         byte[] result = new byte[p2];

//         while (--p2 >= 0) {
//             result[p2] = a[p1++];
//         }

//         return result;
//     }

//     /**
//      * 反转byte数组中的某一段
//      *
//      * @param arr
//      * @param begin
//      * @param end
//      * @return
//      */
//     public static byte[] reverse(byte[] arr, int begin, int end) {

//         while (begin < end) {
//             byte temp = arr[end];
//             arr[end] = arr[begin];
//             arr[begin] = temp;
//             begin++;
//             end--;
//         }

//         return arr;
//     }

//     /**
//      * 比较两个byte数组中的每一项值是否相等
//      *
//      * @param array1
//      * @param array2
//      * @return
//      */
//     public static boolean equals(byte[] array1, byte[] array2) {

//         if (array1 == array2) {
//             return true;
//         }

//         if (array1 == null || array2 == null || array1.length != array2.length) {
//             return false;
//         }

//         for (int i = 0; i < array1.length; i++) {
//             if (array1[i] != array2[i]) {
//                 return false;
//             }
//         }

//         return true;
//     }

//     public static String bytesToString(byte[] array) {

//         if (array == null) {
//             return "null";
//         }

//         if (array.length == 0) {
//             return "[]";
//         }

//         StringBuilder sb = new StringBuilder(array.length * 6);
//         sb.append('[');
//         sb.append(array[0]);
//         for (int i = 1; i < array.length; i++) {
//             sb.append(", ");
//             sb.append(array[i]);
//         }
//         sb.append(']');
//         return sb.toString();
//     }

//     public static String bytesToString(byte[] data, String charsetName) throws UnsupportedEncodingException {
//         return new String(data, charsetName);
//     }

//     /**
//      * byte数组转成十六进制字符串
//      *
//      * @param array     原数组
//      * @param separator 分隔符
//      * @return
//      */
//     public static String bytesToHexString(byte[] array, String separator) {
//         if (array == null || array.length == 0)
//             return "";

//         StringBuilder sb = new StringBuilder();

//         Formatter formatter = new Formatter(sb);
//         formatter.format("%02X", array[0]);

//         for (int i = 1; i < array.length; i++) {

//             if (!Strings.isEmpty(separator))
//                 sb.append(separator);

//             formatter.format("%02X", array[i]);
//         }

//         formatter.flush();
//         formatter.close();

//         return sb.toString();
//     }

//     public static byte[] hexToBytes(String hexStr) {
//         if (hexStr.length() == 1) {
//             hexStr = "0" + hexStr;
//         }
//         int length = hexStr.length() / 2;
//         byte[] result = new byte[length];

//         for (int i = 0; i < length; i++) {
//             result[i] = (byte) Integer.parseInt(hexStr.substring(i * 2, i * 2 + 2), 16);
//         }

//         return result;
//     }

//     public static int bytesToInt(byte[] src, int offset) {
//         if (src.length != 4)return 0;
//         int value;
//         value = (int) ((src[offset] & 0xFF)
//                 | ((src[offset+1] & 0xFF)<<8)
//                 | ((src[offset+2] & 0xFF)<<16)
//                 | ((src[offset+3] & 0xFF)<<24));
//         return value;
//     }
// }

// 将上面 java 代码转化成 typescript 类

export class Arrays {
  private constructor() {}

  /**
   * 反转byte数组
   *
   * @param a
   * @return
   */
  public static reverse(a: ArrayBuffer): ArrayBuffer {
    if (a == null) return null;

    let p1 = 0,
      p2 = a.byteLength;
    let result = new Uint8Array(p2);

    while (--p2 >= 0) {
      result[p2] = a[p1++];
    }

    return result;
  }

  /**
   * 反转byte数组中的某一段
   *
   * @param arr
   * @param begin
   * @param end
   * @return
   */
  public static reverse2(
    arr: Uint8Array,
    begin: number,
    end: number
  ): Uint8Array {
    while (begin < end) {
      let temp = arr[end];
      arr[end] = arr[begin];
      arr[begin] = temp;
      begin++;
      end--;
    }

    return arr;
  }

  /**
   * 比较两个byte数组中的每一项值是否相等
   *
   * @param array1
   * @param array2
   * @return
   */
  public static equals(array1: Uint8Array, array2: Uint8Array): boolean {
    if (array1 == array2) {
      return true;
    }

    if (
      array1 == null ||
      array2 == null ||
      array1.byteLength != array2.byteLength
    ) {
      return false;
    }

    for (let i = 0; i < array1.byteLength; i++) {
      if (array1[i] != array2[i]) {
        return false;
      }
    }

    return true;
  }

  public static bytesToString(array: Uint8Array): string {
    if (array == null) {
      return "null";
    }

    if (array.byteLength == 0) {
      return "[]";
    }

    let sb = "";
    sb += "[";
    sb += array[0];
    for (let i = 1; i < array.byteLength; i++) {
      sb += ", ";
      sb += array[i];
    }
    sb += "]";
    return sb;
  }

  public static bytesToString2(data: Uint8Array, charsetName: string): string {
    return new TextDecoder(charsetName).decode(data);
  }

  /**
   * byte数组转成十六进制字符串
   *
   * @param array     原数组
   * @param separator 分隔符
   * @return
   */
  public static bytesToHexString(array: Uint8Array, separator?: string): string {
    if (array == null || array.byteLength == 0) return "";

    let result = "";

    for (let i = 0; i < array.byteLength; i++) {
      result = `${result}${(array[0] & 0xff).toString(16).padStart(2, "0")}`;
      if (separator) result += separator;
    }

    return result;
  }

  public static hexToBytes(hexStr: string): Uint8Array {
    if (hexStr.length == 1) {
      hexStr = "0" + hexStr;
    }
    let length = hexStr.length / 2;
    let result = new Uint8Array(length);

    for (let i = 0; i < length; i++) {
      result[i] = parseInt(hexStr.substring(i * 2, i * 2 + 2), 16);
    }

    return result;
  }

  public static bytesToInt(src: Uint8Array, offset: number): number {
    if (src.byteLength != 4) return 0;
    let value;
    value =
      (src[offset] & 0xff) |
      ((src[offset + 1] & 0xff) << 8) |
      ((src[offset + 2] & 0xff) << 16) |
      ((src[offset + 3] & 0xff) << 24);
    return value;
  }

  public static intToBytes(value: number): Uint8Array {
    let src = new Uint8Array(4);
    src[0] = value & 0xff;
    src[1] = (value >> 8) & 0xff;
    src[2] = (value >> 16) & 0xff;
    src[3] = (value >> 24) & 0xff;
    return src;
  }
}
