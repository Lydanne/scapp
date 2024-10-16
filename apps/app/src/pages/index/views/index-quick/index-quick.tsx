import { useEffect, useState } from 'react';

import { View } from '@tarojs/components';

import Body from 'src/components/body/body';
import Mlist from 'src/components/mlist/mlist';
import Navbar from 'src/components/navbar/navbar';
import Qrcode from 'src/components/qrcode/qrcode';
import { getPlinkCode } from 'src/libs/plink';
import udpChannel from 'src/libs/plink/udpChannel';
import { useRouter } from 'src/libs/tapi/router';

import Style from './index-quick.module.scss';

export default function IndexQuick() {
  const [qrData, setQrData] = useState('');
  const { to } = useRouter();
  useEffect(() => {
    setTimeout(async () => {
      const [port] = await udpChannel.listenEmitter.wait();
      setQrData(await getPlinkCode(port));
    });
    return udpChannel.connectionEmitter.on((connection) => {
      to('/pages/trans/trans', { plink: { socketIP: connection.socketIP } });
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
