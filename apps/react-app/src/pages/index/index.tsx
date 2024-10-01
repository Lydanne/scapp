import React from "react";
import { View } from "@tarojs/components";
import { Button } from "@nutui/nutui-react-taro";
import "./index.scss";
import Comp1 from "../../components/comp1/comp1";

function Index() {
  const [data, setData] = React.useState([] as any);
  React.useEffect(() => {
    setData([
      {
        component: Comp1,
        props: {
          label: "hello",
        },
      },
      {
        component: Comp1,
        props: {
          label: "hello2",
        },
      },
    ]);
  }, [data]);
  return (
    <View className="nutui-react-demo">
      {/* <View className="index">欢迎使用 NutUI React 开发 Taro 多端项目。</View>
      <View className="index">
        <Button type="primary" className="btn">
          NutUI React Button
        </Button>
      </View> */}
      <View>
        {data.map((item: any, index: number) => {
          const Comp = item.component;
          return (
            <Comp
              key={index}
              {...item.props}
              slot={(label: any) => {
                return <View style={{ color: "red" }}>{label}</View>;
              }}
            />
          );
        })}
      </View>
    </View>
  );
}

export default Index;
