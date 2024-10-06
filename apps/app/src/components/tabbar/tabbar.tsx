import { View } from "@tarojs/components";
import React, { useContext } from "react";
import { PageCtx } from "../page/page-ctx";
import Style from "./tabbar.module.scss";

export type TabbarItem = {
  id: string;
  text: string;
  icon: any;
  activeIcon: any;
};
export type TabbarProps = {
  list: TabbarItem[];
  active: number;
  onChange: (item: TabbarItem, index: number, middle: boolean) => void;
};
export default function Tabbar(props: TabbarProps) {
  const ctx = useContext(PageCtx);

  return (
    <View className={Style["tabbar"]} style={{ height: ctx.footerHeight }}>
      {props.list.map((item: TabbarItem, index: number) => (
        <View
          key={item.id}
          className={`${
            props.list.length % 2 !== 0 &&
            Math.floor(props.list.length / 2) === index
              ? Style["tabbar-mid"]
              : Style["tabbar-item"]
          } ${props.active === index ? Style["active"] : ""}`}
          onClick={() =>
            props.onChange(
              item,
              index,
              props.list.length % 2 !== 0 &&
                Math.floor(props.list.length / 2) === index,
            )
          }
        >
          {item.text}
        </View>
      ))}
    </View>
  );
}
