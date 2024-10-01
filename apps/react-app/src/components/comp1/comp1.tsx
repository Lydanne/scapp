import React from "react";
import { View } from "@tarojs/components";

export default function Comp1(props: any) {
  return <View>{props.slot(props.label)}</View>;
}
