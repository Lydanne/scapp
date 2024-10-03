import { View } from "@tarojs/components";
import Page from "src/components/page/page";
import Body from "src/components/body/body";

import Style from "./start.module.scss";
import Navbar from "src/components/navbar/navbar";
import { toggleFullScreen } from "src/libs/shared/screen";
import { useRouter } from "src/libs/tapi/router";

export default function Start() {
  const { to } = useRouter();
  const onClickStart = () => {
    to("/pages/index/index", {
      id: "11",
    });
  };

  return (
    <Page>
      <Navbar></Navbar>
      <Body className={Style["body"]}>
        <View className={Style["btn"]} onClick={onClickStart}>
          打开
        </View>
      </Body>
    </Page>
  );
}
