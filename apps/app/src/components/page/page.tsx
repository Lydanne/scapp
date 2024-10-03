import { View, type StandardProps } from "@tarojs/components";
import { useCallback, useContext, useEffect, useState } from "react";
import { PageCtx } from "./page-ctx";
import tapi from "src/libs/tapi";
import Taro, { useResize } from "@tarojs/taro";
import { Toast } from "@nutui/nutui-react-taro";

export type PageProps = {
  footer?: boolean;
  children: any;
} & StandardProps;

export default function Page(props: PageProps) {
  const ctx = useContext(PageCtx);
  const [newCtx, setNewCtx] = useState(ctx);

  const updateWindow = useCallback(() => {
    const rect = tapi.getMenuButtonBoundingClientRect();
    const windowInfo = tapi.getWindowInfo();
    const deviceInfo = tapi.getDeviceInfo();
    console.log(
      { windowInfo, rect, deviceInfo },
      tapi.canIUse("getMenuButtonBoundingClientRect")
    );

    const ios = !!(deviceInfo.system.toLowerCase().search("ios") + 1);
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
      (windowInfo.safeArea?.bottom || windowInfo.windowHeight) - topHeight;

    const footerHeight = 50;
    const tCtx = Object.assign({}, newCtx, {
      navbarHeight: topHeight,
      footerHeight: footerHeight,
      bodyHeight: bodyHeightFull - (props.footer ? footerHeight : 0),
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
      <View style={{ height: "100vh" }}>{props.children}</View>
    </PageCtx.Provider>
  );
}
