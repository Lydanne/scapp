import { View } from "@tarojs/components";
import React, { useContext } from "react";
import { PageCtx } from "../page/page-ctx";
import "./tabbar.scss";

export type TabbarItem = {
  id: string;
  text: string;
  icon: string;
  activeIcon: string;
};
export type TabbarProps = {
  list: TabbarItem[];
  active: number;
  onChange: (item: TabbarItem, index: number, middle: boolean) => void;
};
export default function Tabbar(props: TabbarProps) {
  const ctx = useContext(PageCtx);

  return (
    <View className="tabbar" style={{ height: ctx.footerHeight }}>
      {props.list.map((item: TabbarItem, index: number) => (
        <View
          key={item.id}
          className={`${
            props.list.length % 2 !== 0 &&
            Math.floor(props.list.length / 2) === index
              ? "tabbar-mid"
              : "tabbar-item"
          } ${props.active === index ? "active" : ""}`}
          onClick={() =>
            props.onChange(
              item,
              index,
              props.list.length % 2 !== 0 &&
                Math.floor(props.list.length / 2) === index
            )
          }
        >
          {item.text}
        </View>
      ))}
    </View>
  );
}
