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
use std::sync::Arc;
use tokio::sync::{Mutex, RwLock};
use tokio::net::UdpSocket;
use tokio::sync::mpsc;

use crate::file::file_sign;
use crate::native_connection::{ChannelStatus, OnData, OnDataStatus, PipeData, SynReadySignalPipe};
use crate::send_packet;
use crate::string::string_sign;
use crate::{proto::payload, receive_packet, Udp};

use super::native_connection::{DataTypePipe, NativeConnection, OnDisconnect, OnDisconnectCode, SendData};
use super::proto::payload::sync_action::Signal;
use super::proto::payload::{sync_action, SyncAction};

static SOCKETS: Lazy<RwLock<HashMap<String, Udp>>> = Lazy::new(|| RwLock::new(HashMap::new()));
static CONNECTIONS: Lazy<Mutex<HashMap<u32, NativeConnection>>> = Lazy::new(|| Mutex::new(HashMap::new()));

pub const BLOCK_SIZE: usize = 1024 * 256;

#[tauri::command]
pub async fn native_channel_connect(socket_id: String, channel_id: u32, socket_ip: String) -> bool {
    let socket_guard = SOCKETS.read().await;
    if let Some(socket) = socket_guard.get(&socket_id) {
        let seq = rand_u32();
        send_message2(socket.sock.clone(), &socket_ip.parse::<std::net::SocketAddr>().unwrap(), payload::Channel {
            version: 1,
            id: channel_id,
            ts: get_ts(),
            action: Some(payload::channel::Action::Connect(
                payload::ConnectAction {
                    seq,
                    ack: 0,
                    special_fields: Default::default(),
                },
            )),
            special_fields: Default::default(),
        }).await;
        return true;
    } else {
        log::error!("套接字尚未初始化");
        return false;
    }
}

