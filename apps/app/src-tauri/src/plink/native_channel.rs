use once_cell::sync::Lazy;
use protobuf::Message;
use rand::Rng;
use serde::Serialize;
use tauri::ipc;
use std::collections::HashMap;
use std::sync::{Arc, Mutex, RwLock};
use tokio::net::UdpSocket;
use tokio::sync::mpsc;

use crate::native_connection::ChannelStatus;
use crate::send_packet;
use crate::{proto::payload, receive_packet, Udp};

use super::native_connection::NativeConnection;

static SOCKETS: Lazy<RwLock<HashMap<String, Udp>>> = Lazy::new(|| RwLock::new(HashMap::new()));
static CONNECTIONS: Lazy<Mutex<HashMap<u32, NativeConnection>>> =
    Lazy::new(|| Mutex::new(HashMap::new()));

static CHUNK_SIZE: usize = 1024;

#[tauri::command]
pub async fn native_channel_connect(socket_ip: String) -> bool {
    let socket_guard = SOCKETS.read().unwrap();
    if let Some(socket) = socket_guard.get(&socket_ip) {
        let socket_addr = socket_ip.parse::<std::net::SocketAddr>().unwrap();
        match socket.sock.connect(socket_addr).await {
            Ok(_) => return true,
            Err(e) => {
                log::error!("连接到 {} 失败: {}", socket_ip, e);
                return false;
            }
        }
    } else {
        log::error!("套接字尚未初始化");
        return false;
    }
}

#[tauri::command]
pub async fn native_channel_disconnect() -> bool {
    true
}

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct EmConnection {
    id: u32,
}

#[tauri::command]
pub async fn native_channel_listen(em_connection: ipc::Channel<EmConnection>) -> u32 {
    // 开始生成代码
    let socket = UdpSocket::bind("0.0.0.0:0")
        .await
        .expect("绑定 UDP 套接字失败");
    let socket = Arc::new(socket);
    let local_addr = socket.local_addr().unwrap();
    let port = local_addr.port();
    // let (tx, rx) = mpsc::channel::<OnReceived>(1024);
    SOCKETS.write().unwrap().insert(
        local_addr.to_string(),
        Udp {
            sock: socket.clone(),
            task: tokio::spawn(async move {
                receive_packet(socket.clone(), |on_received| {
                    let channel = payload::Channel::parse_from_bytes(&on_received.message);
                    if let Ok(channel) = channel {
                        println!("{:?}", channel);
                        if let Some(action) = channel.action {
                            let mut connections = CONNECTIONS.lock().unwrap();
                            println!("connections {:?}", connections);

                            let client = connections.get_mut(&channel.id);
                            match action {
                                payload::channel::Action::Connect(data) => {
                                    println!("connect");
                                    if let Some(client) = client {
                                        println!("connect client");
                                        client.status = ChannelStatus::Connecting;
                                        if client.seq + 1 == data.ack {
                                            if client.status != ChannelStatus::Connecting {
                                                return;
                                            }
                                            if data.seq != 0 {
                                                let message = payload::Channel {
                                                    version: 1,
                                                    id: channel.id,
                                                    ts: std::time::SystemTime::now()
                                                        .duration_since(std::time::UNIX_EPOCH)
                                                        .unwrap()
                                                        .as_millis()
                                                        as u64,
                                                    action: Some(
                                                        payload::channel::Action::Connect(
                                                            payload::ConnectAction {
                                                                seq: 0,
                                                                ack: data.seq + 1,
                                                                special_fields: Default::default(),
                                                            },
                                                        ),
                                                    ),
                                                    special_fields: Default::default(),
                                                };
                                                let socket_sub = socket.clone();
                                                tokio::spawn(async move {
                                                    send_packet(socket_sub, &on_received.remote_info, message.write_to_bytes().unwrap().to_vec()).await;
                                                });
                                            }
                                            client.status = ChannelStatus::Connected;
                                            em_connection.send(EmConnection{id: channel.id}).unwrap();
                                            println!("em_connection send");
                                        } else {
                                            // 连接失败
                                            let message = payload::Channel {
                                                version: 1,
                                                id: channel.id,
                                                ts: std::time::SystemTime::now()
                                                    .duration_since(std::time::UNIX_EPOCH)
                                                    .unwrap()
                                                    .as_millis()
                                                    as u64,
                                                action: Some(payload::channel::Action::Disconnect(
                                                    payload::DisconnectAction::new(),
                                                )),
                                                special_fields: Default::default(),
                                            };
                                            let socket_sub = socket.clone();
                                            tokio::spawn(async move {
                                                send_packet(socket_sub, &on_received.remote_info, message.write_to_bytes().unwrap().to_vec()).await;
                                            });
                                        }
                                    } else {
                                        println!("connect client not found");
                                        let seq = rand_u32();
                                        let mut client = NativeConnection::new(
                                            channel.id,
                                            on_received.remote_info.to_string(),
                                        );
                                        client.seq = seq;
                                        client.status = ChannelStatus::Connecting;
                                        connections.insert(channel.id, client);
                                        let message = payload::Channel {
                                            version: 1,
                                            id: channel.id,
                                            ts: std::time::SystemTime::now()
                                                .duration_since(std::time::UNIX_EPOCH)
                                                .unwrap()
                                                .as_millis()
                                                as u64,
                                            action: Some(payload::channel::Action::Connect(
                                                payload::ConnectAction {
                                                    seq: seq,
                                                    ack: data.seq + 1,
                                                    special_fields: Default::default(),
                                                },
                                            )),
                                            special_fields: Default::default(),
                                        };
                                        let socket_sub = socket.clone();
                                        tokio::spawn(async move {
                                            send_packet(socket_sub, &on_received.remote_info, message.write_to_bytes().unwrap().to_vec()).await;
                                        });
                                    }
                                }
                                payload::channel::Action::Disconnect(_) => {
                                    println!("disconnect");
                                }
                                payload::channel::Action::Data(_) => {
                                    println!("data");
                                }
                                payload::channel::Action::Sync(_) => {
                                    println!("sync");
                                }
                                payload::channel::Action::Detect(_) => {
                                    println!("detect");
                                }
                                _ => {}
                            }
                        }
                    }
                })
                .await;
            }),
        },
    );

    port as u32
}

#[tauri::command]
pub async fn native_channel_close() -> bool {
    true
}


pub fn rand_u32() -> u32 {
    rand::thread_rng().gen_range(1..100)
}
    