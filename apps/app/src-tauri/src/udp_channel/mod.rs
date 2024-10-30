use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::net::{SocketAddr, UdpSocket};
use std::str::FromStr;
use std::sync::{Arc, Mutex};
use tauri::Emitter;

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct DataAction {
    pub id: u32,
    pub index: u32,
    pub body: Vec<u8>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct SyncAction {
    pub id: u32,
    pub signal: SyncSignal,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(tag = "oneofKind")]
pub enum SyncSignal {
    #[serde(rename = "synReady")]
    SynReady(SynReadySignal),
    #[serde(rename = "ackReady")]
    AckReady(AckReadySignal),
    #[serde(rename = "ackChunkFinish")]
    AckChunkFinish(AckChunkFinish),
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct SynReadySignal {
    pub length: u32,
    pub size: u32,
    pub sign: String,
    pub name: String,
    pub type_: u32,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct AckReadySignal {
    pub length: u32,
    pub size: u32,
    pub sign: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct AckChunkFinish {
    pub index: u32,
    pub status: u32,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct DetectAction {
    pub seq: u32,
    pub ack: u32,
    pub rtt: u32,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SendData {
    id: u32,
    #[serde(rename = "type")]
    type_: String,
    head: serde_json::Value,
    body: String,
    message: Vec<u8>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Connection {
    id: u32,
    status: u32,
    socket_ip: String,
    seq: u32,
}

pub struct UdpChannel {
    socket: Arc<UdpSocket>,
    port: u16,
    connections: Arc<Mutex<HashMap<u32, Connection>>>,
}

#[derive(Debug, Serialize, Deserialize)]
pub enum MessageType {
    Data(DataAction),
    Sync(SyncAction),
    Detect(DetectAction),
}

impl UdpChannel {
    pub fn new() -> Result<Self, std::io::Error> {
        let socket = UdpSocket::bind("0.0.0.0:0")?;
        let port = socket.local_addr()?.port();

        Ok(Self {
            socket: Arc::new(socket),
            port,
            connections: Arc::new(Mutex::new(HashMap::new())),
        })
    }

    pub async fn listen(app: tauri::AppHandle) -> Result<u16, String> {
        let channel = Self::new().map_err(|e| e.to_string())?;
        let socket = channel.socket.clone();

        // 启动接收循环
        tokio::spawn(async move {
            let mut buf = [0u8; 65535];
            loop {
                match socket.recv_from(&mut buf) {
                    Ok((size, addr)) => {
                        let data = buf[..size].to_vec();

                        // 解析消息并处理
                        if let Ok(message) = serde_json::from_slice(&data) {
                            let event_payload = EventPayload {
                                message,
                                remote_info: addr.to_string(),
                            };

                            // 使用 emit 替代 emit_all
                            let _ = app.emit("udp://message", event_payload);
                        }
                    }
                    Err(e) => {
                        eprintln!("Error receiving UDP packet: {}", e);
                    }
                }
            }
        });

        Ok(channel.port)
    }

    pub async fn send(connection_id: u32, data: SendData) -> Result<(), String> {
        let connection = {
            let connections = GLOBAL_CHANNEL.connections.lock().unwrap();
            connections.get(&connection_id).cloned()
        }
        .ok_or_else(|| "Connection not found".to_string())?;

        // 解析目标地址
        let addr = SocketAddr::from_str(&connection.socket_ip)
            .map_err(|e| format!("Invalid socket address: {}", e))?;

        // 发送数据
        GLOBAL_CHANNEL
            .socket
            .send_to(&data.message, addr)
            .map_err(|e| e.to_string())?;

        Ok(())
    }

    pub async fn connect(app: tauri::AppHandle, socket_ip: String) -> Result<(), String> {
        let connection = Connection {
            id: rand::random(),
            status: 1, // connecting
            socket_ip: socket_ip.clone(),
            seq: rand::random(),
        };

        // 存储连接
        {
            let mut connections = GLOBAL_CHANNEL.connections.lock().unwrap();
            connections.insert(connection.id, connection.clone());
        }

        // 发送连接请求
        let connect_message = serde_json::json!({
            "type": "connect",
            "id": connection.id,
            "seq": connection.seq,
        });

        let addr = SocketAddr::from_str(&socket_ip)
            .map_err(|e| format!("Invalid socket address: {}", e))?;

        GLOBAL_CHANNEL
            .socket
            .send_to(&serde_json::to_vec(&connect_message).unwrap(), addr)
            .map_err(|e| e.to_string())?;

        // 通知前端新连接
        app.emit("udp://connection", connection)
            .map_err(|e| e.to_string())?;

        Ok(())
    }

    pub async fn disconnect(connection_id: u32) -> Result<bool, String> {
        let connection = {
            let mut connections = GLOBAL_CHANNEL.connections.lock().unwrap();
            connections.remove(&connection_id)
        };

        if let Some(connection) = connection {
            let disconnect_message = serde_json::json!({
                "type": "disconnect",
                "id": connection.id,
                "seq": connection.seq,
            });

            let addr = SocketAddr::from_str(&connection.socket_ip)
                .map_err(|e| format!("Invalid socket address: {}", e))?;

            GLOBAL_CHANNEL
                .socket
                .send_to(&serde_json::to_vec(&disconnect_message).unwrap(), addr)
                .map_err(|e| e.to_string())?;

            Ok(true)
        } else {
            Ok(false)
        }
    }

    pub async fn handle_message(
        app: &tauri::AppHandle,
        connection_id: u32,
        message_type: MessageType,
    ) -> Result<(), String> {
        match message_type {
            MessageType::Data(data) => {
                app.emit(&format!("udp://connection/{}/data", connection_id), data)
                    .map_err(|e| e.to_string())?;
            }
            MessageType::Sync(sync) => {
                app.emit(&format!("udp://connection/{}/sync", connection_id), sync)
                    .map_err(|e| e.to_string())?;
            }
            MessageType::Detect(detect) => {
                app.emit(
                    &format!("udp://connection/{}/detect", connection_id),
                    detect,
                )
                .map_err(|e| e.to_string())?;
            }
        }
        Ok(())
    }
}

// 全局 UDP Channel 实例
lazy_static::lazy_static! {
    static ref GLOBAL_CHANNEL: UdpChannel = UdpChannel::new().expect("Failed to create UDP channel");
}

#[derive(Clone, Debug, Serialize)]
struct EventPayload {
    message: serde_json::Value,
    remote_info: String,
}

// Tauri 命令
#[tauri::command]
pub async fn udp_channel_listen(app: tauri::AppHandle) -> Result<u16, String> {
    UdpChannel::listen(app).await
}

#[tauri::command]
pub async fn udp_channel_send(connection_id: u32, data: SendData) -> Result<(), String> {
    UdpChannel::send(connection_id, data).await
}

#[tauri::command]
pub async fn udp_channel_connect(app: tauri::AppHandle, socket_ip: String) -> Result<(), String> {
    UdpChannel::connect(app, socket_ip).await
}

#[tauri::command]
pub async fn udp_channel_disconnect(connection_id: u32) -> Result<bool, String> {
    UdpChannel::disconnect(connection_id).await
}

#[tauri::command]
pub async fn udp_channel_close_connection(connection_id: u32) -> Result<(), String> {
    let mut connections = GLOBAL_CHANNEL.connections.lock().unwrap();
    connections.remove(&connection_id);
    Ok(())
}

#[tauri::command]
pub async fn udp_channel_send_message(
    app: tauri::AppHandle,
    connection_id: u32,
    message_type: MessageType,
) -> Result<(), String> {
    UdpChannel::handle_message(&app, connection_id, message_type).await
}