#[tauri::command]
pub async fn native_channel_disconnect(socket_id: String, channel_id: u32) -> bool {
    let socket_guard = SOCKETS.read().await;
    if let Some(socket) = socket_guard.get(&socket_id) {
        let connections = CONNECTIONS.lock().await;
        if let Some(channel) = connections.get(&channel_id) {    
            let seq = rand_u32();
            send_message2(socket.sock.clone(), &channel.socket_ip.parse::<std::net::SocketAddr>().unwrap(), payload::Channel {
                version: 1,
                id: channel_id,
                ts: get_ts(),
                action: Some(payload::channel::Action::Disconnect(
                payload::DisconnectAction {
                    seq,
                    ack: 0,
                    special_fields: Default::default(),
                },
            )),
            special_fields: Default::default(),
            }).await;
            return true;
        } else {
            log::error!("通道尚未初始化");
            return false;
        }
    } else {
        log::error!("套接字尚未初始化");
        return false;
    }
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
    let (sync_tx, sync_rx) = mpsc::channel::<SyncAction>(1024);
    let sync_rx = Arc::new(Mutex::new(sync_rx));
    SOCKETS.write().await.insert(
        socket_id,
        Udp {
            sync_rx,
            sock: socket.clone(),
            task: tokio::spawn(async move {
                receive_packet(socket.clone(), |on_received| {
                    let message = on_received.message.clone();
                    let socket = socket.clone();
                    let app = app.clone();
                    let sync_tx = sync_tx.clone();
                    async move {
                        let channel = payload::Channel::parse_from_bytes(&message);
                        if let Ok(ref channel) = channel {
                            // println!("{:?}", channel);
                            if let Some(action) = &channel.action {
                                match action {
                                    payload::channel::Action::Connect(data) => {
                                        let mut connections = CONNECTIONS.lock().await;
                                        // println!("connections {:?}", connections);
        
                                        let client = connections.get_mut(&channel.id);
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
                                                    send_message2(socket.clone(), &on_received.remote_info, message).await;
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
                                                send_message2(socket.clone(), &on_received.remote_info, message).await;
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
                                            send_message2(socket.clone(), &on_received.remote_info, message).await;
                                        }
                                    }
                                    payload::channel::Action::Disconnect(data) => {
                                        let mut connections = CONNECTIONS.lock().await;
                                        let client = connections.get_mut(&channel.id);
                                        if let Some(client) = client {
                                            if client.status == ChannelStatus::Connected {
                                                // 客户端请求断开连接
                                                let message = payload::Channel {
                                                    version: 1,
                                                    id: channel.id,
                                                    ts: get_ts(),
                                                    action: Some(payload::channel::Action::Disconnect(
                                                        payload::DisconnectAction {
                                                            seq: client.seq,
                                                            ack: data.seq + 1,
                                                            special_fields: Default::default(),
                                                        },
                                                    )),
                                                    special_fields: Default::default(),
                                                };
                                                send_message2(socket.clone(), &on_received.remote_info, message).await;
                                                client.status = ChannelStatus::Disconnecting;
                                            } else if client.status == ChannelStatus::Disconnecting {
                                                if client.seq + 1 == data.seq {
                                                    client.status = ChannelStatus::Disconnected;
                                                    let _ = app.emit("on_disconnect", OnDisconnect {
                                                        connection: client.clone(),
                                                        code: OnDisconnectCode::Success,
                                                    });
                                                } else {
                                                    client.status = ChannelStatus::Connected;
                                                }
                                            }
                                        }
                                    }
                                    payload::channel::Action::Data(action) => {
                                        let mut connections = CONNECTIONS.lock().await;
                                        // println!("connections {:?}", connections);
        
                                        let client = connections.get_mut(&channel.id);
        
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
                                                send_message2(socket.clone(), &on_received.remote_info, message).await;

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
                                        match &action.signal {
                                            Some(payload::sync_action::Signal::SynReady(ready)) => {
                                                let mut connections = CONNECTIONS.lock().await;
                                                // println!("connections {:?}", connections);
                
                                                let client = connections.get_mut(&channel.id);
                                                if let Some(client) = client {
                                                    send_message2(socket.clone(), &on_received.remote_info, payload::Channel {
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
                                                    }).await;
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
                                                }
                                            }
                                            _ => {
                                                if let Some(Signal::AckChunkFinish(signal)) = &action.signal {
                                                    println!("[Info] sync_action signal ack_chunk_finish {}", signal.index);
                                                }
                                                loop {
                                                    let r = sync_tx.send(action.clone()).await;
                                                    if let Err(e) = r {
                                                        println!("[Err] sync_tx send error: {}", e);
                                                    } else {
                                                        break;
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
                        
                    }
                })
                .await;
            }),
        },
    );

    port as u32
}

#[tauri::command]
pub async fn native_channel_send(socket_id: String, channel_id: u32, data: SendData, cb_event: Channel<OnData>) -> bool {
    let mut connections = CONNECTIONS.lock().await;
    if let Some(client) = connections.get_mut(&channel_id) {
        let (socket, sync_rx) = {
            let sockets = SOCKETS.read().await;
            let udp = sockets.get(&socket_id).unwrap();
            (udp.sock.clone(), udp.sync_rx.clone())
        };

        let mut sync_rx = sync_rx.lock().await;
        let mut syn_ready = payload::SynReadySignal::new();
        syn_ready.name = data.head.name.clone();

        match data.r#type {
            DataTypePipe::TEXT => {
                syn_ready.type_ = payload::DataType::TEXT.into();
                syn_ready.sign = string_sign(&data.body);
                syn_ready.size = data.body.len() as u32;
            }
            DataTypePipe::FILE => {
                let path = data.body.clone();
                let mut file = fs::File::open(path.as_str()).unwrap();
                syn_ready.type_ = payload::DataType::FILE.into();
                syn_ready.size = data.head.size;
                syn_ready.sign = file_sign(&mut file);
            }
        }

        syn_ready.length = (syn_ready.size as f32 / BLOCK_SIZE as f32).ceil() as u32;
        
        let remote_info = client.socket_ip.parse::<std::net::SocketAddr>().unwrap();
        send_message2(socket.clone(), &remote_info, payload::Channel {
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
        }).await;
        let mut pipe_data = PipeData{
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
        };
        // client.pipe_map.insert(data.id, pipe_data);
        let sync_action = tokio::time::timeout(
            std::time::Duration::from_secs(3), 
            sync_rx.recv()
        ).await;
        if let Err(_) = sync_action {
            println!("[Err] sync_action timeout");
            return false;
        }
        let sync_action = sync_action.unwrap();
        
        if let None = sync_action {
            println!("[Err] sync_action is none");
            return false;
        }
        let sync_action = sync_action.unwrap();

        if sync_action.id != data.id {
            println!("[Err] sync_action id not match {:?}", sync_action);
            return false;
        }

        if let None = &sync_action.signal {
            println!("[Err] sync_action ack_ready {:?}", sync_action);
            return false;
        }
        let signal = sync_action.signal.unwrap();
        
        if let payload::sync_action::Signal::AckReady(finish) = &signal {
            println!("[Ok] sync_action ack_ready {}", finish.length);
            match pipe_data.tp {
                DataTypePipe::FILE => {
                    // 发送文件
                    let path = pipe_data.body.clone();
                    let mut file = fs::File::open(path.as_str()).unwrap();
                    let mut index = 0;
                    
                    loop {
                        let mut buffer = vec![0u8; BLOCK_SIZE]; // 使 BLOCK_SIZE 作为缓冲区大小
                        match file.read(&mut buffer) {
                            Ok(n) if n == 0 => break, // 文件读取完成
                            Ok(n) => {
                                let data = payload::Channel {
                                    version: 1,
                                    id: pipe_data.channel_id,
                                    ts: get_ts(),
                                    action: Some(payload::channel::Action::Data(
                                        payload::DataAction {
                                            id: pipe_data.id,
                                            index,
                                            body: buffer[..n].to_vec(),
                                            special_fields: Default::default(),
                                        }
                                    )),
                                    special_fields: Default::default(),
                                };
                                println!("[Ok] send_message index: {} ts: {}", index, get_ts());
                                // 发送后需要等客户端通过 socket 返 ack
                                // 如果客户端没有返回 ack，则需要重发
                                let mut ack_received = false;
                                while !ack_received {
                                    let recv = sync_rx.recv();
                                    send_message2(socket.clone(), &remote_info, data.clone()).await;
                                    let sync_action = tokio::time::timeout(
                                        std::time::Duration::from_secs(1), 
                                        recv
                                    ).await;
                                    if let Ok(Some(sync_action)) = sync_action {
                                        if sync_action.id == pipe_data.id {
                                            ack_received = true;
                                        }
                                    }else{
                                        println!("[Err] sync_action recv timeout {}", index);
                                    }
                                }
                                pipe_data.index = index;
                                pipe_data.received = index;
                                pipe_data.received_bytes = pipe_data.received_bytes + (buffer.len() * 1024) as u64;
                                pipe_data.progress = (pipe_data.received as f64 / pipe_data.head.length as f64 * 100.0) as u32;
                                pipe_data.speed = if pipe_data.start_time > 0 { pipe_data.received_bytes as f64 / (get_ts() - pipe_data.start_time) as f64 } else { 0.0 };
                                pipe_data.status = if pipe_data.received + 1 >= pipe_data.head.length { 
                                    pipe_data.progress = 100;
                                    OnDataStatus::Done
                                } else { 
                                    OnDataStatus::Sending
                                };
                                let _ = cb_event.send(OnData::from(pipe_data.clone()));
                                index += 1;
                            }
                            Err(e) => {
                                println!("读取文件错误: {}", e);
                                break;
                            }
                        }
                    }
                }
                DataTypePipe::TEXT => {
                    let text = pipe_data.body.clone();
                    let text_bytes = text.as_bytes();
                    let mut index = 0;
                    let mut start = 0;
                    
                    loop {
                        let end = std::cmp::min(start + BLOCK_SIZE, text_bytes.len());
                        if start >= text_bytes.len() {
                            break;
                        }
                        
                        let chunk = &text_bytes[start..end];
                        let data = payload::Channel {
                            version: 1,
                            id: pipe_data.channel_id,
                            ts: get_ts(),
                            action: Some(payload::channel::Action::Data(
                                payload::DataAction {
                                    id: pipe_data.id,
                                    index,
                                    body: chunk.to_vec(),
                                    special_fields: Default::default(),
                                }
                            )),
                            special_fields: Default::default(),
                        };
                        index += 1;
                        start = end;
                        
                        let mut ack_received = false;
                        while !ack_received {
                            send_message2(socket.clone(), &remote_info, data.clone()).await;
                            let sync_action = tokio::time::timeout(
                                std::time::Duration::from_secs(3),
                                sync_rx.recv()
                            ).await;
                            if let Ok(Some(sync_action)) = sync_action {
                                if sync_action.id == pipe_data.id {
                                    ack_received = true;
                                }
                            }
                        }
                    }
                }
            
            }
        } else {
            println!("sync_action not ack_ready");
            return false;
        }
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

pub async fn send_message2(socket: Arc<UdpSocket>, remote_info: &SocketAddr, message: payload::Channel) {
    let message_bytes = message.write_to_bytes().unwrap().to_vec();
    send_packet(socket, &remote_info, message_bytes).await;
}

pub fn get_ts() -> u64 {
    std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap()
        .as_millis() as u64
}