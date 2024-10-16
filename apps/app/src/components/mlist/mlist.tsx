import { type StandardProps, View } from '@tarojs/components';

import Mitem, { type MitemProps } from './mitem';
import Style from './mlist.module.scss';

export type MlistProps = {
  list: MitemProps[];
} & StandardProps;

export default function Mlist(props: MlistProps) {
  return (
    <View className={Style['list']}>
      {props.list?.map((item, index) => <Mitem key={index} {...item}></Mitem>)}
    </View>
  );
}
