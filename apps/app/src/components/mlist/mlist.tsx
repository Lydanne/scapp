import { type StandardProps, View } from '@tarojs/components';

import Mitem from './mitem';
import Style from './mlist.module.scss';

export default function Mlist(props: StandardProps) {
  return (
    <View className={Style['list']}>
      <Mitem
        name="红米 k60s"
        createdAt="2024-10-11"
        msg={[
          {
            type: 'file',
            content: {
              name: '红米 k60s',
              size: '1.2M',
            },
          },
          {
            type: 'file',
            content: {
              name: '红米 k60s',
              size: '1.2M',
            },
          },
        ]}
      ></Mitem>
      <Mitem
        name="红米 k60s"
        createdAt="2024-10-11"
        msg={[
          {
            type: 'file',
            content: {
              name: '红米 k60s',
              size: '1.2M',
            },
          },
        ]}
      ></Mitem>
      <Mitem
        name="红米 k60s"
        createdAt="2024-10-11"
        msg={[
          {
            type: 'file',
            content: {
              name: '红米 k60s',
              size: '1.2M',
            },
          },
        ]}
      ></Mitem>
      <Mitem
        name="红米 k60s"
        createdAt="2024-10-11"
        msg={[
          {
            type: 'file',
            content: {
              name: '红米 k60s',
              size: '1.2M',
            },
          },
        ]}
      ></Mitem>
      <Mitem
        name="红米 k60s"
        createdAt="2024-10-11"
        msg={[
          {
            type: 'file',
            content: {
              name: '红米 k60s',
              size: '1.2M',
            },
          },
        ]}
      ></Mitem>
    </View>
  );
}
