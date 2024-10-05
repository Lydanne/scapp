import { View, type StandardProps } from "@tarojs/components";
import Taro from "@tarojs/taro";
import { useContext, useEffect, useState } from "react";
import { PageCtx } from "../page/page-ctx";

import Style from "./footer.module.scss";

export type FooterProps = {
  fixedBottom?: boolean;
} & StandardProps;

export default function Footer(props: FooterProps) {
  const ctx = useContext(PageCtx);

  const fixedStyle = props.fixedBottom
    ? {
        position: "fixed",
        bottom: `calc(100vh - ${
          ctx.navbarHeight + ctx.footerHeight + ctx.bodyHeight
        }px)`,
        left: 0,
        width: "100%",
        zIndex: 100,
        minHeight: ctx.footerHeight,
      }
    : {
        height: ctx.footerHeight,
      };
  return (
    <View
      className={Style["footer"] + " " + props.className}
      style={Object.assign(
        {
          boxSizing: "border-box",
          overflow: "hidden",
        },
        fixedStyle,
        props.style
      )}
    >
      {props.children}
    </View>
  );
}
