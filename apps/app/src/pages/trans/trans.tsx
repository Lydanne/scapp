import { useEffect, useRef, useState } from 'react';

import { Close, Top } from '@nutui/icons-react-taro';
import { TextArea } from '@nutui/nutui-react-taro';
import { View } from '@tarojs/components';

import Body from 'src/components/body/body';
import Footer from 'src/components/footer/footer';
import Mlist from 'src/components/mlist/mlist';
import Navbar from 'src/components/navbar/navbar';
import Page from 'src/components/page/page';
import type { Plink } from 'src/libs/plink/payload';
import { UdpChannel } from 'src/libs/plink/udp';
import { useRouter } from 'src/libs/tapi/router';

import Style from './trans.module.scss';

const udpChannel = new UdpChannel();

type TransProps = {
  plink: Plink;
};

export default function Trans() {
  const { props, back } = useRouter<TransProps>();
  const status = useRef('waiting');

  useEffect(() => {
    if (status.current === 'waiting') {
      status.current = 'ready';
      setTimeout(async () => {
        const plink = props.plink;
        const [ip, port] = plink.inip.split(':');
        udpChannel.send('hello', ip, parseInt(port));
      });
    }
  }, []);

  const onSend = () => {};

  return (
    <Page footer footerHeight={60}>
      <Navbar>
        <View className={Style['close']} onClick={back}>
          <Close />
        </View>
        <View className={Style['author']}>
          <View
            className={`${Style['author-status']} ${Style['online']}`}
          ></View>
        </View>
        <View className={Style['author']}>
          <View className={Style['author-status']}></View>
        </View>
        <View className={Style['author']}>
          <View className={Style['author-status']}></View>
        </View>
      </Navbar>
      <Body>
        <Mlist></Mlist>
      </Body>
      <Footer className={Style['footer']} fixedBottom>
        <View className={Style['footer-upload']}>
          <Top />
        </View>
        <View className={Style['footer-input']}>
          <TextArea rows={1} autoSize value={props.plink.inip} />
        </View>
        <View className={Style['footer-send']} onClick={onSend}>
          发送
        </View>
      </Footer>
    </Page>
  );
}
