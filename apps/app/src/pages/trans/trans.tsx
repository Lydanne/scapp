import { Close, Top } from '@nutui/icons-react-taro';
import { TextArea } from '@nutui/nutui-react-taro';
import { View } from '@tarojs/components';

import Body from 'src/components/body/body';
import Footer from 'src/components/footer/footer';
import Mlist from 'src/components/mlist/mlist';
import Navbar from 'src/components/navbar/navbar';
import Page from 'src/components/page/page';
import { useRouter } from 'src/libs/tapi/router';

import Style from './trans.module.scss';

export default function Trans() {
  const { back } = useRouter();
  return (
    <Page footer footerHeight={60}>
      <Navbar>
        <View className={Style['close']} onClick={back}>
          <Close />
        </View>
        <View className={Style['author']}>
          <View
            className={`${Style['author-status']} ${Style['online']}`}
          ></View>
        </View>
        <View className={Style['author']}>
          <View className={Style['author-status']}></View>
        </View>
        <View className={Style['author']}>
          <View className={Style['author-status']}></View>
        </View>
      </Navbar>
      <Body>
        <Mlist></Mlist>
      </Body>
      <Footer className={Style['footer']} fixedBottom>
        <View className={Style['footer-upload']}>
          <Top />
        </View>
        <View className={Style['footer-input']}>
          <TextArea rows={1} autoSize />
        </View>
        <View className={Style['footer-send']}>发送</View>
      </Footer>
    </Page>
  );
}
