import { useContext } from "react";
import { PageCtx } from "../page/page-ctx";
import { ScrollView, View, type StandardProps } from "@tarojs/components";

export type BodyProps = {} & StandardProps;

export default function ViewBody(props: BodyProps) {
  const ctx = useContext(PageCtx);

  return (
    <View
      className={props.className}
      style={{
        height: ctx.bodyHeight,
        overflow: "hidden",
        boxSizing: "border-box",
      }}
    >
      {props.children}
    </View>
  );
}
