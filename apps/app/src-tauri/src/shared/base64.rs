use base64::Engine;

pub fn decode(body: Vec<u8>) -> Result<String, String> {
    let body = base64::engine::general_purpose::STANDARD
        .decode(body)
        .expect("Failed to decode base64");
    let body = String::from_utf8(body).unwrap_or_default();
    Ok(body)
}

pub fn encode(body: &str) -> Result<Vec<u8>, String> {
    let body = base64::engine::general_purpose::STANDARD.encode(body);
    let body = body.as_bytes().to_vec();
    Ok(body)
}
