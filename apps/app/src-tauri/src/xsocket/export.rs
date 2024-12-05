use tauri::Emitter;


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
