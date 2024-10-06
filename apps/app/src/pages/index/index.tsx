import React from 'react';

import { Scan } from '@nutui/icons-react-taro';

import Page from 'src/components/page/page';
import Tabbar from 'src/components/tabbar/tabbar';
import { useRouter } from 'src/libs/tapi/router';

import Style from './index.module.scss';
import IndexMe from './views/index-me/index-me';
import IndexQuick from './views/index-quick/index-quick';

export default function Index() {
  const { props, to } = useRouter();
  const [tabMenu] = React.useState([
    { id: 'quick', text: '快传', icon: 'home', activeIcon: 'home-fill' },
    { id: 'scan', text: '扫码', icon: <Scan />, activeIcon: 'message-fill' },
    { id: 'me', text: '我的', icon: 'user', activeIcon: 'user-fill' },
  ]);
  const [active, setActive] = React.useState(0);

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
          if (middle) {
            to('/pages/scanqr/scanqr');
          } else {
            setActive(index);
          }
        }}
      ></Tabbar>
    </Page>
  );
}
