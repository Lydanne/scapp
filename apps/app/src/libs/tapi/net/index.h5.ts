import Taro from '@tarojs/taro';

export function getLocalIPAddress() {
  return window.invoke('net_local_ip');
}
