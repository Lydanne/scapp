import React from "react";
import Tabbar from "src/components/tabbar/tabbar";
import "./index.scss";
import Page from "src/components/page/page";
import IndexQuick from "./views/index-quick/index-quick";
import IndexMe from "./views/index-me/index-me";
import { useRouter } from "src/libs/tapi/router";

export default function Index() {
  const { props } = useRouter();
  const [tabMenu] = React.useState([
    { id: "quick", text: "快传", icon: "home", activeIcon: "home-fill" },
    { id: "scan", text: "扫码", icon: "message", activeIcon: "message-fill" },
    { id: "me", text: "我的", icon: "user", activeIcon: "user-fill" },
  ]);
  const [active, setActive] = React.useState(0);

  console.log(props);

  return (
    <Page className="page" footer>
      {active === 0 ? (
        <IndexQuick></IndexQuick>
      ) : active === 2 ? (
        <IndexMe></IndexMe>
      ) : null}

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
