use std::collections::HashMap;

use protobuf::EnumOrUnknown;
use serde::Serialize;

use super::proto::payload::{self, DataType, SynReadySignal};

#[derive(PartialEq, Debug, Clone, Serialize)]
#[serde(into = "i32")]
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

#[derive(Clone, Serialize, Debug, Default)]
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

#[derive(Clone, Serialize, Debug)]
#[serde(into = "i32")]
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

#[derive(Clone, Serialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct PipeData {
    pub id: u32,
    pub index: u32,
    pub status: OnDataStatus,
    pub tp: DataTypePipe,
    pub progress: u32,
    pub speed: u32,
    pub head: SynReadySignalPipe,
    pub buffers: Vec<Vec<u8>>,
    pub received: u32,
    pub received_bytes: u32,
    pub start_time: u64,
}

#[derive(Clone, Serialize, Debug)]
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

    pub fn send(&mut self, data: SendData) {
        self.seq += 1;
    }

    pub fn on(&mut self, cb: Box<dyn Fn(OnData) -> ()>) {
        cb(OnData {
            id: self.id,
            index: self.seq,
            status: OnDataStatus::Ready,
            tp: DataTypePipe::TEXT,
            progress: 0,
            speed: 0,
            head: SynReadySignalPipe::default(),
            body: "".to_string(),
        });
    }
}

pub struct SendData {
    pub id: u32,
    pub tp: DataTypePipe,
    pub head: SynReadySignalPipe,
    pub body: String,
}

#[derive(Clone, Serialize, Debug)]
#[serde(into = "i32")]
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

#[derive(Clone, Serialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct OnData {
    pub id: u32,
    pub index: u32,
    pub status: OnDataStatus,
    pub tp: DataTypePipe,
    pub progress: u32,
    pub speed: u32,
    pub head: SynReadySignalPipe,
    pub body: String,
}

impl From<PipeData> for OnData {
    fn from(value: PipeData) -> Self {
        let body = value.buffers.into_iter().flatten().collect::<Vec<u8>>();
        let body = base64::decode(&body).unwrap_or(body);
        let body = String::from_utf8(body).unwrap_or_default();
        Self {
            id: value.id,
            index: value.index,
            status: value.status,
            tp: value.tp,
            progress: value.progress,
            speed: value.speed,
            head: value.head,
            body,
        }
    }
}
