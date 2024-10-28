use tauri_plugin_log::{Target, TargetKind};

mod socket;
pub use socket::*;

mod net;
pub use net::*;

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
        .invoke_handler(tauri::generate_handler![socket_bind, net_local_ip])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
