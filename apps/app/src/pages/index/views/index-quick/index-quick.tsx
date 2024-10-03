import { Image, View } from "@tarojs/components";

import Style from "./index-quick.module.scss";
import Navbar from "src/components/navbar/navbar";
import Body from "src/components/body/body";

export default function IndexQuick() {
  return (
    <>
      <Navbar style={{ background: "#05C15F", color: "#fff" }}>
        Redmi K60s
      </Navbar>
      <Body>
        <View className={Style["top"]}>
          <View className={Style["top-qr"]}>
            <Image
              className={Style["qr-image"]}
              src="data:image/png;base64,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"
            ></Image>
          </View>
        </View>
        <View className={Style["list"]}>
          <View className={Style["item"]}>
            <View className={Style["item-author"]}></View>
            <View className={Style["item-right"]}>
              <View className={Style["item-derive"]}>Redmi K60s</View>
              <View className={Style["item-time"]}>2022-03-01 12:00</View>
              <View className={Style["item-body"]}>
                <View className={Style["file"]}>
                  <View className={Style["file-info"]}>
                    <View className={Style["file-name"]}>文件名</View>
                    <View className={Style["file-size"]}>1.2MB</View>
                  </View>
                  <View className={Style["file-icon"]}></View>
                </View>
                <View className={Style["file"]}>
                  <View className={Style["file-info"]}>
                    <View className={Style["file-name"]}>文件名</View>
                    <View className={Style["file-size"]}>1.2MB</View>
                  </View>
                  <View className={Style["file-icon"]}></View>
                </View>
              </View>
            </View>
          </View>
          <View className={Style["item"]}>
            <View className={Style["item-author"]}></View>
            <View className={Style["item-right"]}>
              <View className={Style["item-derive"]}>Redmi K60s</View>
              <View className={Style["item-time"]}>2022-03-01 12:00</View>
              <View className={Style["item-body"]}>
                <View className={Style["file"]}>
                  <View className={Style["file-info"]}>
                    <View className={Style["file-name"]}>文件名</View>
                    <View className={Style["file-size"]}>1.2MB</View>
                  </View>
                  <View className={Style["file-icon"]}></View>
                </View>
                <View className={Style["file"]}>
                  <View className={Style["file-info"]}>
                    <View className={Style["file-name"]}>文件名</View>
                    <View className={Style["file-size"]}>1.2MB</View>
                  </View>
                  <View className={Style["file-icon"]}></View>
                </View>
              </View>
            </View>
          </View>
          <View className={Style["item"]}>
            <View className={Style["item-author"]}></View>
            <View className={Style["item-right"]}>
              <View className={Style["item-derive"]}>Redmi K60s</View>
              <View className={Style["item-time"]}>2022-03-01 12:00</View>
              <View className={Style["item-body"]}>
                <View className={Style["file"]}>
                  <View className={Style["file-info"]}>
                    <View className={Style["file-name"]}>文件名</View>
                    <View className={Style["file-size"]}>1.2MB</View>
                  </View>
                  <View className={Style["file-icon"]}></View>
                </View>
                <View className={Style["file"]}>
                  <View className={Style["file-info"]}>
                    <View className={Style["file-name"]}>文件名</View>
                    <View className={Style["file-size"]}>1.2MB</View>
                  </View>
                  <View className={Style["file-icon"]}></View>
                </View>
              </View>
            </View>
          </View>
          <View style={{ height: 50 }}></View>
        </View>
      </Body>
    </>
  );
}
