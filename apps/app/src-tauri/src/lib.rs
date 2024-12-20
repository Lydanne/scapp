use tauri_plugin_log::{Target, TargetKind};

mod socket;
pub use socket::*;

mod channel_socket;
pub use channel_socket::*;

mod net;
pub use net::*;

mod xsocket;
pub use xsocket::*;

mod plink;
pub use plink::*;
pub use plink::native_channel::*;


mod shared;
pub use shared::*;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_os::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
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
        .invoke_handler(tauri::generate_handler![
            socket_bind,
            socket_send,
            socket_receive,
            channel_socket_bind,
            channel_socket_send,
            channel_socket_receive,
            net_local_ip,
            native_channel_connect,
            native_channel_disconnect,
            native_channel_listen,
            native_channel_send,
            stop_listen_speed_test,
            listen_speed_test,
            start_speed_test,
            stop_speed_test,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
