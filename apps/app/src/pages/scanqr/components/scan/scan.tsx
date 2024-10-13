import { useContext, useState } from 'react';

import { Camera, View } from '@tarojs/components';
import { useDidShow } from '@tarojs/taro';

import ViewBody from 'src/components/body/ViewBody';
import { PageCtx } from 'src/components/page/page-ctx';

import Style from './scan.module.scss';

export default function Scan() {
  const ctx = useContext(PageCtx);

  const [showScan, setShowScan] = useState(false);

  useDidShow(() => {
    setTimeout(() => {
      setShowScan(true);
    }, 600);
  });

  return (
    <ViewBody>
      <View className={Style['scan']}>
        <View className={Style['mark']} style={{ height: ctx.bodyHeight }}>
          <View className={Style['mark-top']}></View>
          <View className={Style['mark-middle']}></View>
          <View className={Style['mark-bottom']}></View>
        </View>
        {showScan && (
          <Camera
            className={Style['scan-img']}
            device-position="back"
            flash="off"
            mode="scanCode"
            onScanCode={(e) => {
              console.log('onScanCode', e);
            }}
          ></Camera>
        )}
      </View>
    </ViewBody>
  );
}
