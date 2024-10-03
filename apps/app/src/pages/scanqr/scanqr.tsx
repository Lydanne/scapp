import { Image, Text, View } from "@tarojs/components";
import Body from "src/components/body/body";
import Navbar from "src/components/navbar/navbar";
import Page from "src/components/page/page";
import testJpg from "./test.jpg";
import Style from "./scanqr.module.scss";
import { ImageRectangle, Retweet } from "@nutui/icons-react-taro";

export default function Scanqr() {
  return (
    <Page>
      <Navbar style={{ background: "#000000", color: "#fff" }}></Navbar>
      <Body>
        <View className={Style["scan"]}>
          <Image className={Style["scan-img"]} src={testJpg}></Image>
          <View className={Style["mark-top"]}></View>
          <View className={Style["mark-middle"]}></View>
          <View className={Style["mark-bottom"]}></View>
        </View>
        <View className={Style["btns"]}>
          <View className={Style["btns-left"]}>
            <ImageRectangle />
          </View>
          <View className={Style["btns-mid"]}></View>
          <View className={Style["btns-right"]}>
            <Retweet />
          </View>
        </View>
      </Body>
    </Page>
  );
}
