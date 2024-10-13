import { useEffect, useState } from 'react';

import { Image, View } from '@tarojs/components';

import Body from 'src/components/body/body';
import Mlist from 'src/components/mlist/mlist';
import Navbar from 'src/components/navbar/navbar';
import Qrcode from 'src/components/qrcode/qrcode';
import { decode, encode } from 'src/libs/plink';
import { getCurrentPlink } from 'src/libs/shared/getCurrentPlink';

import Style from './index-quick.module.scss';

export default function IndexQuick() {
  const [qrData, setQrData] = useState('');
  useEffect(() => {
    setTimeout(async () => {
      const data = encode(await getCurrentPlink());
      console.log('IndexQuick', data, decode(data));
      setQrData(data);
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
