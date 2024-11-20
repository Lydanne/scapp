use serde::Serialize;

use super::proto::payload::{DataType, SynReadySignal};

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

#[derive(Clone, Serialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct NativeConnection {
    pub id: u32,
    pub status: ChannelStatus,
    pub socket_ip: String,
    pub seq: u32,
}

impl NativeConnection {
    pub fn new(id: u32, socket_ip: String) -> Self {
        Self {
            id,
            status: ChannelStatus::Init,
            socket_ip,
            seq: 0,
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
            tp: DataType::TEXT,
            progress: 0,
            speed: 0,
            head: SynReadySignal::new(),
            body: "".to_string(),
        });
    }
}

pub struct SendData {
    pub id: u32,
    pub tp: DataType,
    pub head: SynReadySignal,
    pub body: String,
}

pub enum OnDataStatus {
    Ready,
    Sending,
    Done,
}

pub struct OnData {
    pub id: u32,
    pub index: u32,
    pub status: OnDataStatus,
    pub tp: DataType,
    pub progress: u32,
    pub speed: u32,
    pub head: SynReadySignal,
    pub body: String,
}
