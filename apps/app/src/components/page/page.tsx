import { useCallback, useContext, useEffect, useState } from 'react';

import { type StandardProps, View } from '@tarojs/components';
import Taro, { useResize } from '@tarojs/taro';

import tapi from 'src/libs/tapi';

import { PageCtx } from './page-ctx';
import Style from './page.module.scss';

export type PageProps = {
  footer?: boolean;
  footerHeight?: number;
  disableNavbar?: boolean;
  disableScroll?: boolean;
  children: any;
} & StandardProps;

export default function Page(props: PageProps) {
  const ctx = useContext(PageCtx);
  const [newCtx, setNewCtx] = useState(ctx);

  const updateWindow = useCallback(() => {
    const rect = tapi.getMenuButtonBoundingClientRect();
    const windowInfo = tapi.getWindowInfo();
    const deviceInfo = tapi.getDeviceInfo();
    // console.log(
    //   { windowInfo, rect, deviceInfo },
    //   tapi.canIUse('getMenuButtonBoundingClientRect'),
    // );

    const ios = !!(deviceInfo.platform.toLowerCase().search('ios') + 1);
    const leftWidth = 24;
    const navbar = {
      ios,
      height: rect.height + 4,
      statusBarHeight: rect.top,
      leftWidth,
      middleWidth: windowInfo.screenWidth - leftWidth * 2,
    };

    const topHeight = navbar.height + navbar.statusBarHeight;
    const bodyHeightFull =
      (windowInfo.safeArea?.bottom || windowInfo.windowHeight) -
      (props.disableNavbar ? 0 : topHeight);

    const footerHeight = props.footerHeight || 50;
    const tCtx = Object.assign({}, newCtx, {
      navbarHeight: props.disableNavbar ? 0 : topHeight,
      footerHeight: footerHeight,
      bodyHeight: bodyHeightFull - (props.footer ? footerHeight : 0),
      disableScroll: props.disableScroll,
    });
    // console.log({ navbar, topHeight, bodyHeightFull, footerHeight, tCtx });
    setNewCtx(tCtx);
  }, []);

  useEffect(updateWindow, []);

  useResize(() => {
    updateWindow();
  });

  return (
    <PageCtx.Provider value={newCtx}>
      <View className={Style['page']}>{props.children}</View>
    </PageCtx.Provider>
  );
}
