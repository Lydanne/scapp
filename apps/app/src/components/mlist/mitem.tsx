import { View } from '@tarojs/components';
import Taro from '@tarojs/taro';

import Style from './mitem.module.scss';

export type MitemProps = {
  name: string;
  createdAt: string;
  msg: {
    type: string;
    content: any;
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
      <View className={Style['item-author']}></View>
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
                  <View className={Style['file-info']}>
                    <View className={Style['file-name']}>
                      {item.content.name}
                    </View>
                    <View className={Style['file-size']}>
                      {item.content.size}
                    </View>
                  </View>
                  <View className={Style['file-icon']}></View>
                </View>
              )}
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}
