import { useContext } from "react";
import { PageCtx } from "../page/page-ctx";
import { ScrollView, View, type StandardProps } from "@tarojs/components";

export type BodyProps = {
  disableScroll?: boolean;
} & StandardProps;

export default function Body(props: BodyProps) {
  const ctx = useContext(PageCtx);

  return props.disableScroll ? (
    <View className={props.className} style={{ height: ctx.bodyHeight }}>
      {props.children}
    </View>
  ) : (
    <ScrollView
      className={props.className}
      style={{ height: ctx.bodyHeight }}
      scrollY
    >
      {props.children}
    </ScrollView>
  );
}
