use std::time::{Duration, Instant};
use tauri::ipc;
use tokio::net::{TcpListener, TcpStream};
use tokio::io::{AsyncReadExt, AsyncWriteExt};
use serde::{Serialize, Deserialize};
use tokio::time::{sleep, timeout};

const BUFFER_SIZE: usize = 64 * 1024; // 64KB buffer
const TEST_DURATION: Duration = Duration::from_secs(5);

static mut SPEED_TEST_STOP: bool = false;
static mut SPEED_TEST_LISTEN_STOP: bool = false;

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SpeedTestResult {
    pub download_speed: f64,
    pub upload_speed: f64,
    pub latency: u64,
}

// 定义测试阶段
#[derive(Debug)]
enum TestPhase {
    Latency,
    Upload,
    Download,
    Complete,
}

pub async fn start_speed_test(target: String) -> Result<SpeedTestResult, Box<dyn std::error::Error>> {
    let mut stream = TcpStream::connect(&target).await?;
    // stream.set_nodelay(true)?;

    // 测试延迟
    let start = Instant::now();
    stream.write_all(b"PING").await?;
    let mut ping_response = [0u8; 4];
    stream.read_exact(&mut ping_response).await?;
    let latency = start.elapsed().as_millis() as u64;

    // 开始上传测试
    println!("客户端: 发送上传测试");
    stream.write_all(b"UPLD").await?;
    stream.flush().await?;
    
    // 等待服务端准备就绪确认
    let mut ready_response = [0u8; 4];
    stream.read_exact(&mut ready_response).await?;
    if &ready_response != b"REDY" {
        return Err("服务端未准备就绪".into());
    }
    
    let test_data = vec![1u8; BUFFER_SIZE];
    let mut total_bytes = 0;
    let start = Instant::now();
    
    // 上传测试
    while start.elapsed() < TEST_DURATION {
        match stream.write_all(&test_data).await {
            Ok(_) => total_bytes += BUFFER_SIZE,
            Err(_) => break,
        }
        if unsafe { SPEED_TEST_STOP } {
          break;
        }
        stream.flush().await?;
    }
    stream.flush().await?;
    let upload_speed = (total_bytes as f64 / 1024.0 / 1024.0) / start.elapsed().as_secs_f64();
    println!("上传测试结束, 上传速度: {} MB/s", upload_speed);

    // 发送上传结束标记
    stream.write_all(b"ENDU").await?;
    stream.flush().await?;

    sleep(Duration::from_secs(5)).await;

    // 开始下载测试
    println!("客户端: 等待服务器下载测试准备就绪");
    stream.write_all(b"DOWN").await?;
    stream.flush().await?;
    println!("客户端: 发送下载命令完成");
    
    let mut buffer = vec![0u8; BUFFER_SIZE];
    let mut total_bytes = 0;
    let start = Instant::now();
    
    // 等待服务器确认，添加超时处理
    println!("客户端: 等待服务器确认");
    let mut ready_response = [0u8; 4];

    match timeout(Duration::from_secs(5), stream.read_exact(&mut ready_response)).await {
        Ok(Ok(_)) => {
            println!("客户端: 收到服务器响应: {:?}", String::from_utf8_lossy(&ready_response));
            if &ready_response != b"REDY" {
                return Err("服务端未准备就绪".into());
            }
        },
        Ok(Err(e)) => {
            println!("客户端: 读取服务器确认时出错: {}", e);
            return Err(e.into());
        },
        Err(_) => {
            println!("客户端: 读取服务器确认超时");
            return Err("服务器响应超时".into());
        }
    }

    println!("客户端: 开始接收数据");
    
    while start.elapsed() < TEST_DURATION {
        match stream.read(&mut buffer).await {
            Ok(n) if n == 0 => break,
            Ok(n) => total_bytes += n,
            Err(_) => break,
        }
        if unsafe { SPEED_TEST_STOP } {
            break;
        }
    }

    // 发送停止下载的信号
    stream.write_all(b"STPD").await?;
    stream.flush().await?;
    let download_speed = (total_bytes as f64 / 1024.0 / 1024.0) / start.elapsed().as_secs_f64();
    println!("下载测试结束, 下载速度: {} MB/s", download_speed);

    // 发送测试完成命令
    stream.write_all(b"DONE").await?;
    stream.flush().await?;
    
    unsafe { SPEED_TEST_STOP = false; }
    
    Ok(SpeedTestResult {
        download_speed,
        upload_speed,
        latency,
    })
}

