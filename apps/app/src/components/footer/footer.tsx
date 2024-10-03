import { View, type StandardProps } from "@tarojs/components";
import Taro from "@tarojs/taro";
import { useContext, useEffect, useState } from "react";
import { PageCtx } from "../page/page-ctx";

import Style from "./footer.module.scss";

export default function Footer(props: StandardProps) {
  const ctx = useContext(PageCtx);
  return (
    <View
      className={Style["footer"] + " " + props.className}
      style={Object.assign(
        {
          height: ctx.footerHeight,
          boxSizing: "border-box",
          overflow: "hidden",
        },
        props.style
      )}
    >
      {props.children}
    </View>
  );
}
