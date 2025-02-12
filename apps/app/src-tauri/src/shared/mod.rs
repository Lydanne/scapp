use std::sync::Arc;

use tokio::{net::UdpSocket, sync::{mpsc, Mutex}, task::JoinHandle};

use crate::proto::payload::SyncAction;

pub mod base64;
pub mod string;
pub mod file;

pub(crate) struct Udp {
  pub task: JoinHandle<()>,
  pub sock: Arc<UdpSocket>,
  pub sync_rx: Arc<Mutex<mpsc::Receiver<SyncAction>>>,
}
