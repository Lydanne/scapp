import { View } from "@tarojs/components";
import { useContext, useEffect, useState } from "react";
import { PageCtx } from "./page-ctx";
import tapi from "src/libs/tapi";

export default function Page(props: any) {
  const ctx = useContext(PageCtx);
  const [newCtx, setNewCtx] = useState(ctx);

  useEffect(() => {
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
