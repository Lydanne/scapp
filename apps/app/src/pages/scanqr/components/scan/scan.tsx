import { Camera, View } from "@tarojs/components";
import Style from "./scan.module.scss";
import ViewBody from "src/components/body/ViewBody";
import { useContext, useState } from "react";
import { PageCtx } from "src/components/page/page-ctx";
import { useDidShow } from "@tarojs/taro";

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
      <View className={Style["scan"]}>
        <View className={Style["mark"]} style={{ height: ctx.bodyHeight }}>
          <View className={Style["mark-top"]}></View>
          <View className={Style["mark-middle"]}></View>
          <View className={Style["mark-bottom"]}></View>
        </View>
        {showScan && (
          <Camera
            className={Style["scan-img"]}
            device-position="back"
            flash="off"
          ></Camera>
        )}
      </View>
    </ViewBody>
  );
}
