use std::{
    net::{SocketAddr, UdpSocket},
    sync::Mutex,
    thread,
};

use serde::Serialize;
use tauri::{ipc::Channel, AppHandle, Emitter};

static SOCKET: Mutex<Option<UdpSocket>> = Mutex::new(None);

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct OnReceived {
    message: Vec<u8>,
    remote_info: SocketAddr,
}

#[tauri::command]
pub async fn socket_bind() -> String {
    log::info!("Hello from Rust!");
    let socket = UdpSocket::bind("0.0.0.0:0").expect("Failed to bind socket");

    let socket_ip = format!("{}", socket.local_addr().unwrap());
    SOCKET.lock().unwrap().replace(socket);

    socket_ip
}

#[tauri::command]
pub fn socket_send(socket_ip: String, message: Vec<u8>) {
    log::info!("socket_send: {:?}", (&socket_ip, &message));
    let socket = SOCKET.lock().unwrap();
    if let Some(socket) = socket.as_ref() {
        socket
            .send_to(&message, socket_ip)
            .expect("Failed to send data");
    }
}

#[tauri::command]
pub fn socket_receive(on_event: Channel<OnReceived>) {
    thread::spawn(move || loop {
        thread::sleep(std::time::Duration::from_millis(100));
        let socket_clone = {
            let socket = SOCKET.lock().unwrap();
            if let Some(socket) = socket.as_ref() {
                socket.try_clone().expect("Failed to clone socket")
            } else {
                continue;
            }
        }; // 锁在这里被释放

        let mut buffer = vec![0; 1400];
        let (amt, src) = socket_clone
            .recv_from(&mut buffer)
            .expect("Failed to receive data");
        log::info!("Received message: {} {:?}", amt, src);
        on_event
            .send(OnReceived {
                message: buffer[..amt].to_vec(),
                remote_info: src,
            })
            .unwrap();
    });
}
