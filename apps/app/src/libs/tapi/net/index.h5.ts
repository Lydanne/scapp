import { invoke } from '@tauri-apps/api/core';

export function getLocalIPAddress() {
  return invoke('net_local_ip');
}
