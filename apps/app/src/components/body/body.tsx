import { useContext } from 'react';
import { PageCtx } from '../page/page-ctx';
import { ScrollView, View, type StandardProps } from '@tarojs/components';

export type BodyProps = {} & StandardProps;

export default function Body(props: BodyProps) {
  const ctx = useContext(PageCtx);

  return ctx.disableScroll ? (
    <View
      className={props.className}
      style={{
        height: ctx.bodyHeight,
        overflow: 'hidden',
        boxSizing: 'border-box',
      }}
    >
      {props.children}
    </View>
  ) : (
    <ScrollView
      className={props.className}
      style={{ height: ctx.bodyHeight }}
      scrollY
    >
      {props.children}
    </ScrollView>
  );
}
