use std::fs::File;
use std::io::{self, Read};
use md5::{Md5, Digest};

/// 对文件进行 MD5 签名计算
/// 使用分块读取方式，支持超大文件的高效计算
/// 
/// # Arguments
/// * `path` - 文件路径
/// 
pub fn file_sign(file: &mut File) -> String {
    let mut hasher = Md5::new();
    
    // 使用 8MB 的缓冲区，可以根据实际需求调整
    let mut buffer = [0; 8 * 1024 * 1024];

    loop {
        let bytes_read = file.read(&mut buffer).unwrap_or_default();
        if bytes_read == 0 {
            break;
        }
        hasher.update(&buffer[..bytes_read]);
    }

    hex::encode(hasher.finalize())
}