use base64::Engine;

pub fn decode_4(body: Vec<u8>) -> String {
    let body = String::from_utf16(
        &body
            .chunks(2)
            .map(|chunk| u16::from_le_bytes([chunk[0], chunk[1]]))
            .collect::<Vec<u16>>(),
    )
    .unwrap_or_default();
    let body = base64::engine::general_purpose::STANDARD
        .decode(body)
        .unwrap();
    let body = String::from_utf8(body).unwrap_or_default();
    body
}

pub fn decode_2(body: Vec<u8>) -> String {
    let body = base64::engine::general_purpose::STANDARD
        .decode(body)
        .unwrap();
    let body = String::from_utf8(body).unwrap_or_default();
    body
}

pub fn encode_2(body: &str) -> Vec<u8> {
    let body = base64::engine::general_purpose::STANDARD.encode(body);
    let body = body.as_bytes().to_vec();
    body
}

pub fn encode_4(body: &str) -> Vec<u8> {
    let body = base64::engine::general_purpose::STANDARD.encode(body);
    let body = body
        .as_bytes()
        .iter()
        .flat_map(|&b| {
            let u16_bytes = [b as u8, 0];
            u16_bytes.to_vec()
        })
        .collect::<Vec<u8>>();
    body
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_encode_decode_4() {
        let original = "Hello";
        let encoded = encode_4(original);
        let decoded = decode_4(encoded);
        assert_eq!(decoded, original);
    }

    #[test]
    fn test_encode_decode_2() {
        let original = "Hello";
        let encoded = encode_2(original);
        let decoded = decode_2(encoded);
        assert_eq!(decoded, original);
    }

    #[test]
    fn test_encode_4_specific() {
        let input = "A";
        let encoded = encode_4(input);
        // 'A' 经过base64编码后是 'QQ=='，每个字符转换为UTF-16LE
        assert_eq!(encoded, vec![b'Q', 0, b'Q', 0, b'=', 0, b'=', 0]);
    }

    #[test]
    fn test_encode_2_specific() {
        let input = "A";
        let encoded = encode_2(input);
        // 'A' 经过base64编码后是 'QQ=='
        assert_eq!(encoded, "QQ==".as_bytes());
    }

    #[test]
    fn test_emoji() {
        let input = "🤣";
        let encoded = encode_4(input);
        let decoded = decode_4(encoded);
        assert_eq!(decoded, input);
    }

    #[test]
    fn test_emoji_2() {
        let input = [55, 0, 97, 0, 67, 0, 43, 0, 55, 0, 98, 0, 83, 0, 106, 0];
        let body = String::from_utf16(
            &input
                .chunks(2)
                .map(|chunk| u16::from_le_bytes([chunk[0], chunk[1]]))
                .collect::<Vec<u16>>(),
        )
        .unwrap_or_default();
        println!("{:?}", encode_4(&body));
        println!("{:?}", encode_4("🤣".into()));
        // let decoded = decode_4(input.to_vec());
        // assert_eq!(decoded, "🤣");
    }
}
