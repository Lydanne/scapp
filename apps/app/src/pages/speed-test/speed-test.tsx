import React, { useState } from 'react';

import { Close } from '@nutui/icons-react-taro';
import { Button, Input, Progress } from '@nutui/nutui-react-taro';
import { Channel, invoke } from '@tauri-apps/api/core';

export default function SpeedTest() {
  const [targetAddress, setTargetAddress] = useState('');
  const [serverAddress, setServerAddress] = useState('');
  const [testing, setTesting] = useState(false);
  const [listening, setListening] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<{
    downloadSpeed: number;
    uploadSpeed: number;
    latency: number;
  } | null>(null);
  const [realtimeStats, setRealtimeStats] = useState<{
    currentDownloadSpeed: number;
    currentUploadSpeed: number;
    currentLatency: number;
  } | null>(null);
  const [historyStats, setHistoryStats] = useState<
    Array<{
      downloadSpeed: number;
      uploadSpeed: number;
      latency: number;
      timestamp: number;
    }>
  >([]);

  const startTest = async () => {
    try {
      setTesting(true);
      setProgress(0);
      setResult(null);
      setRealtimeStats(null);

      // 清空历史记录
      setHistoryStats([]);

      const startTime = Date.now();

      let onStats = new Channel<{
        downloadSpeed: number;
        uploadSpeed: number;
        latency: number;
      }>();

      onStats.onmessage = (stats) => {
        setRealtimeStats({
          currentDownloadSpeed: stats.downloadSpeed,
          currentUploadSpeed: stats.uploadSpeed,
          currentLatency: stats.latency,
        });
        // 添加到历史记录
        setHistoryStats((prev) => [
          ...prev,
          {
            ...stats,
            timestamp: Date.now() - startTime,
          },
        ]);
        setProgress((prev) => Math.min(prev + 2, 95));
      };

      const testResult = await invoke('start_speed_test', {
        target: targetAddress,
        onStats,
      });

      console.log('testResult', testResult);
      setProgress(100);
      setResult(testResult as any);
    } catch (error) {
      console.error('Speed test failed:', error);
    } finally {
      setTesting(false);
      setRealtimeStats(null);
    }
  };
  const stopTest = async () => {
    invoke('stop_speed_test');
  };

  const listenServer = async () => {
    if (listening) {
      return;
    }
    setListening(true);
    let onCb = new Channel<string>();
    onCb.onmessage = (event) => {
      setServerAddress(event);
      setTargetAddress(event);
    };
    invoke('listen_speed_test', {
      onCb,
    }).then(() => {
      setListening(false);
      setServerAddress('');
      setTargetAddress('');
      console.log('listen_speed_test stop');
    });
  };

  const stopListen = async () => {
    invoke('stop_listen_speed_test', {
      addr: serverAddress,
    });
  };

  const formatSpeed = (speed: number) => {
    return Number(speed).toFixed(2);
  };

  return (
    <div style={{ padding: '16px' }}>
      <div style={{ maxWidth: '400px', margin: '0 auto', paddingTop: '20px' }}>
        <h2
          style={{
            fontSize: '24px',
            fontWeight: 'bold',
            textAlign: 'center',
            marginBottom: '20px',
          }}
        >
          网络测速
        </h2>

        <div
          style={{
            backgroundColor: '#fff',
            borderRadius: '16px',
            padding: '20px',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          }}
        >
          <Input
            style={{ marginBottom: '20px' }}
            placeholder="输入目标地址 (如: 192.168.1.100:8000)"
            value={targetAddress}
            onChange={(val) => setTargetAddress(val)}
          />

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr auto',
              marginBottom: '10px',
            }}
          >
            <Button
              type="primary"
              loading={testing}
              disabled={!targetAddress}
              onClick={startTest}
              style={{ height: '44px' }}
            >
              {testing ? '测速中...' : '开始测速'}
            </Button>

            {testing && (
              <Button
                type="primary"
                fill="outline"
                onClick={stopTest}
                style={{
                  height: '44px',
                  width: '44px',
                  lineHeight: '44px',
                  padding: '0',
                  marginLeft: '5px',
                }}
                icon={<Close size={16}></Close>}
              ></Button>
            )}
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr auto',
              marginBottom: '10px',
            }}
          >
            <Button
              block
              type="info"
              disabled={listening}
              onClick={listenServer}
              style={{ height: '44px', marginBottom: '20px' }}
            >
              {listening ? `监听中（${serverAddress}）` : '监听服务'}
            </Button>

            {listening && (
              <Button
                type="info"
                fill="outline"
                onClick={stopListen}
                style={{
                  height: '44px',
                  width: '44px',
                  lineHeight: '44px',
                  padding: '0',
                  marginLeft: '5px',
                }}
                icon={<Close size={16}></Close>}
              ></Button>
            )}
          </div>

          {testing && (
            <div style={{ marginBottom: '20px' }}>
              <Progress percent={progress} />
              <div
                style={{
                  textAlign: 'center',
                  fontSize: '14px',
                  color: '#666',
                  marginTop: '8px',
                }}
              >
                正在测速中...
              </div>
            </div>
          )}

          {testing && realtimeStats && (
            <div
              style={{
                marginBottom: '20px',
                backgroundColor: '#F7FAFC',
                padding: '16px',
                borderRadius: '12px',
              }}
            >
              <div
                style={{
                  fontSize: '16px',
                  marginBottom: '12px',
                  color: '#4A5568',
                }}
              >
                实时数据
              </div>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr 1fr',
                  gap: '12px',
                }}
              >
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '14px', color: '#718096' }}>
                    当前延迟
                  </div>
                  <div style={{ fontSize: '18px', color: '#2B6CB0' }}>
                    {realtimeStats.currentLatency}
                    <span style={{ fontSize: '12px' }}> ms</span>
                  </div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '14px', color: '#718096' }}>
                    当前下载
                  </div>
                  <div style={{ fontSize: '18px', color: '#2F855A' }}>
                    {formatSpeed(realtimeStats.currentDownloadSpeed)}
                    <span style={{ fontSize: '12px' }}> MB/s</span>
                  </div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '14px', color: '#718096' }}>
                    当前上传
                  </div>
                  <div style={{ fontSize: '18px', color: '#C05621' }}>
                    {formatSpeed(realtimeStats.currentUploadSpeed)}
                    <span style={{ fontSize: '12px' }}> MB/s</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {result && (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr 1fr',
                gap: '12px',
              }}
            >
              <div
                style={{
                  textAlign: 'center',
                  padding: '12px',
                  backgroundColor: '#EBF8FF',
                  borderRadius: '12px',
                }}
              >
                <div
                  style={{
                    fontSize: '14px',
                    color: '#666',
                    marginBottom: '4px',
                  }}
                >
                  延迟
                </div>
                <div
                  style={{
                    fontSize: '20px',
                    fontWeight: 'bold',
                    color: '#2B6CB0',
                  }}
                >
                  {result.latency}
                  <span
                    style={{
                      fontSize: '12px',
                      fontWeight: 'normal',
                      marginLeft: '2px',
                    }}
                  >
                    ms
                  </span>
                </div>
              </div>

              <div
                style={{
                  textAlign: 'center',
                  padding: '12px',
                  backgroundColor: '#F0FFF4',
                  borderRadius: '12px',
                }}
              >
                <div
                  style={{
                    fontSize: '14px',
                    color: '#666',
                    marginBottom: '4px',
                  }}
                >
                  下载
                </div>
                <div
                  style={{
                    fontSize: '20px',
                    fontWeight: 'bold',
                    color: '#2F855A',
                  }}
                >
                  {formatSpeed(result.downloadSpeed)}
                  <span
                    style={{
                      fontSize: '12px',
                      fontWeight: 'normal',
                      marginLeft: '2px',
                    }}
                  >
                    MB
                  </span>
                </div>
              </div>

              <div
                style={{
                  textAlign: 'center',
                  padding: '12px',
                  backgroundColor: '#FFFAF0',
                  borderRadius: '12px',
                }}
              >
                <div
                  style={{
                    fontSize: '14px',
                    color: '#666',
                    marginBottom: '4px',
                  }}
                >
                  上传
                </div>
                <div
                  style={{
                    fontSize: '20px',
                    fontWeight: 'bold',
                    color: '#C05621',
                  }}
                >
                  {formatSpeed(result.uploadSpeed)}
                  <span
                    style={{
                      fontSize: '12px',
                      fontWeight: 'normal',
                      marginLeft: '2px',
                    }}
                  >
                    MB
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {historyStats.length > 0 && (
        <div
          style={{
            marginTop: '20px',
            backgroundColor: '#fff',
            borderRadius: '16px',
            padding: '16px',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          }}
        >
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <th
                    style={{
                      padding: '6px',
                      textAlign: 'left',
                      fontSize: '12px',
                    }}
                  >
                    时间 (秒)
                  </th>
                  <th
                    style={{
                      padding: '6px',
                      textAlign: 'right',
                      fontSize: '12px',
                    }}
                  >
                    下载 (MB/s)
                  </th>
                  <th
                    style={{
                      padding: '6px',
                      textAlign: 'right',
                      fontSize: '12px',
                    }}
                  >
                    上传 (MB/s)
                  </th>
                  <th
                    style={{
                      padding: '6px',
                      textAlign: 'right',
                      fontSize: '12px',
                    }}
                  >
                    延迟 (ms)
                  </th>
                </tr>
              </thead>
              <tbody>
                {historyStats.map((stat, index) => (
                  <tr
                    key={index}
                    style={{
                      borderBottom: '1px solid #e2e8f0',
                      backgroundColor: index % 2 === 0 ? '#f8fafc' : 'white',
                    }}
                  >
                    <td
                      style={{
                        padding: '6px',
                        textAlign: 'left',
                        fontSize: '12px',
                      }}
                    >
                      {(stat.timestamp / 1000).toFixed(0)}
                    </td>
                    <td
                      style={{
                        padding: '6px',
                        textAlign: 'right',
                        color: '#2F855A',
                        fontSize: '12px',
                      }}
                    >
                      {formatSpeed(stat.downloadSpeed)}
                    </td>
                    <td
                      style={{
                        padding: '6px',
                        textAlign: 'right',
                        color: '#C05621',
                        fontSize: '12px',
                      }}
                    >
                      {formatSpeed(stat.uploadSpeed)}
                    </td>
                    <td
                      style={{
                        padding: '6px',
                        textAlign: 'right',
                        color: '#2B6CB0',
                        fontSize: '12px',
                      }}
                    >
                      {stat.latency}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
