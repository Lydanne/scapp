import { getIcon } from 'omni-file';

import { Close } from '@nutui/icons-react-taro';
import { Image, View } from '@tarojs/components';
import Taro from '@tarojs/taro';

import { AboutStatus, OnDataStatus } from 'src/libs/plink/types';

import Style from './mitem.module.scss';

export type MitemProps = {
  id: number;
  name: string;
  createdAt: string;
  updatedAt?: number;
  msg: {
    type: string;
    content: any;
    status?: OnDataStatus;
    about?: AboutStatus;
    progress?: number;
  }[];
  onAbout?: (id: number) => void;
};

export default function Mitem(props: MitemProps) {
  const onOpenFile = (item: any, index: number) => {
    console.log('onOpenFile', [item, index]);
    Taro.shareFileMessage({
      fileName: item.content.name,
      filePath: item.content.path,
      success() {},
      fail: console.error,
    });
  };
  return (
    <View className={Style['item']}>
      <View className={Style['item-author']}>
        <Image
          className={Style['item-author-img']}
          src={`https://api.dicebear.com/9.x/bottts/avif`}
          mode="aspectFill"
        />
      </View>
      <View className={Style['item-right']}>
        <View className={Style['item-derive']}>{props.name}</View>
        <View className={Style['item-time']}>{props.createdAt}</View>
        <View className={Style['item-body']}>
          {props.msg.map((item, index) => (
            <View className={Style['item-msg-wrapper']} key={index}>
              <View className={Style['item-msg']}>
                {item.type === 'text' && (
                  <View className={Style['text']}>{item.content}</View>
                )}
                {item.type === 'image' && (
                  <View className={Style['image']}></View>
                )}
                {item.type === 'file' && (
                  <View
                    className={Style['file']}
                    onClick={() => onOpenFile(item, index)}
                  >
                    <View className={Style['file-content']}>
                      <View className={Style['file-info']}>
                        <View className={Style['file-name']}>
                          {item.content.name}
                        </View>
                        <View className={Style['file-size']}>
                          {item.content.size}
                        </View>
                      </View>
                      <View className={Style['file-icon']}>
                        <Image
                          className={Style['file-icon-img']}
                          src={`https://codyadam.github.io/omni-file/icons/${getIcon(
                            item.content.name,
                          )}.svg`}
                        ></Image>
                      </View>
                    </View>
                    {Boolean(
                      item.progress &&
                        item.progress < 100 &&
                        item.about !== AboutStatus.STOP,
                    ) && (
                      <View
                        className={`${Style['file-progress']} ${
                          item.about === AboutStatus.STOP
                            ? Style['about-status-stop']
                            : ''
                        }`}
                        style={
                          {
                            '--progress': `${item.progress}%`,
                          } as any
                        }
                      ></View>
                    )}
                  </View>
                )}
              </View>
              <View className={Style['item-about']}>
                {item.status !== OnDataStatus.DONE && (
                  <View
                    className={Style['item-about-btn']}
                    onClick={() => props.onAbout?.(props.id)}
                  >
                    <Close size={12} />
                  </View>
                )}
              </View>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}
