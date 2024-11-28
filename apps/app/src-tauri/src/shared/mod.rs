use std::sync::Arc;

use tokio::{net::UdpSocket, task::JoinHandle};

pub mod base64;
pub mod string;
pub mod file;

pub(crate) struct Udp {
  pub task: JoinHandle<()>,
  pub sock: Arc<UdpSocket>,
}