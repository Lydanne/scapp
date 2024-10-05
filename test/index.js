// 导入 dgram 模块
const dgram = require('dgram');

// 创建 UDP 客户端
const client = dgram.createSocket('udp4');

// 定义要发送的信息
const message = Buffer.from('Hello, UDP Server!');

// 目标 IP 和端口
const targetHost = '192.168.10.7'; // 替换为实际的目标 IP
const targetPort = 40154;          // 替换为实际的目标端口

// 发送消息
client.send(message, targetPort, targetHost, (err) => {
  if (err) {
    console.log('Error sending message:', err);
  } else {
    console.log(`Message sent to ${targetHost}:${targetPort}`);
  }

  // 关闭客户端
  client.close();
});
