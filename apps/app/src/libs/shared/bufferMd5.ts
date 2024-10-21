// 实现一个将 ArrayBuffer 转换为 MD5 哈希值的方法，适用于小程序环境
export function bufferMd5(arrayBuffer: ArrayBuffer): string {
  // 将 ArrayBuffer 转换为字符串
  const bytes = new Uint8Array(arrayBuffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }

  // MD5 算法实现
  function md5(string: string): string {
    function RotateLeft(lValue: number, iShiftBits: number): number {
      return (lValue << iShiftBits) | (lValue >>> (32 - iShiftBits));
    }

    function AddUnsigned(lX: number, lY: number): number {
      const lX4 = lX & 0x40000000;
      const lY4 = lY & 0x40000000;
      const lX8 = lX & 0x80000000;
      const lY8 = lY & 0x80000000;
      const lResult = (lX & 0x3fffffff) + (lY & 0x3fffffff);
      if (lX4 & lY4) {
        return lResult ^ 0x80000000 ^ lX8 ^ lY8;
      }
      if (lX4 | lY4) {
        if (lResult & 0x40000000) {
          return lResult ^ 0xc0000000 ^ lX8 ^ lY8;
        } else {
          return lResult ^ 0x40000000 ^ lX8 ^ lY8;
        }
      } else {
        return lResult ^ lX8 ^ lY8;
      }
    }

    function F(x: number, y: number, z: number): number {
      return (x & y) | (~x & z);
    }
    function G(x: number, y: number, z: number): number {
      return (x & z) | (y & ~z);
    }
    function H(x: number, y: number, z: number): number {
      return x ^ y ^ z;
    }
    function I(x: number, y: number, z: number): number {
      return y ^ (x | ~z);
    }

    function FF(
      a: number,
      b: number,
      c: number,
      d: number,
      x: number,
      s: number,
      ac: number,
    ): number {
      a = AddUnsigned(a, AddUnsigned(AddUnsigned(F(b, c, d), x), ac));
      return AddUnsigned(RotateLeft(a, s), b);
    }

    function GG(
      a: number,
      b: number,
      c: number,
      d: number,
      x: number,
      s: number,
      ac: number,
    ): number {
      a = AddUnsigned(a, AddUnsigned(AddUnsigned(G(b, c, d), x), ac));
      return AddUnsigned(RotateLeft(a, s), b);
    }

    function HH(
      a: number,
      b: number,
      c: number,
      d: number,
      x: number,
      s: number,
      ac: number,
    ): number {
      a = AddUnsigned(a, AddUnsigned(AddUnsigned(H(b, c, d), x), ac));
      return AddUnsigned(RotateLeft(a, s), b);
    }

    function II(
      a: number,
      b: number,
      c: number,
      d: number,
      x: number,
      s: number,
      ac: number,
    ): number {
      a = AddUnsigned(a, AddUnsigned(AddUnsigned(I(b, c, d), x), ac));
      return AddUnsigned(RotateLeft(a, s), b);
    }

    function ConvertToWordArray(str: string): number[] {
      let lWordCount: number;
      const lMessageLength: number = str.length;
      const lNumberOfWords_temp1: number = lMessageLength + 8;
      const lNumberOfWords_temp2: number =
        (lNumberOfWords_temp1 - (lNumberOfWords_temp1 % 64)) / 64;
      const lNumberOfWords: number = (lNumberOfWords_temp2 + 1) * 16;
      const lWordArray: number[] = new Array(lNumberOfWords - 1);
      let lBytePosition: number = 0;
      let lByteCount: number = 0;
      while (lByteCount < lMessageLength) {
        lWordCount = (lByteCount - (lByteCount % 4)) / 4;
        lBytePosition = (lByteCount % 4) * 8;
        lWordArray[lWordCount] =
          lWordArray[lWordCount] |
          (str.charCodeAt(lByteCount) << lBytePosition);
        lByteCount++;
      }
      lWordCount = (lByteCount - (lByteCount % 4)) / 4;
      lBytePosition = (lByteCount % 4) * 8;
      lWordArray[lWordCount] = lWordArray[lWordCount] | (0x80 << lBytePosition);
      lWordArray[lNumberOfWords - 2] = lMessageLength << 3;
      lWordArray[lNumberOfWords - 1] = lMessageLength >>> 29;
      return lWordArray;
    }

    function WordToHex(lValue: number): string {
      let WordToHexValue = '',
        WordToHexValue_temp = '',
        lByte: number,
        lCount: number;
      for (lCount = 0; lCount <= 3; lCount++) {
        lByte = (lValue >>> (lCount * 8)) & 255;
        WordToHexValue_temp = '0' + lByte.toString(16);
        WordToHexValue =
          WordToHexValue +
          WordToHexValue_temp.substr(WordToHexValue_temp.length - 2, 2);
      }
      return WordToHexValue;
    }

    function Utf8Encode(str: string): string {
      string = str.replace(/\r\n/g, '\n');
      let utftext = '';

      for (let n = 0; n < string.length; n++) {
        const c = string.charCodeAt(n);

        if (c < 128) {
          utftext += String.fromCharCode(c);
        } else if (c > 127 && c < 2048) {
          utftext += String.fromCharCode((c >> 6) | 192);
          utftext += String.fromCharCode((c & 63) | 128);
        } else {
          utftext += String.fromCharCode((c >> 12) | 224);
          utftext += String.fromCharCode(((c >> 6) & 63) | 128);
          utftext += String.fromCharCode((c & 63) | 128);
        }
      }

      return utftext;
    }

    let x: number[] = [];
    let k: number;
    let AA: number, BB: number, CC: number, DD: number;
    let a: number = 1732584193;
    let b: number = -271733879;
    let c: number = -1732584194;
    let d: number = 271733878;

    string = Utf8Encode(string);
    x = ConvertToWordArray(string);
    k = x.length;

    for (let i = 0; i < k; i += 16) {
      AA = a;
      BB = b;
      CC = c;
      DD = d;
      a = FF(a, b, c, d, x[i + 0], 7, -680876936);
      d = FF(d, a, b, c, x[i + 1], 12, -389564586);
      c = FF(c, d, a, b, x[i + 2], 17, 606105819);
      b = FF(b, c, d, a, x[i + 3], 22, -1044525330);
      a = FF(a, b, c, d, x[i + 4], 7, -176418897);
      d = FF(d, a, b, c, x[i + 5], 12, 1200080426);
      c = FF(c, d, a, b, x[i + 6], 17, -1473231341);
      b = FF(b, c, d, a, x[i + 7], 22, -45705983);
      a = FF(a, b, c, d, x[i + 8], 7, 1770035416);
      d = FF(d, a, b, c, x[i + 9], 12, -1958414417);
      c = FF(c, d, a, b, x[i + 10], 17, -42063);
      b = FF(b, c, d, a, x[i + 11], 22, -1990404162);
      a = FF(a, b, c, d, x[i + 12], 7, 1804603682);
      d = FF(d, a, b, c, x[i + 13], 12, -40341101);
      c = FF(c, d, a, b, x[i + 14], 17, -1502002290);
      b = FF(b, c, d, a, x[i + 15], 22, 1236535329);
      a = GG(a, b, c, d, x[i + 1], 5, -165796510);
      d = GG(d, a, b, c, x[i + 6], 9, -1069501632);
      c = GG(c, d, a, b, x[i + 11], 14, 643717713);
      b = GG(b, c, d, a, x[i + 0], 20, -373897302);
      a = GG(a, b, c, d, x[i + 5], 5, -701558691);
      d = GG(d, a, b, c, x[i + 10], 9, 38016083);
      c = GG(c, d, a, b, x[i + 15], 14, -660478335);
      b = GG(b, c, d, a, x[i + 4], 20, -405537848);
      a = GG(a, b, c, d, x[i + 9], 5, 568446438);
      d = GG(d, a, b, c, x[i + 14], 9, -1019803690);
      c = GG(c, d, a, b, x[i + 3], 14, -187363961);
      b = GG(b, c, d, a, x[i + 8], 20, 1163531501);
      a = GG(a, b, c, d, x[i + 13], 5, -1444681467);
      d = GG(d, a, b, c, x[i + 2], 9, -51403784);
      c = GG(c, d, a, b, x[i + 7], 14, 1735328473);
      b = GG(b, c, d, a, x[i + 12], 20, -1926607734);
      a = HH(a, b, c, d, x[i + 5], 4, -378558);
      d = HH(d, a, b, c, x[i + 8], 11, -2022574463);
      c = HH(c, d, a, b, x[i + 11], 16, 1839030562);
      b = HH(b, c, d, a, x[i + 14], 23, -35309556);
      a = HH(a, b, c, d, x[i + 1], 4, -1530992060);
      d = HH(d, a, b, c, x[i + 4], 11, 1272893353);
      c = HH(c, d, a, b, x[i + 7], 16, -155497632);
      b = HH(b, c, d, a, x[i + 10], 23, -1094730640);
      a = HH(a, b, c, d, x[i + 13], 4, 681279174);
      d = HH(d, a, b, c, x[i + 0], 11, -358537222);
      c = HH(c, d, a, b, x[i + 3], 16, -722521979);
      b = HH(b, c, d, a, x[i + 6], 23, 76029189);
      a = HH(a, b, c, d, x[i + 9], 4, -640364487);
      d = HH(d, a, b, c, x[i + 12], 11, -421815835);
      c = HH(c, d, a, b, x[i + 15], 16, 530742520);
      b = HH(b, c, d, a, x[i + 2], 23, -995338651);
      a = II(a, b, c, d, x[i + 0], 6, -198630844);
      d = II(d, a, b, c, x[i + 7], 10, 1126891415);
      c = II(c, d, a, b, x[i + 14], 15, -1416354905);
      b = II(b, c, d, a, x[i + 5], 21, -57434055);
      a = II(a, b, c, d, x[i + 12], 6, 1700485571);
      d = II(d, a, b, c, x[i + 3], 10, -1894986606);
      c = II(c, d, a, b, x[i + 10], 15, -1051523);
      b = II(b, c, d, a, x[i + 1], 21, -2054922799);
      a = II(a, b, c, d, x[i + 8], 6, 1873313359);
      d = II(d, a, b, c, x[i + 15], 10, -30611744);
      c = II(c, d, a, b, x[i + 6], 15, -1560198380);
      b = II(b, c, d, a, x[i + 13], 21, 1309151649);
      a = II(a, b, c, d, x[i + 4], 6, -145523070);
      d = II(d, a, b, c, x[i + 11], 10, -1120210379);
      c = II(c, d, a, b, x[i + 2], 15, 718787259);
      b = II(b, c, d, a, x[i + 9], 21, -343485551);
      a = AddUnsigned(a, AA);
      b = AddUnsigned(b, BB);
      c = AddUnsigned(c, CC);
      d = AddUnsigned(d, DD);
    }

    const temp = WordToHex(a) + WordToHex(b) + WordToHex(c) + WordToHex(d);
    return temp.toLowerCase();
  }

  return md5(binary);
}
