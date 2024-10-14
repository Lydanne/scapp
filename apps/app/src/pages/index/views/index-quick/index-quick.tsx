import { useEffect, useState } from 'react';

import { View } from '@tarojs/components';

import Body from 'src/components/body/body';
import Mlist from 'src/components/mlist/mlist';
import Navbar from 'src/components/navbar/navbar';
import Qrcode from 'src/components/qrcode/qrcode';
import { getPlinkCode } from 'src/libs/plink';

import Style from './index-quick.module.scss';

export default function IndexQuick() {
  const [qrData, setQrData] = useState('');
  useEffect(() => {
    setTimeout(async () => {
      setQrData(await getPlinkCode());
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
