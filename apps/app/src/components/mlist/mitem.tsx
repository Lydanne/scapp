import { getIcon } from 'omni-file';

import { Image, View } from '@tarojs/components';
import Taro from '@tarojs/taro';

import type { OnDataStatus } from 'src/libs/plink';

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
    progress?: number;
  }[];
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
            <View key={index} className={Style['item-msg']}>
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
                  {Boolean(item.progress && item.progress < 100) && (
                    <View
                      className={Style['file-progress']}
                      style={{ '--progress': `${item.progress}%` } as any}
                    ></View>
                  )}
                </View>
              )}
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}
