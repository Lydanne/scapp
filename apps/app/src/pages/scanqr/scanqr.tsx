import { View } from "@tarojs/components";
import Page from "src/components/page/page";
import Style from "./scanqr.module.scss";
import { Close, ImageRectangle, Retweet } from "@nutui/icons-react-taro";
import Footer from "src/components/footer/footer";
import { useRouter } from "src/libs/tapi/router";
import Scan from "./components/scan/scan";

export default function Scanqr() {
  const { back } = useRouter();

  return (
    <Page disableScroll disableNavbar footer footerHeight={130}>
      <View className={Style["close"]} onClick={back}>
        <Close />
      </View>
      <Scan></Scan>
      <Footer>
        <View className={Style["btns"]}>
          <View className={Style["btns-icon"]}>
            <ImageRectangle size={24} color="#666" />
          </View>
          <View className={Style["btns-mid"]}>
            <View className={Style["mid-border"]}></View>
          </View>
          <View className={Style["btns-icon"]}>
            <Retweet size={24} color="#666" />
          </View>
        </View>
      </Footer>
    </Page>
  );
}
