import { useContext } from "react";
import { PageCtx } from "../page/page-ctx";
import { ScrollView } from "@tarojs/components";

export default function Body(props: any) {
  const ctx = useContext(PageCtx);

  return (
    <ScrollView className="body" style={{ height: ctx.bodyHeight }} scrollY>
      {props.children}
    </ScrollView>
  );
}
