import dgram from 'dgram';

import { KCP } from '../libs/kcp/kcp';

class KCPSession {
  kcp: KCP;
  address: string;
  port: number;

  constructor(
    conv: number,
    address: string,
    port: number,
    socket: dgram.Socket,
  ) {
    this.address = address;
    this.port = port;

    this.kcp = new KCP(conv, (data: Uint8Array, sender: string) => {
      socket.send(data, this.port, this.address, (error) => {
        if (error) {
          console.error('UDP send error:', error);
        }
      });
    });

    this.kcp.setNoDelay(1, 10, 2, 1);
    this.kcp.setWndSize(128, 128);
  }

  update(current: number) {
    this.kcp.update(current);
  }
}

// 创建 UDP 服务器
const server = dgram.createSocket('udp4');
const sessions = new Map<string, KCPSession>();

server.on('message', (msg, rinfo) => {
  const key = `${rinfo.address}:${rinfo.port}`;
  let session = sessions.get(key);

  if (!session) {
    // 新连接，创建会话
    session = new KCPSession(123, rinfo.address, rinfo.port, server);
    sessions.set(key, session);
    console.log(`New session from ${key}`);
  }

  try {
    // 输入数据到 KCP
    session.kcp.input(new Uint8Array(msg));

    // 检查是否有数据需要接收
    const size = session.kcp.peeksize();
    if (size > 0) {
      const buffer = new Uint8Array(size);
      if (session.kcp.recv(buffer) > 0) {
        // 处理接收到的数据
        const message = new TextDecoder().decode(buffer);
        console.log(`Received from ${key}: ${message}`);

        // 发送回复
        const reply = new TextEncoder().encode(`Server received: ${message}`);
        session.kcp.send(reply);
      }
    }
  } catch (error) {
    console.error(`Error processing message from ${key}:`, error);
  }
});

// 定期更新所有会话
const updateInterval = setInterval(() => {
  const current = Date.now();
  for (const [key, session] of sessions.entries()) {
    try {
      session.update(current);
    } catch (error) {
      console.error(`Error updating session ${key}:`, error);
      sessions.delete(key);
    }
  }
}, 10);

// 错误处理
server.on('error', (error) => {
  console.error('UDP server error:', error);
});

// 清理资源
process.on('SIGINT', () => {
  clearInterval(updateInterval);
  server.close();
  process.exit();
});

// 启动服务器
const PORT = 12345;
server.bind(PORT, () => {
  console.log(`UDP server listening on port ${PORT}`);
});
