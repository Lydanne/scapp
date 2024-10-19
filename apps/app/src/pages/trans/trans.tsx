import { useEffect, useRef, useState } from 'react';

import { Close, Top } from '@nutui/icons-react-taro';
import { TextArea } from '@nutui/nutui-react-taro';
import { View } from '@tarojs/components';
import Taro from '@tarojs/taro';

import Body from 'src/components/body/body';
import Footer from 'src/components/footer/footer';
import type { MitemProps } from 'src/components/mlist/mitem';
import Mlist from 'src/components/mlist/mlist';
import Navbar from 'src/components/navbar/navbar';
import Page from 'src/components/page/page';
import { Channel, type Plink } from 'src/libs/plink/payload';
import { toBinary } from 'src/libs/plink/shared';
import udpChannel, { type SocketIP } from 'src/libs/plink/udpChannel';
import { useRouter } from 'src/libs/tapi/router';

import Style from './trans.module.scss';

type TransProps = {
  plink: Plink;
};

export default function Trans() {
  const [inputMessage, setInputMessage] = useState('');
  const { props, back } = useRouter<TransProps>();
  const [msgList, setMsgList] = useState<MitemProps[]>([]);

  useEffect(() => {
    setTimeout(async () => {
      const [connection] = await udpChannel.connectionEmitter.wait();
      connection.on((data) => {
        if (data.oneofKind === 'text') {
          console.log('data', [data.text, data?.text?.length]);
        }
        setMsgList((list) => {
          const item: MitemProps = {
            name: '他',
            createdAt: new Date().toISOString(),
            msg: [
              data.oneofKind === 'text'
                ? {
                    type: 'text',
                    content: data.text,
                  }
                : {
                    type: 'file',
                    content: {
                      name: data.name,
                      size: data.size,
                      path: data.path,
                    },
                  },
            ],
          };
          return [...list, item];
        });
      });
    });
  }, []);

  const onSend = async () => {
    console.log('inputMessage', [inputMessage, inputMessage.length]);
    setMsgList((list) => {
      const item: MitemProps = {
        name: '我',
        createdAt: new Date().toISOString(),
        msg: [
          {
            type: 'text',
            content: inputMessage,
          },
        ],
      };
      return [...list, item];
    });

    const [connection] = await udpChannel.connectionEmitter.wait();
    connection.send('text', inputMessage);

    setInputMessage('');
  };

  const onSelectFile = async () => {
    // 微信小程序中读取文件并发送
    const res = await Taro.chooseMessageFile({
      count: 1,
      type: 'file',
    });
    console.log('res', res);
    const [connection] = await udpChannel.connectionEmitter.wait();
    connection.send('file', res.tempFiles[0]);
  };

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
        <Mlist list={msgList}></Mlist>
      </Body>
      <Footer className={Style['footer']} fixedBottom>
        <View className={Style['footer-upload']} onClick={onSelectFile}>
          <Top />
        </View>
        <View className={Style['footer-input']}>
          <TextArea
            rows={1}
            autoSize
            maxLength={-1}
            value={inputMessage}
            onChange={setInputMessage}
          />
        </View>
        <View className={Style['footer-send']} onClick={onSend}>
          发送
        </View>
      </Footer>
    </Page>
  );
}
