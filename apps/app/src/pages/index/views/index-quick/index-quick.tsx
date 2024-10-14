import { decode, encode } from 'base64-arraybuffer';
import { useEffect, useState } from 'react';

import { Image, View } from '@tarojs/components';

import Body from 'src/components/body/body';
import Mlist from 'src/components/mlist/mlist';
import Navbar from 'src/components/navbar/navbar';
import Qrcode from 'src/components/qrcode/qrcode';
import { Plink } from 'src/libs/plink/payload';
import { getCurrentPlink } from 'src/libs/shared/getCurrentPlink';

import Style from './index-quick.module.scss';

export default function IndexQuick() {
  const [qrData, setQrData] = useState('');
  useEffect(() => {
    setTimeout(async () => {
      // let pete: Person = {
      //   name: 'pete',
      //   id: 123n, // it's a bigint
      //   years: 30,
      //   // data: new Uint8Array([0xDE, 0xAD, 0xBE, 0xEF]);
      // };

      // let bytes = Person.toBinary(pete);
      // pete = Person.fromBinary(bytes);
      // console.log('pete', {
      //   bytes,
      //   pete,
      // });
      const data = await getCurrentPlink();
      const base64 = encode(data);
      console.log(
        'IndexQuick',
        data,
        base64,
        Plink.fromBinary(new Uint8Array(decode(base64))),
      );
      setQrData(base64);
    });
  }, []);
  return (
    <>
      <Navbar style={{ background: '#05C15F', color: '#fff' }}>
        Redmi K60s
      </Navbar>
      <Body>
        <View className={Style['top']}>
          <View className={Style['top-qr']}>
            {qrData && (
              <Qrcode className={Style['qr-image']} data={qrData}></Qrcode>
            )}
          </View>
        </View>
        <Mlist></Mlist>
        <View style={{ height: 100 }}></View>
      </Body>
    </>
  );
}
