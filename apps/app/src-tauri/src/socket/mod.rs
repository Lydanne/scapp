use std::{
    net::{SocketAddr, UdpSocket},
    sync::Mutex,
};

static SOCKET: Mutex<Option<UdpSocket>> = Mutex::new(None);

#[tauri::command]
pub async fn socket_bind() -> String {
    log::info!("Hello from Rust!");
    let socket = UdpSocket::bind("0.0.0.0:0").expect("Failed to bind socket");

    // // 要发送的数据
    // let data = b"Hello, world!";

    // // 目标地址和端口
    // let target_address = "192.168.10.255:12305";

    // // 发送数据到目标地址
    // socket
    //     .send_to(data, target_address)
    //     .expect("Failed to send data");

    // log::info!("Data sent to {}", target_address);
    let socket_ip = format!("{}", socket.local_addr().unwrap());
    SOCKET.lock().unwrap().replace(socket);

    socket_ip
}
