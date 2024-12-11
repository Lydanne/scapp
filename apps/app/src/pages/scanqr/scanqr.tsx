import { useRef } from 'react';

import { Close, ImageRectangle, Retweet } from '@nutui/icons-react-taro';
import { View } from '@tarojs/components';

import Footer from 'src/components/footer/footer';
import Page from 'src/components/page/page';
import { usePopupInput } from 'src/components/popup-input/use-popup-input';
import { parsePlinkCode } from 'src/libs/plink';
import ChannelManager from 'src/libs/plink/ChannelManager';
import type { SocketIP } from 'src/libs/plink/types';
import { useRouter } from 'src/libs/tapi/router';

import Scan from './components/scan/scan';
import Style from './scanqr.module.scss';

export default function Scanqr() {
  const { back, to } = useRouter();
  const scanData = useRef('');
  const { PopupInputElement, showPopupInput } = usePopupInput();

  const onClickTake = () => {
    console.log('onClickTake');
    setTimeout(async () => {
      if (scanData.current) {
        const plink = parsePlinkCode(scanData.current);
        console.log('scanData', plink);
        ChannelManager.channel?.connect(plink.socketIP as SocketIP);
      }
    }, 100);
  };

  const onClickConnect = async () => {
    const linkText = await showPopupInput({
      title: '输入链接',
      placeholder: '请输入链接',
    });
    console.log('linkText', linkText);
    if (!linkText) {
      return;
    }
    const plink = parsePlinkCode(linkText);
    console.log('scanData', plink);
    ChannelManager.channel?.connect(plink.socketIP as SocketIP);
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
            <ImageRectangle size={24} color="#666" onClick={onClickConnect} />
          </View>
          <View className={Style['btns-mid']} onClick={onClickTake}>
            <View className={Style['mid-border']}></View>
          </View>
          <View className={Style['btns-icon']}>
            <Retweet size={24} color="#666" />
          </View>
        </View>
      </Footer>
      <PopupInputElement></PopupInputElement>
    </Page>
  );
}
