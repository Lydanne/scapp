import React, { useEffect } from 'react';

import { View } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { invoke } from '@tauri-apps/api/core';

import Body from 'src/components/body/body';
import Navbar from 'src/components/navbar/navbar';
import { Base64 } from 'src/libs/base64';
import { APP } from 'src/libs/tapi/platform';
import { router } from 'src/libs/tapi/router';

import Style from './index-me.module.scss';

export default function IndexMe() {
  const [clickQiafan, setClickQiafan] = React.useState(false);

  const onClickQiafan = () => {
    console.log('onClickQiafan');
    setClickQiafan(true);
    Taro.showToast({
      title: '你真的很帅~',
      icon: 'none',
      duration: 1000,
    });
    setTimeout(async () => {
      setClickQiafan(false);
      Base64.encode('🤣').then((res) => {
        console.log(res);
        Base64.decode(res).then((res) => {
          console.log(res);
        });
      });
    }, 1000);
  };

  const onClickSpeedTest = () => {
    router.to('/pages/speed-test/speed-test');
  };

  return (
    <>
      <Navbar style={{ background: '#05C15F', color: '#fff' }}>设备状态</Navbar>
      <Body>
        <View className={Style['top']}>
          <View className={Style['top-name']}>Redmi K60s</View>
          <View className={Style['top-sub']}>IP 地址: 192.168.0.10</View>
          <View className={Style['top-sub']}>网络状态: 100</View>
        </View>
        <View className={Style['menu-top']}>
          <View className={Style['menu-top-item']} onClick={onClickSpeedTest}>
            <View className={Style['item-icon']}></View>
            <View className={Style['item-label']}>网络测速</View>
          </View>
          <View className={Style['menu-top-item']}>
            <View className={Style['item-icon']}></View>
            <View className={Style['item-label']}>关联设备</View>
          </View>
          <View className={Style['menu-top-item']}>
            <View className={Style['item-icon']}></View>
            <View className={Style['item-label']}>历史文件</View>
          </View>
          <View className={Style['menu-top-item']}>
            <View className={Style['item-icon']}></View>
            <View className={Style['item-label']}>我的网盘</View>
          </View>
        </View>
        <View className={Style['menu-list']}>
          <View className={Style['menu-list-item']}>
            <View className={Style['item-label']}>系统设置</View>
            <View className={Style['item-icon']}></View>
          </View>
          <View className={Style['menu-list-item']}>
            <View className={Style['item-label']}>帮助文档</View>
            <View className={Style['item-icon']}></View>
          </View>
          <View className={Style['menu-list-item']}>
            <View className={Style['item-label']}>关于我们</View>
            <View className={Style['item-icon']}></View>
          </View>
          <View className={Style['menu-list-item']}>
            <View className={Style['item-label']}>分享给朋友</View>
            <View className={Style['item-icon']}></View>
          </View>
        </View>
        <View className={Style['qiafan']} onClick={onClickQiafan}>
          <View
            className={`${Style['qiafan-icon']} ${
              clickQiafan ? Style['qiafan-active'] : ''
            }`}
          >
            👍
          </View>
          <View className={Style['qiafan-label']}> 请作者喝杯咖啡吧~ </View>
        </View>
      </Body>
    </>
  );
}
