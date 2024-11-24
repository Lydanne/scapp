use once_cell::sync::Lazy;
use protobuf::{EnumOrUnknown, Message};
use rand::Rng;
use serde::Serialize;
use tauri::Emitter;
use tauri::{ipc::Channel, AppHandle};
use std::collections::HashMap;
use std::net::SocketAddr;
use std::sync::{Arc, Mutex, RwLock};
use tokio::net::UdpSocket;
use tokio::sync::mpsc;

use crate::native_connection::{ChannelStatus, OnData, OnDataStatus, PipeData, SynReadySignalPipe};
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

#[tauri::command]
pub async fn native_channel_listen(app: AppHandle) -> u32 {
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
                    if let Ok(ref channel) = channel {
                        // println!("{:?}", channel);
                        if let Some(action) = &channel.action {
                            let mut connections = CONNECTIONS.lock().unwrap();
                            // println!("connections {:?}", connections);

                            let client = connections.get_mut(&channel.id);

                            match action {
                                payload::channel::Action::Connect(data) => {
                                    // println!("connect");
                                    if let Some(client) = client {
                                        // println!("connect client");
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
                                                send_message(socket.clone(), &on_received.remote_info, message);
                                            }
                                            client.status = ChannelStatus::Connected;
                                            app.emit("on_connection", client.clone()).unwrap();
                                        } else {
                                            // 连接失败
                                            let message = payload::Channel {
                                                version: 1,
                                                id: channel.id,
                                                ts: get_ts(),
                                                action: Some(payload::channel::Action::Disconnect(
                                                    payload::DisconnectAction::new(),
                                                )),
                                                special_fields: Default::default(),
                                            };
                                            send_message(socket.clone(), &on_received.remote_info, message);
                                        }
                                    } else {
                                        // println!("connect client not found");
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
                                            ts: get_ts(),
                                            action: Some(payload::channel::Action::Connect(
                                                payload::ConnectAction {
                                                    seq: seq,
                                                    ack: data.seq + 1,
                                                    special_fields: Default::default(),
                                                },
                                            )),
                                            special_fields: Default::default(),
                                        };
                                        send_message(socket.clone(), &on_received.remote_info, message);
                                    }
                                }
                                payload::channel::Action::Disconnect(_) => {
                                    println!("disconnect");
                                }
                                payload::channel::Action::Data(action) => {
                                    if let Some(client) = client {
                                        // client.lasts.push(on_received.message.to_vec());
                                        // println!("data actionId: {}", action.id);
                                        
                                        let pipe = client.pipe_map.get_mut(&action.id);
                                        
                                        if let Some(pipe) = pipe {
                                            let now = get_ts();

                                            pipe.buffers.push(action.body.clone());
                                            pipe.received += 1;
                                            pipe.received_bytes += (action.body.len() * 1024) as u64;

                                            let message = payload::Channel {
                                                version: 1,
                                                id: channel.id,
                                                ts: now,
                                                action: Some(payload::channel::Action::Sync(
                                                    payload::SyncAction {
                                                        id: action.id,
                                                        signal: Some(payload::sync_action::Signal::AckChunkFinish(
                                                            payload::AckChunkFinish {
                                                                index: action.index,
                                                                status: EnumOrUnknown::new(payload::FinishStatus::Ok),
                                                                special_fields: Default::default(),
                                                            },
                                                        )),
                                                        special_fields: Default::default(),
                                                    },
                                                )),
                                                special_fields: Default::default(),
                                            };
                                            send_message(socket.clone(), &on_received.remote_info, message);

                                            if pipe.received == pipe.head.length {
                                                pipe.status = OnDataStatus::Done;
                                                pipe.progress = 100;
                                                let pipe_data = client.pipe_map.remove(&action.id);
                                                if let Some(pipe_data) = pipe_data {
                                                    let _ = app.emit("on_data",  OnData::from(pipe_data));
                                                }
                                            }else{
                                                pipe.status = OnDataStatus::Sending;
                                                pipe.progress = (pipe.received as f64 / pipe.head.length as f64 * 100.0) as u32;
                                                let speed = if now > pipe.start_time { pipe.received_bytes as f64 / (now - pipe.start_time) as f64 } else { 0.0 };
                                                pipe.speed = speed;
                                                let _ =app.emit("on_data", OnData::from(pipe.clone()));
                                            }
                                        }
                                    }
                                }
                                payload::channel::Action::Sync(action) => {
                                    // println!("sync actionId: {}", action.id);
                                    if let Some(client) = client {
                                        if let Some(payload::sync_action::Signal::SynReady(ready)) = &action.signal {
                                            send_message(socket.clone(), &on_received.remote_info, payload::Channel {
                                                version: 1,
                                                id: channel.id,
                                                ts: get_ts(),
                                                action: Some(payload::channel::Action::Sync(
                                                    payload::SyncAction {   
                                                        id: action.id,
                                                        signal: Some(payload::sync_action::Signal::AckReady(
                                                            payload::AckReadySignal {
                                                                length: ready.length,
                                                                size: ready.size,
                                                                sign: ready.sign.clone(),
                                                                special_fields: Default::default(),
                                                            },
                                                        )),
                                                        special_fields: Default::default(),
                                                    },
                                                )),
                                                special_fields: Default::default(),
                                            });
                                            let pipe = PipeData{
                                                channel_id: channel.id,
                                                id: action.id,
                                                index: 0,
                                                status: OnDataStatus::Ready,
                                                tp: ready.type_.into(),
                                                progress: 0,
                                                speed: 0.0,
                                                head: SynReadySignalPipe{
                                                    length: ready.length,
                                                    size: ready.size,
                                                    sign: ready.sign.clone(),
                                                    name: ready.name.clone(),
                                                },
                                                buffers: vec![],
                                                received: 0,
                                                received_bytes: 0,
                                                start_time: channel.ts,
                                            };
                                            app.emit("on_data", OnData::from(pipe.clone())).unwrap();
                                            client.pipe_map.insert(action.id, pipe);
                                        }
                                    }
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

pub fn send_message(socket: Arc<UdpSocket>, remote_info: &SocketAddr, message: payload::Channel) {
    let remote = remote_info.clone();
    let message_bytes = message.write_to_bytes().unwrap().to_vec();
    tokio::spawn(async move {
        send_packet(socket, &remote, message_bytes).await;
    });
}

pub fn get_ts() -> u64 {
    std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap()
        .as_millis() as u64
}