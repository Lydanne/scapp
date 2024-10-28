#[tauri::command]
pub fn net_local_ip() -> String {
    use local_ip_address::local_ip;
    match local_ip() {
        Ok(ip) => ip.to_string(),
        Err(_) => String::from("127.0.0.1"),
    }
}
