import { View } from "@tarojs/components";
import Body from "src/components/body/body";
import Navbar from "src/components/navbar/navbar";
import Style from "./index-me.module.scss";

export default function IndexMe() {
  return (
    <>
      <Navbar></Navbar>
      <Body>
        <View className={Style["top"]}></View>
      </Body>
    </>
  );
}
