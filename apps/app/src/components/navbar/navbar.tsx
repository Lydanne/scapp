import { View } from "@tarojs/components";
import Taro from "@tarojs/taro";
import { useContext, useEffect, useState } from "react";
import { PageCtx } from "../page/page-ctx";

import "./navbar.scss";

export default function Navbar(props: any) {
  const ctx = useContext(PageCtx);
  return (
    <View
      className="navbar"
      style={{ height: ctx.navbarHeight, paddingLeft: ctx.navbarLeft }}
    >
      {props.children}
    </View>
  );
}
