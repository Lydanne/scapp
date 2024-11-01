import type { UDPSocket } from '@tarojs/taro';
import Taro from '@tarojs/taro';

import { KCP } from './kcp';

class KCPSession {
  kcp: KCP;
  address: string;
  port: number;
  lastReceiveTime: number;

  constructor(conv: number, address: string, port: number, socket: UDPSocket) {
    this.address = address;
    this.port = port;
    this.lastReceiveTime = Date.now();

    this.kcp = new KCP(conv, (data: Uint8Array, sender: string) => {
      // 通过UDP发送数据
      socket.send({
        address: this.address,
        port: this.port,
        message: data.buffer as ArrayBuffer,
      });
    });

    // 配置KCP参数
    this.kcp.setNoDelay(1, 10, 2, 1);
    this.kcp.setWndSize(128, 128);
  }

  update(current: number) {
    this.kcp.update(current);
  }

  // 检查会话是否超时
  isTimeout(current: number, timeout: number = 30000): boolean {
    return current - this.lastReceiveTime > timeout;
  }
}

// 添加文本转换工具函数
function stringToUint8Array(str: string): Uint8Array {
  const arr = new Uint8Array(str.length);
  for (let i = 0; i < str.length; i++) {
    arr[i] = str.charCodeAt(i);
  }
  return arr;
}

function uint8ArrayToString(arr: Uint8Array): string {
  let str = '';
  for (let i = 0; i < arr.length; i++) {
    str += String.fromCharCode(arr[i]);
  }
  return str;
}

export class UDPServer {
  private udp: UDPSocket;
  private sessions: Map<string, KCPSession>;
  private updateTimer: number | null;
  private localPort: number;
  private currentTime: number;
  private messageCallback: (message: string) => void;

  constructor(onMessage: (message: string) => void) {
    this.sessions = new Map();
    this.updateTimer = null;
    this.currentTime = Date.now();
    this.messageCallback = onMessage;

    // 创建UDP服务器
    this.udp = Taro.createUDPSocket();

    // 绑定端口
    this.localPort = this.udp.bind(undefined as any);

    if (this.localPort === -1) {
      throw new Error('UDP server bind failed');
    }

    console.log(`UDP server bound to port ${this.localPort}`);

    // 监听消息
    this.udp.onMessage((res) => {
      const { message, remoteInfo } = res;
      const key = `${remoteInfo.address}:${remoteInfo.port}`;

      let session = this.sessions.get(key);
      if (!session) {
        // 新连接，创建会话
        session = new KCPSession(
          123,
          remoteInfo.address,
          remoteInfo.port,
          this.udp,
        );
        this.sessions.set(key, session);
        console.log(`New session from ${key}`);
      }

      try {
        // 更新最后接收时间
        session.lastReceiveTime = this.currentTime;

        // 输入据到KCP
        session.kcp.input(new Uint8Array(message));

        // 检查是否有数据需要接收
        const size = session.kcp.peeksize();
        if (size > 0) {
          const buffer = new Uint8Array(size);
          if (session.kcp.recv(buffer) > 0) {
            // 处理接收到的数据
            this.handleMessage(buffer, session);
          }
        }
      } catch (error) {
        console.error(`Error processing message from ${key}:`, error);
      }
    });

    // 监听错误
    this.udp.onError((err) => {
      console.error('UDP server error:', err);
    });

    // 启动更新循环
    this.startUpdate();
  }

  // 处理接收到的消息
  private handleMessage(data: Uint8Array, session: KCPSession): void {
    try {
      // 检查是否是初始化消息
      if (data.length === 1 && data[0] === 0) {
        console.log('Received init message, sending ack');
        // 发送确认消息
        const ackData = new Uint8Array([1]); // 确认消息
        session.kcp.send(ackData);
        return;
      }

      const message = uint8ArrayToString(data);
      console.log(`Received message: ${message}`);

      // 调用消息回调
      this.messageCallback(message);

      // 转发消息给其他所有客户端
      for (const [key, otherSession] of this.sessions.entries()) {
        if (otherSession !== session) {
          otherSession.kcp.send(data);
        }
      }
    } catch (error) {
      console.error('Error handling message:', error);
    }
  }

  // 启动更新循环
  private startUpdate(): void {
    const UPDATE_INTERVAL = 10; // 10ms
    const SESSION_TIMEOUT = 30000; // 30秒超时

    const update = () => {
      this.currentTime = Date.now();

      // 更新所有会话
      for (const [key, session] of this.sessions.entries()) {
        try {
          // 检查会话是否超时
          if (session.isTimeout(this.currentTime, SESSION_TIMEOUT)) {
            console.log(`Session ${key} timeout, removing`);
            this.sessions.delete(key);
            continue;
          }

          session.update(this.currentTime);
        } catch (error) {
          console.error(`Error updating session ${key}:`, error);
          this.sessions.delete(key);
        }
      }

      this.updateTimer = setTimeout(update, UPDATE_INTERVAL) as any;
    };

    update();
  }

  // 关闭服务器
  close(): void {
    if (this.updateTimer !== null) {
      clearTimeout(this.updateTimer);
      this.updateTimer = null;
    }

    try {
      this.udp.close();
    } catch (error) {
      console.error('Error closing UDP server:', error);
    }
  }

  // 获取本地端口
  getLocalPort(): number {
    return this.localPort;
  }

  // 获取当前会话数量
  getSessionCount(): number {
    return this.sessions.size;
  }

  // 获取当前时间
  getCurrentTime(): number {
    return this.currentTime;
  }

  // 添加广播方法
  broadcast(data: Uint8Array): void {
    // 向所有连接的客户端发送消息
    for (const [key, session] of this.sessions.entries()) {
      try {
        session.kcp.send(data);
      } catch (error) {
        console.error(`Error broadcasting to ${key}:`, error);
      }
    }
  }
}
