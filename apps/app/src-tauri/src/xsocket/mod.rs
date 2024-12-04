use std::{error::Error, net::SocketAddr, sync::Arc};

use tokio::{net::UdpSocket, sync::mpsc, task::JoinHandle};

pub struct XSocket {
    size: usize,
    receiver_task: Option<JoinHandle<()>>,
    sender_task: Option<JoinHandle<()>>,

    sender_bind: Option<mpsc::Receiver<(Vec<u8>, SocketAddr)>>,
    receiver_bind: mpsc::Sender<Vec<u8>>,

    pub sender: mpsc::Sender<(Vec<u8>, SocketAddr)>,
    pub receiver: mpsc::Receiver<Vec<u8>>,
    pub socket: Option<Arc<UdpSocket>>,
}

impl XSocket {
    pub fn new(size: usize) -> Self {
        let (sender, sender_bind) = mpsc::channel(size);
        let (receiver_bind, receiver) = mpsc::channel(size);
        Self {
            size,
            receiver_task: None,
            sender_task: None,
            sender,
            sender_bind: Some(sender_bind),
            receiver,
            receiver_bind,
            socket: None,
        }
    }

    pub async fn listen(&mut self, addr: &SocketAddr) -> Result<(), Box<dyn Error>> {
        let socket = Arc::new(UdpSocket::bind(addr).await?);
        let size = self.size;
        let receiver_bind = self.receiver_bind.clone();

        // 启动接收消息的任务
        let receiver_task = tokio::spawn({
            let socket = socket.clone();
            async move {
                loop {
                    let mut buffer = vec![0; size];
                    if let Ok((amt, _)) = socket.recv_from(&mut buffer).await {
                        if receiver_bind.send(buffer[..amt].to_vec()).await.is_err() {
                            // 如果接收方已关闭,则退出循环
                            break;
                        }
                    }
                }
            }
        });
        self.receiver_task = Some(receiver_task);

        // 启动发送消息的任务
        let sender_task = tokio::spawn({
            let socket = socket.clone();
            let mut sender_bind = self.sender_bind.take().unwrap();
            async move {
                while let Some((packet, target_addr)) = sender_bind.recv().await {
                    if socket.send_to(&packet, target_addr).await.is_err() {
                        break;
                    }
                }
            }
        });
        
        self.sender_task = Some(sender_task);
        self.socket = Some(socket);

        Ok(())
    }

    pub fn close(&mut self) {
        // 中止接收和发送任务
        if let Some(task) = self.receiver_task.take() {
            task.abort();
        }
        if let Some(task) = self.sender_task.take() {
            task.abort();
        }
        
        // 显式关闭 socket
        if let Some(socket) = self.socket.take() {
            // 确保是最后一个引用才进行关闭
            if Arc::strong_count(&socket) == 1 {
                // UDP socket 会在 drop 时自动关闭
                drop(socket);
            }
        }
        
        // 重置通道
        let (sender, sender_bind) = mpsc::channel(self.size);
        self.sender = sender;
        self.sender_bind = Some(sender_bind);
        
        let (receiver_bind, receiver) = mpsc::channel(self.size);
        self.receiver_bind = receiver_bind;
        self.receiver = receiver;
    }
}
