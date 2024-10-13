import { useEffect, useState } from 'react';
import CodeCreator from 'taro-code-creator';

import { Loading } from '@nutui/icons-react-taro';
import { StandardProps, View } from '@tarojs/components';
import Taro from '@tarojs/taro';

import tapi from 'src/libs/tapi';

import Style from './qrcode.module.scss';

export type QrcodeProps = {
  pcSize?: number; // %
} & StandardProps;

export default function Qrcode(props: QrcodeProps) {
  const [size, setSize] = useState(0);

  useEffect(() => {
    setTimeout(() => {
      Taro.createSelectorQuery()
        .select('#qrcode-wrap')
        .boundingClientRect()
        .exec((res) => {
          // console.log('boundingClientRect', res);
          if (props.pcSize) {
            const info = tapi.getWindowInfo();
            const size = (info.screenWidth * props.pcSize) / 100;
            setSize(size);
          } else {
            // console.log('res[0].width', res[0].width);
            setSize(res[0].width * 0.88);
          }
        });
    }, 500);
  }, []);

  return (
    <View
      id="qrcode-wrap"
      className={props.className + ' ' + Style['qrcode-wrap']}
      style={Object.assign({}, props.style, { '--qrcode-size': size + 'px' })}
    >
      {size > 0 ? (
        <CodeCreator
          codeText={String(props.children)}
          size={size}
          logoSize={100}
        />
      ) : (
        <Loading></Loading>
      )}
    </View>
  );
}
