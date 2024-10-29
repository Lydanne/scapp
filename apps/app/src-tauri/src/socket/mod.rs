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
    ts: u64,
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
    // log::info!("socket_send: {:?}", (&socket_ip, &message));
    let socket = SOCKET.lock().unwrap();
    if let Some(socket) = socket.as_ref() {
        socket
            .send_to(&message, socket_ip)
            .expect("Failed to send data");
    }
}

#[tauri::command]
pub fn socket_receive(on_event: Channel<OnReceived>) {
    let socket_clone = {
        let socket = SOCKET.lock().unwrap();
        socket
            .as_ref()
            .ok_or("Socket not bound")
            .and_then(|s| s.try_clone().map_err(|_| "Failed to clone socket"))
            .expect("Failed to initialize socket receiver")
    };
    let on_event = on_event.clone();

    thread::spawn(move || loop {
        let mut buffer = [0; 1400];
        let (amt, src) = socket_clone
            .recv_from(&mut buffer)
            .expect("Failed to receive data");
        // log::info!("Received message: {} {:?}", amt, src);
        on_event
            .send(OnReceived {
                message: buffer[..amt].to_vec(),
                remote_info: src,
                ts: std::time::SystemTime::now()
                    .duration_since(std::time::UNIX_EPOCH)
                    .unwrap()
                    .as_millis() as u64,
            })
            .unwrap();
    });
}
