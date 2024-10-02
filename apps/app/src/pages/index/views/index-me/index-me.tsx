import { View } from "@tarojs/components";
import Body from "src/components/body/body";
import Navbar from "src/components/navbar/navbar";
import Style from "./index-me.module.scss";
import React, { useEffect } from "react";
import Taro from "@tarojs/taro";

export default function IndexMe() {
  const [clickQiafan, setClickQiafan] = React.useState(false);

  const onClickQiafan = () => {
    console.log("onClickQiafan");
    setClickQiafan(true);
    Taro.showToast({
      title: "你真的很帅~",
      icon: "none",
      duration: 1000,
    });
    setTimeout(() => {
      setClickQiafan(false);
    }, 1000);
  };

  return (
    <>
      <Navbar>设备状态</Navbar>
      <Body>
        <View className={Style["top"]}>
          <View className={Style["top-name"]}>Redmi K60s</View>
          <View className={Style["top-sub"]}>IP 地址: 192.168.0.10</View>
          <View className={Style["top-sub"]}>网络状态: 100</View>
        </View>
        <View className={Style["menu-top"]}>
          <View className={Style["menu-top-item"]}>
            <View className={Style["item-icon"]}></View>
            <View className={Style["item-label"]}>设备信息</View>
          </View>
          <View className={Style["menu-top-item"]}>
            <View className={Style["item-icon"]}></View>
            <View className={Style["item-label"]}>关联设备</View>
          </View>
          <View className={Style["menu-top-item"]}>
            <View className={Style["item-icon"]}></View>
            <View className={Style["item-label"]}>历史文件</View>
          </View>
          <View className={Style["menu-top-item"]}>
            <View className={Style["item-icon"]}></View>
            <View className={Style["item-label"]}>我的网盘</View>
          </View>
        </View>
        <View className={Style["menu-list"]}>
          <View className={Style["menu-list-item"]}>
            <View className={Style["item-label"]}>我的文件</View>
            <View className={Style["item-icon"]}></View>
          </View>
          <View className={Style["menu-list-item"]}>
            <View className={Style["item-label"]}>我的文件</View>
            <View className={Style["item-icon"]}></View>
          </View>
          <View className={Style["menu-list-item"]}>
            <View className={Style["item-label"]}>我的文件</View>
            <View className={Style["item-icon"]}></View>
          </View>
          <View className={Style["menu-list-item"]}>
            <View className={Style["item-label"]}>我的文件</View>
            <View className={Style["item-icon"]}></View>
          </View>
        </View>
        <View className={Style["qiafan"]} onClick={onClickQiafan}>
          <View
            className={`${Style["qiafan-icon"]} ${
              clickQiafan ? Style["qiafan-active"] : ""
            }`}
          >
            👍
          </View>
          <View className={Style["qiafan-label"]}> 请作者喝杯咖啡吧~ </View>
        </View>
      </Body>
    </>
  );
}
