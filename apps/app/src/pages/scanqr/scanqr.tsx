import Page from 'src/components/page/page';
import Footer from 'src/components/footer/footer';
import { useRouter } from 'src/libs/tapi/router';
import Scan from './components/scan/scan';
import { View } from '@tarojs/components';
import { Close, ImageRectangle, Retweet } from '@nutui/icons-react-taro';

import Style from './scanqr.module.scss';

export default function Scanqr() {
  const { back, to } = useRouter();

  const onClickTake = () => {
    console.log('onClickTake');
    to('/pages/trans/trans');
  };

  return (
    <Page disableScroll disableNavbar footer footerHeight={130}>
      <View className={Style['close']} onClick={back}>
        <Close />
      </View>
      <Scan></Scan>
      <Footer>
        <View className={Style['btns']}>
          <View className={Style['btns-icon']}>
            <ImageRectangle size={24} color="#666" />
          </View>
          <View className={Style['btns-mid']} onClick={onClickTake}>
            <View className={Style['mid-border']}></View>
          </View>
          <View className={Style['btns-icon']}>
            <Retweet size={24} color="#666" />
          </View>
        </View>
      </Footer>
    </Page>
  );
}
