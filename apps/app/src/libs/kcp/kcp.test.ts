import { beforeEach, describe, expect, test } from '@jest/globals';

import { KCP } from './kcp';

describe('KCP Tests', () => {
  // 声明测试用的KCP实例和相关变量
  let kcp1: KCP; // 发送方KCP实例
  let kcp2: KCP; // 接收方KCP实例
  let currentTime: number = 0; // 模拟的当前时间
  const CONV = 123; // KCP会话ID

  // 模拟网络延迟和传输的队列
  // data: 数据包内容
  // timestamp: 预计到达时间
  // sender: 发送方标识('kcp1' 或 'kcp2')
  let networkQueue: Array<{
    data: Uint8Array;
    timestamp: number;
    sender: string;
  }> = [];

  // 每个测试用例开始前的初始化
  beforeEach(() => {
    // 重置时间和网络队列
    currentTime = 0;
    networkQueue = [];

    // 创建第一个KCP实例（发送方）
    kcp1 = new KCP(CONV, (data: Uint8Array) => {
      // 输出回调：将数据包放入网络队列，模拟发送到kcp2
      networkQueue.push({
        data: new Uint8Array(data), // 复制数据
        timestamp: currentTime + 60, // 添加60ms的网络延迟
        sender: 'kcp1', // 标记发送方
      });
    });

    // 创建第二个KCP实例（接收方）
    kcp2 = new KCP(CONV, (data: Uint8Array) => {
      // 输出回调：将数据包放入网络队列，模拟发送到kcp1
      networkQueue.push({
        data: new Uint8Array(data),
        timestamp: currentTime + 60,
        sender: 'kcp2',
      });
    });

    // 配置KCP参数
    // nodelay=1: 启用快速模式
    // interval=10: 内部更新间隔10ms
    // resend=2: 快速重传触发次数
    // nc=1: 关闭流控
    kcp1.setNoDelay(1, 10, 2, 1);
    kcp2.setNoDelay(1, 10, 2, 1);

    // 设置发送和接收窗口大小为128
    kcp1.setWndSize(128, 128);
    kcp2.setWndSize(128, 128);

    // 初始化KCP时间
    kcp1.update(currentTime);
    kcp2.update(currentTime);
  });

  // 模拟网络数据传输
  function networkTransfer() {
    const delivered: number[] = []; // 记录已处理的数据包索引

    // 遍历网络队列中的所有数据包
    for (let i = 0; i < networkQueue.length; i++) {
      const packet = networkQueue[i];
      // 检查数据包是否到达预定时间
      if (packet.timestamp <= currentTime) {
        const data = packet.data;
        // 从数据包中解析会话ID
        const conv =
          (data[0] | (data[1] << 8) | (data[2] << 16) | (data[3] << 24)) >>> 0;

        // 验证会话ID匹配
        if (conv === CONV) {
          // 根据发送方将数据包传递给对应的接收方
          if (packet.sender === 'kcp1') {
            kcp2.input(data);
          } else {
            kcp1.input(data);
          }
        }
        delivered.push(i);
      }
    }

    // 从后向前移除已处理的数据包
    for (let i = delivered.length - 1; i >= 0; i--) {
      networkQueue.splice(delivered[i], 1);
    }
  }

  // 测试基本的发送和接收功能
  test('Basic Send and Receive', async () => {
    const testData = new Uint8Array([1, 2, 3, 4, 5]);
    const receiveBuffer = new Uint8Array(5);

    // 发送测试数据
    expect(kcp1.send(testData)).toBe(0); // 0表示发送成功

    // 模拟网络传输2秒
    for (let i = 0; i < 2000; i += 10) {
      currentTime += 10; // 时间递增10ms
      kcp1.update(currentTime); // 更新发送方
      kcp2.update(currentTime); // 更新接收方
      networkTransfer(); // 处理网络传输

      // 尝试接收数据
      const receivedSize = kcp2.recv(receiveBuffer);
      if (receivedSize > 0) {
        // 验证接收到的数据大小和内容
        expect(receivedSize).toBe(5);
        expect(Array.from(receiveBuffer)).toEqual(Array.from(testData));
        return;
      }
    }

    fail('Failed to receive data within timeout');
  });

  // 测试大数据包的传输
  test('Large Data Transfer', async () => {
    // 创建10KB的测试数据
    const largeData = new Uint8Array(10000);
    for (let i = 0; i < largeData.length; i++) {
      largeData[i] = i % 256;
    }
    const receiveBuffer = new Uint8Array(10000);

    // 发送大数据包
    expect(kcp1.send(largeData)).toBe(0);

    // 模拟网络传输2秒
    for (let i = 0; i < 2000; i += 10) {
      currentTime += 10;
      kcp1.update(currentTime);
      kcp2.update(currentTime);
      networkTransfer();
    }

    // 验证接收到的数据
    const receivedSize = kcp2.recv(receiveBuffer);
    expect(receivedSize).toBe(10000);
    expect(Array.from(receiveBuffer)).toEqual(Array.from(largeData));
  });

  // 测试流模式
  test('Stream Mode', async () => {
    // 启用流模式
    kcp1.setStreamMode(true);
    kcp2.setStreamMode(true);

    // 准备两个数据包
    const data1 = new Uint8Array([1, 2, 3]);
    const data2 = new Uint8Array([4, 5, 6]);
    const receiveBuffer = new Uint8Array(6);

    // 连续发送两个数据包
    expect(kcp1.send(data1)).toBe(0);
    expect(kcp1.send(data2)).toBe(0);

    // 模拟网络传输
    for (let i = 0; i < 1000; i += 10) {
      currentTime += 10;
      kcp1.update(currentTime);
      kcp2.update(currentTime);
      networkTransfer();
    }

    // 验证接收到的数据是否正确合并
    const receivedSize = kcp2.recv(receiveBuffer);
    expect(receivedSize).toBe(6);
    expect(Array.from(receiveBuffer)).toEqual([1, 2, 3, 4, 5, 6]);
  });

  // 测试性能统计功能
  test('Performance Statistics', async () => {
    const testData = new Uint8Array([1, 2, 3, 4, 5]);
    const receiveBuffer = new Uint8Array(5);

    // 发送测试数据
    kcp1.send(testData);
    console.log('Data sent from kcp1');

    // 第一轮网络传输：kcp1 -> kcp2
    for (let i = 0; i < 1000; i += 10) {
      currentTime += 10;
      kcp1.update(currentTime);
      kcp2.update(currentTime);
      networkTransfer();

      // 当kcp2收到数据时，发送回复
      const receivedSize = kcp2.recv(receiveBuffer);
      if (receivedSize > 0) {
        console.log('Data received by kcp2, sending reply');
        kcp2.send(new Uint8Array([6, 7, 8]));
      }
    }

    // 第二轮网络传输：确保回复数据传输到kcp1
    for (let i = 0; i < 1000; i += 10) {
      currentTime += 10;
      kcp1.update(currentTime);
      kcp2.update(currentTime);
      networkTransfer();
    }

    // 获取并验证统计信息
    const stats1 = kcp1.getStats();
    const stats2 = kcp2.getStats();

    // 验证kcp1的统计数据
    expect(stats1.tx_total).toBeGreaterThan(0); // 发送字节数
    expect(stats1.rx_total).toBeGreaterThan(0); // 接收字节数

    // 验证kcp2的统计数据
    expect(stats2.tx_total).toBeGreaterThan(0); // 发送字节数
    expect(stats2.rx_total).toBeGreaterThan(0); // 接收字节数
  });

  // 测试窗口大小控制
  test('Window Size Control', () => {
    // 设置新的窗口大小
    kcp1.setWndSize(256, 256);
    // 验证设置是否生效
    expect(kcp1.getSndWnd()).toBe(256);
    expect(kcp1.getRcvWnd()).toBe(256);
  });

  // 测试调试信息输出
  test('Debug Information', () => {
    const debugInfo = kcp1.getDebugInfo();
    // 验证调试信息中包含关键字段
    expect(debugInfo).toContain('snd_una'); // 发送未确认序号
    expect(debugInfo).toContain('rcv_nxt'); // 下一个接收序号
    expect(debugInfo).toContain('cwnd'); // 拥塞窗口大小
  });
});

// 辅助函数：用于测试失败时抛出错误
function fail(message: string) {
  throw new Error(message);
}
