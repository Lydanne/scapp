use tauri::{ipc, Emitter};


#[tauri::command]
pub async fn xsocket_request(listen_addr: &str, target: &str, data: Vec<u8>) -> Result<(), String>{
  super::listen(listen_addr).await.map_err(|e| e.to_string())?;

  super::sender(listen_addr).unwrap().send((data, target.parse().unwrap())).await.map_err(|e| e.to_string())?;
  Ok(())
}

#[tauri::command]
pub async fn xsocket_listen(app: tauri::AppHandle, listen_addr: &str) -> Result<(), String>{
  super::listen(listen_addr).await.map_err(|e| e.to_string())?;

  while let Ok(msg) = super::receiver(listen_addr).unwrap().recv().await{
    app.emit("listen_msg", msg).map_err(|e| e.to_string())?;
  }
  Ok(())
}

#[tauri::command]
pub async fn xsocket_close(listen_addr: &str) -> Result<(), String>{
  super::close(listen_addr);
  Ok(())
}

#[tauri::command]
pub async fn start_speed_test(target: String, on_stats: ipc::Channel<super::speed_test::SpeedTestResult>) -> Result<super::speed_test::SpeedTestResult, String> {
    super::speed_test::start_speed_test(target, on_stats).await.map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn stop_speed_test() -> Result<(), String> {
    super::speed_test::stop_speed_test().await;
    Ok(())
}

#[tauri::command]
pub async fn listen_speed_test(on_cb: ipc::Channel<String>) -> Result<(), String> {
    super::speed_test::listen_speed_test(on_cb).await.map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn stop_listen_speed_test(addr: String) -> Result<(), String> {
    super::speed_test::stop_listen_speed_test(addr).await.map_err(|e| e.to_string())
}
