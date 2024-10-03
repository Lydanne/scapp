import { useContext } from "react";
import { PageCtx } from "../page/page-ctx";
import { ScrollView, type StandardProps } from "@tarojs/components";

export default function Body(props: StandardProps) {
  const ctx = useContext(PageCtx);

  return (
    <ScrollView
      className={props.className}
      style={{ height: ctx.bodyHeight }}
      scrollY
    >
      {props.children}
    </ScrollView>
  );
}
