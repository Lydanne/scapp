use std::{
    net::{SocketAddr, UdpSocket},
    sync::Mutex,
    thread,
};

use serde::Serialize;
use tauri::{ipc::Channel, AppHandle, Emitter};

static SOCKET: Mutex<Option<UdpSocket>> = Mutex::new(None);
static CHUNK_SIZE: usize = 1024;

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct OnReceived {
    #[serde(with = "serde_bytes")]
    message: Vec<u8>,
    remote_info: SocketAddr,
    ts: u64,
}

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
struct Packet {
    id: u32,
    index: u32,
    length: u32,
    message: Vec<u8>,
}

fn wrap_sub_packet(id: u32, index: u32, length: u32, message: &[u8]) -> Vec<u8> {
    let mut packet = Vec::new();
    packet.extend_from_slice(&id.to_be_bytes());
    packet.extend_from_slice(&length.to_be_bytes());
    packet.extend_from_slice(&index.to_be_bytes());
    packet.extend_from_slice(message);
    packet
}

fn unwrap_sub_packet(data: &[u8]) -> Packet {
    let id = u32::from_be_bytes(data[0..4].try_into().unwrap());
    let length = u32::from_be_bytes(data[4..8].try_into().unwrap());
    let index = u32::from_be_bytes(data[8..12].try_into().unwrap());
    let message = data[12..].to_vec();
    Packet {
        id,
        index,
        length,
        message,
    }
}

#[tauri::command]
pub async fn channel_socket_bind() -> String {
    log::info!("channel_socket_bind!");
    let socket = UdpSocket::bind("0.0.0.0:0").expect("Failed to bind socket");

    let socket_ip = format!("{}", socket.local_addr().unwrap());
    SOCKET.lock().unwrap().replace(socket);

    socket_ip
}

#[tauri::command]
pub fn channel_socket_send(socket_ip: String, message: Vec<u8>) {
    let socket = SOCKET.lock().unwrap();
    if let Some(socket) = socket.as_ref() {
        static mut UNISEQ: u32 = 0;
        let id = unsafe {
            let current = UNISEQ;
            UNISEQ = UNISEQ.wrapping_add(1);
            current
        };

        let chunks: Vec<Vec<u8>> = message
            .chunks(CHUNK_SIZE)
            .map(|chunk| chunk.to_vec())
            .collect();

        let total_chunks = chunks.len() as u32;

        for (i, chunk) in chunks.into_iter().enumerate() {
            let sub_packet = wrap_sub_packet(id, i as u32, total_chunks, &chunk);
            socket
                .send_to(&sub_packet, &socket_ip)
                .expect("Failed to send data");
        }
    }
}

#[tauri::command]
pub fn channel_socket_receive(on_event: Channel<OnReceived>) {
    use std::collections::HashMap;
    let socket_clone = {
        let socket = SOCKET.lock().unwrap();
        socket.as_ref().unwrap().try_clone().unwrap()
    };

    thread::spawn(move || {
        let mut packets: HashMap<u32, Vec<Option<Vec<u8>>>> = HashMap::new();

        loop {
            let mut buffer = vec![0; 1400];
            let (amt, src) = socket_clone
                .recv_from(&mut buffer)
                .expect("Failed to receive data");

            let packet = unwrap_sub_packet(&buffer[..amt]);

            let packet_list = packets
                .entry(packet.id)
                .or_insert_with(|| vec![None; packet.length as usize]);

            packet_list[packet.index as usize] = Some(packet.message);

            if packet_list.iter().all(|p| p.is_some()) {
                let complete_message: Vec<u8> = packet_list
                    .iter()
                    .flat_map(|p| p.as_ref().unwrap().clone())
                    .collect();

                on_event
                    .send(OnReceived {
                        message: complete_message,
                        remote_info: src,
                        ts: std::time::SystemTime::now()
                            .duration_since(std::time::UNIX_EPOCH)
                            .unwrap()
                            .as_millis() as u64,
                    })
                    .unwrap();

                packets.remove(&packet.id);
            }
        }
    });
}
