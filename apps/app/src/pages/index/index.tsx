import React from "react";
import { View, Image } from "@tarojs/components";
import Taro from "@tarojs/taro";
import Tabbar from "../../components/tabbar/tabbar";
import "./index.scss";
import Navbar from "../../components/navbar/navbar";
import Page from "../../components/page/page";
import Body from "../../components/body/body";
import IndexQuick from "./components/index-quick/index-quick";
import IndexMe from "./components/index-me/index-me";

function Index() {
  const [tabMenu] = React.useState([
    { id: "quick", text: "快传", icon: "home", activeIcon: "home-fill" },
    { id: "scan", text: "扫码", icon: "message", activeIcon: "message-fill" },
    { id: "me", text: "我的", icon: "user", activeIcon: "user-fill" },
  ]);
  const [active, setActive] = React.useState(0);

  return (
    <Page className="page">
      <Navbar>Redmi K60s</Navbar>
      <Body>
        {active === 0 ? (
          <IndexQuick></IndexQuick>
        ) : active === 2 ? (
          <IndexMe></IndexMe>
        ) : null}
      </Body>
      <Tabbar
        list={tabMenu}
        active={active}
        onChange={(_, index, middle) => {
          if (!middle) {
            setActive(index);
          }
        }}
      ></Tabbar>
    </Page>
  );
}

export default Index;
