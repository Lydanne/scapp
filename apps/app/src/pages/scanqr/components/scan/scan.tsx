import { useContext, useState } from 'react';

import {
  type BaseEventOrig,
  Camera,
  type CameraProps,
  type StandardProps,
  View,
} from '@tarojs/components';
import { useDidShow } from '@tarojs/taro';

import Acamera from 'src/components/acamera';
import ViewBody from 'src/components/body/ViewBody';
import { PageCtx } from 'src/components/page/page-ctx';

// import { decode } from 'src/libs/plink';
import Style from './scan.module.scss';

type ScanProps = {
  onScan(data: string): void;
} & StandardProps;

export default function Scan(props: ScanProps) {
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
          <Acamera
            className={Style['scan-img']}
            device-position="back"
            flash="off"
            mode="scanCode"
            onScanCode={(e) => {
              // console.log('onScanCode', e, decode(e.detail.result));
              props.onScan(e.detail.result);
            }}
          ></Acamera>
        )}
      </View>
    </ViewBody>
  );
}
