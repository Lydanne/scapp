import { useContext } from 'react';

import { ScrollView, type StandardProps, View } from '@tarojs/components';

import { PageCtx } from '../page/page-ctx';

export type BodyProps = {} & StandardProps;

export default function ViewBody(props: BodyProps) {
  const ctx = useContext(PageCtx);

  return (
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
  );
}
