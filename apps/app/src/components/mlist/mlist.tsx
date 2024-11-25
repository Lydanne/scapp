import { type StandardProps, View } from '@tarojs/components';

import Mitem, { type MitemProps } from './mitem';
import Style from './mlist.module.scss';

export type MlistProps = {
  list: MitemProps[];
  onAbout?: (id: number) => void;
} & StandardProps;

export default function Mlist(props: MlistProps) {
  return (
    <View className={Style['list']}>
      {props.list?.map((item, index) => (
        <Mitem key={index} {...item} onAbout={props.onAbout}></Mitem>
      ))}
    </View>
  );
}
