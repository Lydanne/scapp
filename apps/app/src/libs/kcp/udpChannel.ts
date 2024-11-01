import type { UDPSocket } from '@tarojs/taro';
import Taro from '@tarojs/taro';

import { KCP } from './kcp';

export class UDPChannel {
  private kcp: KCP;
  private udp: UDPSocket;
  private serverAddress: string;
  private serverPort: number;
  private currentTime: number;
  private updateTimer: number | null = null;
  private localPort: number;
  private initialized: boolean = false;
  private messageQueue: Uint8Array[] = []; // 用于存储未发送的消息

  constructor(conv: number, serverAddress: string, serverPort: number) {
    this.serverAddress = serverAddress;
    this.serverPort = serverPort;
    this.currentTime = Date.now();

    // 创建 UDP Socket
    this.udp = Taro.createUDPSocket();

    // 绑定本地端口
    this.localPort = this.udp.bind(undefined as any);

    if (this.localPort === -1) {
      throw new Error('UDP bind failed');
    }

    console.log(`UDP bound to local port: ${this.localPort}`);

    // 创建 KCP 实例
    this.kcp = new KCP(conv, (data: Uint8Array, sender: string) => {
      // KCP 的输出回调，通过 UDP 发送数据
      this.udp.send({
        address: this.serverAddress,
        port: this.serverPort,
        message: data.buffer as ArrayBuffer,
      });
    });

    // 配置 KCP 参数
    this.kcp.setNoDelay(1, 10, 2, 1); // 快速模式
    this.kcp.setWndSize(128, 128); // 设置窗口大小

    // 监听 UDP 消息
    this.udp.onMessage((res) => {
      // 收到 UDP 数据包后输入到 KCP
      const data = new Uint8Array(res.message);
      this.kcp.input(data);
    });

    // 监听错误
    this.udp.onError((err) => {
      console.error('UDP error:', err);
    });

    // 启动 KCP 更新定时器
    this.startUpdate();

    // 创建 KCP 实例后，发送一个初始化消息
    setTimeout(() => {
      // 发送一个空消息来建立会话
      const initData = new Uint8Array([0]); // 一个字节的初始化消息
      this.send(initData);
      console.log('Sent init message');
    }, 100); // 延迟100ms发送，确保UDP socket已经准备好
  }

  // 发送数据
  send(data: Uint8Array): number {
    // 如果还未初始化且不是初始化消息，则将消息加入队列
    if (!this.initialized && !(data.length === 1 && data[0] === 0)) {
      this.messageQueue.push(data);
      return 0;
    }
    return this.kcp.send(data);
  }

  // 接收数据
  recv(): Uint8Array | null {
    const data = this.receiveData();
    if (!data) return null;

    // 检查是否是确认消息
    if (data.length === 1 && data[0] === 1) {
      console.log('Received ack message, connection established');
      this.initialized = true;
      // 发送所有排队的消息
      while (this.messageQueue.length > 0) {
        const msg = this.messageQueue.shift();
        if (msg) this.send(msg);
      }
      return null;
    }

    return data;
  }

  // 启动 KCP 更新
  private startUpdate() {
    const UPDATE_INTERVAL = 10; // 10ms 更新一次

    const update = () => {
      this.currentTime = Date.now();
      this.kcp.update(this.currentTime);

      this.updateTimer = setTimeout(update, UPDATE_INTERVAL) as any;
    };

    update();
  }

  // 停止更新并关闭连接
  close() {
    if (this.updateTimer !== null) {
      clearTimeout(this.updateTimer);
      this.updateTimer = null;
    }
    try {
      this.udp.close();
    } catch (err) {
      console.error('Error closing UDP socket:', err);
    }
  }

  // 获取连接状态
  getState(): number {
    return this.kcp.getState();
  }

  // 获取统计信息
  getStats() {
    return this.kcp.getStats();
  }

  // 获取等待发送的数据大小
  waitSnd(): number {
    return this.kcp.waitSnd();
  }

  // 获取本地端口
  getLocalPort(): number {
    return this.localPort;
  }

  // 获取当前时间
  getCurrentTime(): number {
    return this.currentTime;
  }

  // 添加接收数据的内部方法
  private receiveData(): Uint8Array | null {
    const size = this.kcp.peeksize();
    if (size < 0) return null;

    const buffer = new Uint8Array(size);
    const recvSize = this.kcp.recv(buffer);
    if (recvSize < 0) return null;

    return buffer;
  }
}
