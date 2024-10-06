import { useContext, useEffect, useState } from 'react';

import { type StandardProps, View } from '@tarojs/components';
import Taro from '@tarojs/taro';

import { PageCtx } from '../page/page-ctx';
import Style from './navbar.module.scss';

export default function Navbar(props: StandardProps) {
  const ctx = useContext(PageCtx);
  return (
    <View
      className={Style['navbar'] + ' ' + props.className}
      style={Object.assign(
        { height: ctx.navbarHeight, paddingLeft: ctx.navbarLeft },
        props.style,
      )}
    >
      {props.children}
    </View>
  );
}
