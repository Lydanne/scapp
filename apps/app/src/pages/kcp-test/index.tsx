import { useEffect, useRef, useState } from 'react';

import { Button, Input, Text, View } from '@tarojs/components';
import Taro from '@tarojs/taro';

import { UDPChannel } from '../../libs/kcp/udpChannel';
import { UDPServer } from '../../libs/kcp/udpServer';

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

export default function KcpTest() {
  const [messages, setMessages] = useState<string[]>([]);
  const [server, setServer] = useState<UDPServer | null>(null);
  const [client, setClient] = useState<UDPChannel | null>(null);
  const [serverPort, setServerPort] = useState<number>(0);
  const [clientPort, setClientPort] = useState<number>(0);
  const [mode, setMode] = useState<'none' | 'server' | 'client'>('none');
  const [targetIp, setTargetIp] = useState('');
  const [targetPort, setTargetPort] = useState('');
  const [inputMessage, setInputMessage] = useState('');

  // 使用 ref 来保存 addMessage 函数，这样可以在 UDPServer 中使用
  const addMessageRef = useRef<(msg: string) => void>();

  // 添加消息到列表
  const addMessage = (msg: string) => {
    setMessages((prev) => [
      ...prev,
      `[${new Date().toLocaleTimeString()}] ${msg}`,
    ]);
  };

  // 保存 addMessage 到 ref
  useEffect(() => {
    addMessageRef.current = addMessage;
  }, []);

  // 启动服务器
  const startServer = () => {
    try {
      const newServer = new UDPServer((message: string) => {
        // 服务器收到消息的回调
        addMessageRef.current?.(`收到消息: ${message}`);
      });
      setServer(newServer);
      setServerPort(newServer.getLocalPort());
      setMode('server');
      addMessage('服务器启动成功，端口：' + newServer.getLocalPort());
    } catch (error) {
      addMessage('服务器启动失败：' + error.message);
    }
  };

  // 启动客户端
  const startClient = () => {
    if (!targetIp || !targetPort) {
      Taro.showToast({
        title: '请输入目标IP和端口',
        icon: 'none',
      });
      return;
    }

    try {
      const newClient = new UDPChannel(123, targetIp, parseInt(targetPort));
      setClient(newClient);
      setClientPort(newClient.getLocalPort());
      setMode('client');
      addMessage('客户端启动成功，端口：' + newClient.getLocalPort());
    } catch (error) {
      addMessage('客户端启动失败：' + error.message);
    }
  };

  // 发送消息
  const sendMessage = () => {
    if (!inputMessage) {
      return;
    }

    try {
      const data = stringToUint8Array(inputMessage);
      if (mode === 'client' && client) {
        client.send(data);
        addMessage('我: ' + inputMessage);
      } else if (mode === 'server' && server) {
        server.broadcast(data);
        addMessage('我: ' + inputMessage);
      }
      setInputMessage('');
    } catch (error) {
      addMessage('发送失败：' + error.message);
    }
  };

  // 定期检查接收到的消息
  useEffect(() => {
    if (!client && !server) return;

    const checkInterval = setInterval(() => {
      if (mode === 'client' && client) {
        const data = client.recv();
        if (data) {
          const message = uint8ArrayToString(data);
          addMessage('对方: ' + message);
        }
      }
    }, 100);

    return () => clearInterval(checkInterval);
  }, [client, server, mode]);

  // 组件卸载时清理资源
  useEffect(() => {
    return () => {
      if (server) {
        server.close();
      }
      if (client) {
        client.close();
      }
    };
  }, [server, client]);

  return (
    <View className="kcp-test">
      {mode === 'none' && (
        <View className="mode-select">
          <Button onClick={startServer}>作为服务器启动</Button>
          <View className="client-inputs">
            <Input
              type="text"
              placeholder="目标IP地址"
              value={targetIp}
              onInput={(e) => setTargetIp(e.detail.value)}
            />
            <Input
              type="number"
              placeholder="目标端口"
              value={targetPort}
              onInput={(e) => setTargetPort(e.detail.value)}
            />
            <Button onClick={startClient}>作为客户端连接</Button>
          </View>
        </View>
      )}

      {mode !== 'none' && (
        <View className="chat-area">
          <Text>当前模式: {mode === 'server' ? '服务器' : '客户端'}</Text>
          <Text>本地端口: {mode === 'server' ? serverPort : clientPort}</Text>

          <View className="message-list">
            {messages.map((msg, index) => (
              <View key={index} className="message-item">
                {msg}
              </View>
            ))}
          </View>

          <View className="input-area">
            <Input
              type="text"
              value={inputMessage}
              onInput={(e) => setInputMessage(e.detail.value)}
              placeholder="输入消息"
              className="message-input"
            />
            <Button onClick={sendMessage}>发送</Button>
          </View>
        </View>
      )}
    </View>
  );
}
