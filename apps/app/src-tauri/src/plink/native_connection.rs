use std::collections::HashMap;

use base64::Engine;
use protobuf::EnumOrUnknown;
use serde::{Deserialize, Serialize};

use crate::shared;

use super::proto::payload::{self, DataType, SynReadySignal};

#[derive(PartialEq, Debug, Clone, Serialize, Deserialize)]
#[serde(into = "i32", from = "i32")]
pub enum ChannelStatus {
    Init = 0,
    Connecting = 1,
    Connected = 2,
    Disconnecting = 3,
    Disconnected = 4,
}

impl Into<i32> for ChannelStatus {
    fn into(self) -> i32 {
        self as i32
    }
}

impl From<i32> for ChannelStatus {
    fn from(value: i32) -> Self {
        match value {
            _ => unreachable!(),
        }
    }
}

#[derive(Clone, Serialize, Deserialize, Debug, Default)]
#[serde(rename_all = "camelCase")]
pub struct SynReadySignalPipe {
    pub length: u32,
    pub size: u32,
    pub sign: String,
    pub name: String,
}


impl From<SynReadySignal> for SynReadySignalPipe {
    fn from(value: SynReadySignal) -> Self {
        Self {
            length: value.length,
            size: value.size,
            sign: value.sign,
            name: value.name,
        }
    }
}

#[derive(Clone, Serialize, Deserialize, Debug)]
#[serde(into = "i32", from = "i32")]
pub enum DataTypePipe {
    TEXT = 0,
    FILE = 1,
}

impl Into<i32> for DataTypePipe {
    fn into(self) -> i32 {
        self as i32
    }
}

impl From<DataType> for DataTypePipe {
    fn from(value: DataType) -> Self {
        match value {
            DataType::TEXT => DataTypePipe::TEXT,
            DataType::FILE => DataTypePipe::FILE,
        }
    }
}

impl From<i32> for DataTypePipe {
    fn from(value: i32) -> Self {
        match value {
            0 => DataTypePipe::TEXT,
            1 => DataTypePipe::FILE,
            _ => unreachable!(),
        }
    }
}

impl From<EnumOrUnknown<DataType>> for DataTypePipe {
    fn from(value: EnumOrUnknown<DataType>) -> Self {
        value.value().into()
    }
}

#[derive(Clone, Serialize, Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct PipeData {
    pub channel_id: u32,
    pub id: u32,
    pub index: u32,
    pub status: OnDataStatus,
    pub tp: DataTypePipe,
    pub progress: u32,
    pub speed: f64,
    pub head: SynReadySignalPipe,
    pub buffers: Vec<Vec<u8>>,
    pub received: u32,
    pub received_bytes: u64,
    pub start_time: u64,
    pub body: String,
}

#[derive(Clone, Serialize, Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct NativeConnection {
    pub id: u32,
    pub status: ChannelStatus,
    pub socket_ip: String,
    pub seq: u32,
    pub lasts: Vec<Vec<u8>>,
    pub pipe_map: HashMap<u32, PipeData>,
}

impl NativeConnection {
    pub fn new(id: u32, socket_ip: String) -> Self {
        Self {
            id,
            status: ChannelStatus::Disconnected,
            socket_ip,
            seq: 0,
            lasts: Vec::new(),
            pipe_map: HashMap::new(),
        }
    }
}


#[derive(Clone, Serialize, Deserialize, Debug)]
#[serde(into = "i32", from = "i32")]
pub enum OnDataStatus {
    Ready = 0,
    Sending = 1,
    Done = 2,
}

impl Into<i32> for OnDataStatus {
    fn into(self) -> i32 {
        self as i32
    }
}

impl From<i32> for OnDataStatus {
    fn from(value: i32) -> Self {
        match value {
            0 => OnDataStatus::Ready,
            1 => OnDataStatus::Sending,
            2 => OnDataStatus::Done,
            _ => OnDataStatus::Ready, // 默认返回 Ready 状态
        }
    }
}

#[derive(Clone, Serialize, Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct OnData {
    pub channel_id: u32,
    pub id: u32,
    pub index: u32,
    pub status: OnDataStatus,
    pub r#type: DataTypePipe,
    pub progress: u32,
    pub speed: f64,
    pub head: SynReadySignalPipe,
    pub body: String,
}
    
impl From<PipeData> for OnData {
    fn from(value: PipeData) -> Self {
        let body = if matches!(value.status, OnDataStatus::Done) {
            let body = value.buffers.into_iter().flatten().collect::<Vec<u8>>();
            let body = if let DataTypePipe::FILE = value.tp {
                let temp_dir = std::env::temp_dir();
                let file_name = format!("{}_{}", value.id, value.head.name);
                let file_path: std::path::PathBuf = temp_dir.join(file_name);
                std::fs::write(&file_path, &body).unwrap_or_default();
                file_path.to_str().unwrap_or_default().to_string()
            } else {
                String::from_utf8(body).unwrap_or_default()
            };
            body
        } else {
            String::new()
        };
        Self {
            channel_id: value.channel_id,
            id: value.id,
            index: value.index,
            status: value.status,
            r#type: value.tp,
            progress: value.progress,
            speed: value.speed,
            head: value.head,
            body,
        }
    }
}


#[derive(Clone, Serialize, Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct SendData {
    pub id: u32,
    pub r#type: DataTypePipe,
    pub head: SynReadySignalPipe,
    pub body: String,
}


#[derive(Clone, Serialize, Deserialize, Debug)]
pub struct OnDisconnect {
    pub connection: NativeConnection,
    pub code: OnDisconnectCode,
}

#[derive(Clone, Copy, Serialize, Deserialize, Debug)]
#[serde(into = "i32", from = "i32")]
pub enum OnDisconnectCode {
    Success = 0,
    Error = 1,
    DetectError = 2,
}

impl Into<i32> for OnDisconnectCode {
    fn into(self) -> i32 {
        self as i32
    }
}

impl From<i32> for OnDisconnectCode {
    fn from(value: i32) -> Self {
        match value {
            0 => OnDisconnectCode::Success,
            1 => OnDisconnectCode::Error,
            2 => OnDisconnectCode::DetectError,
            _ => OnDisconnectCode::Success,
        }
    }
}