async fn handle_connection(mut stream: TcpStream) -> Result<(), Box<dyn std::error::Error>> {
    let mut phase = TestPhase::Latency;
    let mut buffer = vec![0u8; BUFFER_SIZE];
    let mut command = [0u8; 4];

    loop {
        stream.read_exact(&mut command).await?;
        println!("服务器: 收到命令: {:?}, 阶段: {:?}", String::from_utf8_lossy(&command), phase);
        match phase {
            TestPhase::Latency => {
                if &command == b"PING" {
                    stream.write_all(b"PONG").await?;
                    stream.flush().await?;
                    println!("服务器: 发送PONG");
                    phase = TestPhase::Upload;
                }
            },
            TestPhase::Upload => {
                if &command == b"UPLD" {
                    println!("服务器: 收到上传命令");
                    stream.write_all(b"REDY").await?;
                    stream.flush().await?;
                    println!("服务器: 发送REDY");
                    
                    // 接收上传数据直到收到结束标记
                    let mut temp_buffer = vec![0u8; 4];
                    while let Ok(n) = stream.read(&mut buffer).await {
                        // println!("服务器: 收到 {} 字节的数据", n);
                        if n >= 4 {
                            temp_buffer.copy_from_slice(&buffer[n-4..n]);
                            // println!("服务器: 收到数据: {:?}", String::from_utf8_lossy(&temp_buffer));
                            if &temp_buffer == b"ENDU" {
                                println!("服务器: 收到上传结束标记，准备进入下载阶段");
                                phase = TestPhase::Download;
                                break;
                            }
                        }else{
                          break;
                        }
                    }

                    println!("服务器: 上传测试完成");
                }
            },
            TestPhase::Download => {
                if &command == b"DOWN" {
                    println!("服务器: 收到下载请求，立即发送REDY");
                    // 立即响应并确保发送
                    stream.write_all(b"REDY").await?;
                    stream.flush().await?;
                    println!("服务器: REDY信号已发送");
                    
                        let test_data = vec![1u8; BUFFER_SIZE];
                        let start = Instant::now();
                        
                        println!("服务器: 开始发送数据");
                        loop {
                            // 检查是否收到停止信号
                            if let Ok(n) = stream.try_read(&mut command) {
                                println!("服务器: 读取到 {} 字节的命令", n);
                                if n >= 4 && &command[..4] == b"STPD" {
                                    println!("服务器: 收到停止命令");
                                    break;
                                }
                            }
                            
                            match stream.write_all(&test_data).await {
                                Ok(_) => {},
                                Err(e) => {
                                    println!("服务器: 发送数据错误: {}", e);
                                    break;
                                }
                            }
                            stream.flush().await?;
                            if unsafe { SPEED_TEST_LISTEN_STOP } {
                                println!("服务器: SPEED_TEST_LISTEN_STOP 被触发");
                                break;
                            }
                            if start.elapsed() >= TEST_DURATION {
                                println!("服务器: 达到测试时间限制");
                                break;
                            }
                        }
                        println!("服务器: 载测试完成");
                        phase = TestPhase::Complete;
                    }
                
            },
            TestPhase::Complete => {
                if &command == b"DONE" {
                    println!("服务器: 测试完成");
                    phase = TestPhase::Latency;
                    break;
                }
            }
        }
    }

    Ok(())
}

pub async fn stop_speed_test() -> Result<(), Box<dyn std::error::Error>> {
    println!("stop_speed_test");
    unsafe {
        SPEED_TEST_STOP = true;
    }
    Ok(())
}

pub async fn listen_speed_test(on_cb: ipc::Channel<String>) -> Result<(), Box<dyn std::error::Error>> {
    let listener = TcpListener::bind("0.0.0.0:0").await?;
    println!("监听端口 {:?}...", listener.local_addr().unwrap());

    let local_addr = format!("{}:{}", super::super::net::net_local_ip(), listener.local_addr().unwrap().port());
    on_cb.send(local_addr)?;

    loop {
        match listener.accept().await {
            Ok((stream, addr)) => {
                println!("接受到连接: {}", addr);
                
                // 为每个连接创建一个新的任务
                tokio::spawn(async move {
                    if let Err(e) = handle_connection(stream).await {
                        println!("处理连接错误: {}", e);
                    }
                });
            }
            Err(e) => {
                println!("接受连接错误: {}", e);
            }
        }

        if unsafe { SPEED_TEST_LISTEN_STOP } {
            unsafe { SPEED_TEST_LISTEN_STOP = false; }
            return Ok(());
        }
    }
}

pub async fn stop_listen_speed_test(addr: String) -> Result<(), Box<dyn std::error::Error>> {
    println!("stop_listen_speed_test");
    unsafe {
        SPEED_TEST_LISTEN_STOP = true;
    }
    // 发送一个请求到本地以触发停止

    println!("发送停止请求到: {}", addr);
    if let Ok(mut stream) = TcpStream::connect(addr).await {
      let _ = stream.write(&[0u8; 8]).await;
    }
    println!("发送停止请求到结束");
    Ok(())
}