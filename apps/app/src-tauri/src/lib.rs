use std::net::{SocketAddr, UdpSocket};
use tauri_plugin_log::{Target, TargetKind};

#[tauri::command]
async fn test2(value: String) -> String {
    log::info!("Hello from Rust!");
    let socket = UdpSocket::bind("0.0.0.0:0").expect("Failed to bind socket");

    // 要发送的数据
    let data = b"Hello, world!";

    // 目标地址和端口
    let target_address = "192.168.10.255:12305";

    // 发送数据到目标地址
    socket
        .send_to(data, target_address)
        .expect("Failed to send data");

    log::info!("Data sent to {}", target_address);
    "Hello from Rust!".to_string() + &value
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_os::init())
        .plugin(
            tauri_plugin_log::Builder::new()
                .level(log::LevelFilter::Info)
                .targets([
                    Target::new(TargetKind::Stdout),
                    Target::new(TargetKind::LogDir { file_name: None }),
                    Target::new(TargetKind::Webview),
                ])
                .build(),
        )
        // .setup(|app| {
        //   if cfg!(debug_assertions) {
        //     // log::info!(target: "run", "Hello from debug_assertions!");
        //     app.handle().plugin(
        //       tauri_plugin_log::Builder::default()
        //         .level(log::LevelFilter::Info)
        //         .build(),
        //     )?;
        //   }
        //   Ok(())
        // })
        .invoke_handler(tauri::generate_handler![test2])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
