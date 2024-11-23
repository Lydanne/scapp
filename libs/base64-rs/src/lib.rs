use wasm_bindgen::prelude::*;
use base64::Engine;

#[wasm_bindgen]
pub fn decode(body: &[u8]) -> String {
    let body = base64::engine::general_purpose::STANDARD
        .decode(body)
        .unwrap();
    let body = String::from_utf8(body).unwrap_or_default();
    body
}

#[wasm_bindgen]
pub fn encode(body: &str) -> Vec<u8> {
    let body = base64::engine::general_purpose::STANDARD.encode(body);
    let body = body.as_bytes().to_vec();
    body
}

#[wasm_bindgen]
pub fn str_encode(body: &str) -> String {
    let body = encode(body);
    let body = String::from_utf8(body).unwrap_or_default();
    body
}

#[wasm_bindgen]
pub fn str_decode(body: &str) -> String {
    let body = decode(body.as_bytes());
    body
}
