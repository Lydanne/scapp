import { View } from '@tarojs/components';
import { useReady } from '@tarojs/taro';

import Body from 'src/components/body/body';
import Navbar from 'src/components/navbar/navbar';
import Page from 'src/components/page/page';
import { toggleFullScreen } from 'src/libs/shared/screen';
import { useRouter } from 'src/libs/tapi/router';

import Style from './start.module.scss';

export default function Start() {
  const { to } = useRouter();
  const onClickStart = () => {
    to('/pages/index/index', {
      id: '11',
    });
  };

  useReady(() => {
    onClickStart();
  });

  return (
    <Page disableScroll>
      <Navbar style={{ background: '#05C15F', color: '#fff' }}></Navbar>
      <Body className={Style['body']}>
        <View className={Style['btn']} onClick={onClickStart}>
          打开
        </View>
      </Body>
    </Page>
  );
}
