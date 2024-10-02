import { View } from "@tarojs/components";
import Taro from "@tarojs/taro";
import { useContext, useEffect, useState } from "react";
import { PageCtx } from "./page-ctx";

export default function Page(props: any) {
  const ctx = useContext(PageCtx);
  const [newCtx, setNewCtx] = useState(ctx);

  useEffect(() => {
    const isSupport = !!Taro.getMenuButtonBoundingClientRect;
    const rect = Taro.getMenuButtonBoundingClientRect();
    const windowInfo = Taro.getWindowInfo();
    const deviceInfo = Taro.getDeviceInfo();
    // console.log({ windowInfo, rect, deviceInfo });

    const ios = !!(deviceInfo.system.toLowerCase().search("ios") + 1);
    const leftWidth = 24;
    const navbar = {
      ios,
      height: isSupport ? rect.height + 4 : 45,
      statusBarHeight: isSupport ? rect.top : windowInfo.statusBarHeight || 20,
      leftWidth,
      middleWidth: windowInfo.screenWidth - leftWidth * 2,
    };

    const topHeight = navbar.height + navbar.statusBarHeight;
    const bodyHeightFull =
      (windowInfo.safeArea?.bottom ?? windowInfo.screenHeight) - topHeight;

    const footerHeight = 50;
    const tCtx = Object.assign({}, newCtx, {
      navbarHeight: topHeight,
      footerHeight: footerHeight,
      bodyHeight: bodyHeightFull - footerHeight,
    });
    // console.log({ navbar, topHeight, bodyHeightFull, footerHeight, tCtx });
    setNewCtx(tCtx);
  }, []);

  return (
    <PageCtx.Provider value={newCtx}>
      <View className="page" style={{ height: "100vh" }}>
        {props.children}
      </View>
    </PageCtx.Provider>
  );
}
