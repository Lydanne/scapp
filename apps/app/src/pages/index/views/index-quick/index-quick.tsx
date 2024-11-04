import { useEffect, useState } from 'react';

import { View } from '@tarojs/components';

import Body from 'src/components/body/body';
import Mlist from 'src/components/mlist/mlist';
import Navbar from 'src/components/navbar/navbar';
import Qrcode from 'src/components/qrcode/qrcode';
import { getPlinkCode } from 'src/libs/plink';
import ChannelManager from 'src/libs/plink/ChannelManager';
import { useRouter } from 'src/libs/tapi/router';

import Style from './index-quick.module.scss';

export default function IndexQuick() {
  const [qrData, setQrData] = useState('');
  const { to } = useRouter();
  useEffect(() => {
    return ChannelManager.emLoad.on(async (channel) => {
      console.log('[IndexQuick]', 'reloadEmitter', channel);
      channel.emConnection.on((connection) => {
        to('/pages/trans/trans', { plink: { socketIP: connection.socketIP } });
      });
      const [port] = await channel.emListen.wait();
      setQrData(await getPlinkCode(port));
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
        <Mlist
          list={[
            {
              id: 1,
              name: '示例项目',
              createdAt: new Date().toISOString(),
              msg: [
                {
                  type: 'text',
                  content: '这是一个示例消息',
                },
                {
                  type: 'file',
                  content: {
                    name: '示例文件',
                    size: '100KB',
                  },
                },
              ],
            },
          ]}
        ></Mlist>
        <View style={{ height: 100 }}></View>
      </Body>
    </>
  );
}
