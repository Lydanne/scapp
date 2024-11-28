use once_cell::sync::Lazy;
use protobuf::{EnumOrUnknown, Message};
use rand::Rng;
use serde::Serialize;
use tauri::Emitter;
use tauri::{ipc::Channel, AppHandle};
use std::collections::HashMap;
use std::fs;
use std::io::Read;
use std::net::SocketAddr;
use std::sync::{Arc, Mutex, RwLock};
use tokio::net::UdpSocket;
use tokio::sync::mpsc;

use crate::file::file_sign;
use crate::native_connection::{ChannelStatus, OnData, OnDataStatus, PipeData, SynReadySignalPipe};
use crate::send_packet;
use crate::string::string_sign;
use crate::{proto::payload, receive_packet, Udp};

use super::native_connection::{DataTypePipe, NativeConnection, SendData};

static SOCKETS: Lazy<RwLock<HashMap<String, Udp>>> = Lazy::new(|| RwLock::new(HashMap::new()));
static CONNECTIONS: Lazy<Mutex<HashMap<u32, NativeConnection>>> =
    Lazy::new(|| Mutex::new(HashMap::new()));

pub const BLOCK_SIZE: usize = 1024 * 512;

// #[tauri::command]
// pub async fn native_channel_connect(socket_id: String, channel_id: u32) -> bool {
//     let socket_guard = SOCKETS.read().unwrap();
//     if let Some(socket) = socket_guard.get(&socket_id) {
//         let socket_addr = socket_id.parse::<std::net::SocketAddr>().unwrap();
//         match socket.sock.connect(socket_addr).await {
//             Ok(_) => return true,
//             Err(e) => {
//                 log::error!("连接到 {} 失败: {}", socket_id, e);
//                 return false;
//             }
//         }
//     } else {
//         log::error!("套接字尚未初始化");
//         return false;
//     }
// }

#[tauri::command]
pub async fn native_channel_disconnect() -> bool {
    true
}

#[tauri::command]
pub async fn native_channel_listen(app: AppHandle, socket_id: String) -> u32 {
    // 开始生成代码
    let socket = UdpSocket::bind("0.0.0.0:0")
        .await
        .expect("绑定 UDP 套接字失败");
    let socket = Arc::new(socket);
    let local_addr = socket.local_addr().unwrap();
    let port = local_addr.port();
    // let (tx, rx) = mpsc::channel::<OnReceived>(1024);
    SOCKETS.write().unwrap().insert(
        socket_id,
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
                                                body: "".to_string(),
                                            };
                                            app.emit("on_data", OnData::from(pipe.clone())).unwrap();
                                            client.pipe_map.insert(action.id, pipe);
                                        }else if let Some(payload::sync_action::Signal::AckReady(finish)) = &action.signal {
                                            let pipe = client.pipe_map.remove(&action.id);
                                            if let Some(pipe) = pipe {
                                                match pipe.tp {
                                                    DataTypePipe::FILE => {
                                                        // 发送文件
                                                        let path = pipe.body.clone();
                                                        let mut file = fs::File::open(path.as_str()).unwrap();
                                                        let mut buffer = vec![0u8; BLOCK_SIZE]; // 使用 BLOCK_SIZE 作为缓冲区大小
                                                        let mut offset = 0;
                                                        
                                                        loop {
                                                            match file.read(&mut buffer) {
                                                                Ok(n) if n == 0 => break, // 文件读取完成
                                                                Ok(n) => {
                                                                    let data = payload::Channel {
                                                                        version: 1,
                                                                        id: channel.id,
                                                                        ts: get_ts(),
                                                                        action: Some(payload::channel::Action::Data(
                                                                            payload::DataAction {
                                                                                id: pipe.id,
                                                                                index: offset,
                                                                                body: buffer[..n].to_vec(),
                                                                                special_fields: Default::default(),
                                                                            }
                                                                        )),
                                                                        special_fields: Default::default(),
                                                                    };
                                                                    offset += 1;
                                                                    
                                                                    // 发送后需要等客户端通过 socket 返回 ack
                                                                    // 如果客户端没有返回 ack，则需要重发
                                                                    let mut ack_received = false;
                                                                    while !ack_received {
                                                                        send_message(socket.clone(), &on_received.remote_info, data.clone());
                                                                        // match socket.recv_from(&mut buffer).await {
                                                                        //     Ok(_) => {
                                                                        //         ack_received = true;
                                                                        //     }
                                                                        //     Err(_) => {
                                                                        //         tokio::time::sleep(tokio::time::Duration::from_millis(100)).await;
                                                                        //     }
                                                                        // }
                                                                    }
                                                                }
                                                                Err(e) => {
                                                                    println!("读取文件错误: {}", e);
                                                                    break;
                                                                }
                                                            }
                                                        }
                                                    }
                                                    DataTypePipe::TEXT => {
                                                        
                                                    }
                                                }
                                            }
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
pub async fn native_channel_send(socket_id: String, channel_id: u32, data: SendData, cb: Channel<OnData>) -> bool {
    let mut connections = CONNECTIONS.lock().unwrap();
    if let Some(client) = connections.get_mut(&channel_id) {
        let socket = {
            let sockets = SOCKETS.read().unwrap();
            let udp = sockets.get(&socket_id).unwrap();
            udp.sock.clone()
        };
        let mut syn_ready = payload::SynReadySignal::new();
        syn_ready.name = data.head.name.clone();
        if let DataTypePipe::TEXT = data.r#type {
            syn_ready.type_ = payload::DataType::TEXT.into();
            syn_ready.sign = string_sign(&data.body);
            syn_ready.size = data.body.len() as u32;
            syn_ready.name = data.head.name.clone();
        } else {
            let path = data.body.clone();
            let mut file = fs::File::open(path.as_str()).unwrap();
            let metadata = file.metadata().unwrap();
            syn_ready.type_ = payload::DataType::FILE.into();
            syn_ready.size = metadata.len() as u32;
            syn_ready.name = path.split("/").last().unwrap().to_string();
            syn_ready.sign = file_sign(&mut file);
        }

        syn_ready.length = (syn_ready.size / BLOCK_SIZE as u32) as u32;

        let remote_info = client.socket_ip.parse::<std::net::SocketAddr>().unwrap();

        send_message(socket, &remote_info, payload::Channel {
            version: 1,
            id: channel_id,
            ts: get_ts(),
            action: Some(payload::channel::Action::Sync(
                payload::SyncAction {   
                    id: data.id,
                    signal: Some(payload::sync_action::Signal::SynReady(syn_ready.clone())),
                    special_fields: Default::default(),
                },
            )),
            special_fields: Default::default(),
        });
        client.pipe_map.insert(data.id, PipeData{
            channel_id: channel_id,
            id: data.id,
            index: 0,
            status: OnDataStatus::Ready,
            tp: data.r#type,
            progress: 0,
            speed: 0.0,
            head: SynReadySignalPipe{
                length: syn_ready.length,
                size: syn_ready.size,
                sign: syn_ready.sign.clone(),
                name: syn_ready.name.clone(),
            },
            buffers: vec![],
            received: 0,
            received_bytes: 0,
            start_time: get_ts(),
            body: data.body.clone(),
        });
    }
    true
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