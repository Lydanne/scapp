/// 字符串转 md5
pub fn string_sign(s: &str) -> String {
    use std::collections::hash_map::DefaultHasher;
    use std::hash::{Hash, Hasher};
    let mut hasher = DefaultHasher::new();
    s.hash(&mut hasher);
    hasher.finish().to_string()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_string_sign() {
        let test_str = "hello world";
        let sign = string_sign(test_str);
        
        // 确保相同输入产生相同输出
        assert_eq!(sign, string_sign(test_str));
        
        // 确保不同输入产生不同输出
        assert_ne!(sign, string_sign("hello world!"));
        
        // 确保输出是有效的数字字符串
        assert!(sign.chars().all(|c| c.is_digit(10)));
        println!("sign: {}", sign);
    }
}
