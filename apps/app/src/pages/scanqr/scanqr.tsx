import { useRef } from 'react';

import { Close, ImageRectangle, Retweet } from '@nutui/icons-react-taro';
import { View } from '@tarojs/components';

import Footer from 'src/components/footer/footer';
import Page from 'src/components/page/page';
import { parsePlinkCode } from 'src/libs/plink';
import type { SocketIP } from 'src/libs/plink/UdpChannel';
import udpChannel from 'src/libs/plink/UdpChannel';
import { useRouter } from 'src/libs/tapi/router';

import Scan from './components/scan/scan';
import Style from './scanqr.module.scss';

export default function Scanqr() {
  const { back, to } = useRouter();
  const scanData = useRef('');

  const onClickTake = () => {
    console.log('onClickTake');
    setTimeout(async () => {
      if (scanData.current) {
        const plink = parsePlinkCode(scanData.current);
        console.log('scanData', plink);
        udpChannel.connect(plink.socketIP as SocketIP);
      }
    }, 100);
  };

  const onScan = (data: string) => {
    scanData.current = data;
  };

  return (
    <Page disableScroll disableNavbar footer footerHeight={130}>
      <View className={Style['close']} onClick={back}>
        <Close />
      </View>
      <Scan onScan={onScan}></Scan>
      <Footer>
        <View className={Style['btns']}>
          <View className={Style['btns-icon']}>
            <ImageRectangle size={24} color="#666" />
          </View>
          <View className={Style['btns-mid']} onClick={onClickTake}>
            <View className={Style['mid-border']}></View>
          </View>
          <View className={Style['btns-icon']}>
            <Retweet size={24} color="#666" />
          </View>
        </View>
      </Footer>
    </Page>
  );
}
