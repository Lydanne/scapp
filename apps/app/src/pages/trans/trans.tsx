import { useCallback, useEffect, useRef, useState } from 'react';

import { Close, Top } from '@nutui/icons-react-taro';
import { TextArea } from '@nutui/nutui-react-taro';
import { View } from '@tarojs/components';
import Taro from '@tarojs/taro';

import Body from 'src/components/body/body';
import Footer from 'src/components/footer/footer';
import useMlist from 'src/components/mlist/hook';
import Mlist from 'src/components/mlist/mlist';
import Navbar from 'src/components/navbar/navbar';
import Page from 'src/components/page/page';
import { Channel, DataType, type Plink } from 'src/libs/plink/payload';
import { randId, toBinary } from 'src/libs/plink/shared';
import udpChannel, { OnDataStatus } from 'src/libs/plink/udpChannel';
import { formatFileSize } from 'src/libs/shared/format';
import { useRouter } from 'src/libs/tapi/router';

import Style from './trans.module.scss';

type TransProps = {
  plink: Plink;
};

export default function Trans() {
  const [inputMessage, setInputMessage] = useState('');
  const { props, back } = useRouter<TransProps>();
  const { msgList, setMsgById, appendMsg } = useMlist();

  useEffect(() => {
    setTimeout(async () => {
      const [connection] = await udpChannel.connectionEmitter.wait();
      connection.on((data) => {
        // console.log('connection data', data);
        if (data.status === OnDataStatus.READY) {
          console.log('connection data', data);
          appendMsg({
            id: data.id,
            name: '他',
            createdAt: new Date().toISOString(),
            msg: [
              data.type === DataType.TEXT
                ? {
                    type: 'text',
                    status: OnDataStatus.READY,
                    progress: 0,
                    content: '...',
                  }
                : {
                    type: 'file',
                    status: OnDataStatus.READY,
                    progress: 0,
                    content: {
                      name: data.head.name,
                      size: '...',
                      path: data.body,
                    },
                  },
            ],
          });
        } else if (data.status === OnDataStatus.SENDING) {
          setMsgById(data.id, (msg) => {
            if (msg.updatedAt && Date.now() - msg.updatedAt < 1000) return null;
            msg.updatedAt = Date.now();
            msg.msg[0].status = OnDataStatus.SENDING;
            msg.msg[0].progress = data.progress;
            msg.msg[0].content.size = `${formatFileSize(data.speed)}/s`;
            return msg;
          });
        } else if (data.status === OnDataStatus.DONE) {
          console.log('connection data', data);
          setMsgById(data.id, (msg) => {
            msg.msg[0] =
              data.type === DataType.TEXT
                ? {
                    type: 'text',
                    status: OnDataStatus.DONE,
                    progress: data.progress,
                    content: data.body,
                  }
                : {
                    type: 'file',
                    status: OnDataStatus.DONE,
                    progress: data.progress,
                    content: {
                      name: data.head.name,
                      size: `${formatFileSize(data.head.size)}  ${formatFileSize(data.speed)}/s`,
                      path: data.body,
                    },
                  };
            return { ...msg };
          });
        }
      });
    });
  }, []);

  const onSend = async () => {
    console.log('inputMessage', [inputMessage, inputMessage.length]);
    const id = randId();

    appendMsg({
      id,
      name: '我',
      createdAt: new Date().toISOString(),
      msg: [
        {
          type: 'text',
          status: OnDataStatus.READY,
          content: inputMessage,
        },
      ],
    });

    const [connection] = await udpChannel.connectionEmitter.wait();
    connection.send({
      id,
      type: DataType.TEXT,
      head: {
        name: 'message',
        size: inputMessage.length,
      },
      body: inputMessage,
    });

    setInputMessage('');
  };

  const onSelectFile = async () => {
    // 微信小程序中读取文件并发送
    const id = randId();
    const res = await Taro.chooseMessageFile({
      count: 1,
      type: 'file',
    });
    console.log('res', res);
    const [connection] = await udpChannel.connectionEmitter.wait();
    connection.send({
      id,
      type: DataType.FILE,
      head: {
        name: res.tempFiles[0].name,
        size: res.tempFiles[0].size,
      },
      body: res.tempFiles[0].path,
    });
    appendMsg({
      id,
      name: '我',
      createdAt: new Date().toISOString(),
      msg: [
        {
          type: 'file',
          status: OnDataStatus.READY,
          content: {
            name: res.tempFiles[0].name,
            size: '...',
            path: res.tempFiles[0].path,
          },
        },
      ],
    });
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
