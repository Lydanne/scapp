use base64::Engine;

pub fn decode(body: Vec<u8>) -> String {
    let body = base64::engine::general_purpose::STANDARD
        .decode(body)
        .unwrap();
    let body = String::from_utf8(body).unwrap_or_default();
    body
}

pub fn encode(body: &str) -> Vec<u8> {
    let body = base64::engine::general_purpose::STANDARD.encode(body);
    let body = body.as_bytes().to_vec();
    body
}
