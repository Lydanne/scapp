use std::sync::Arc;

use tokio::{net::UdpSocket, task::JoinHandle};


pub(crate) struct Udp {
  pub task: JoinHandle<()>,
  pub sock: Arc<UdpSocket>,
}