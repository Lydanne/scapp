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
    
    // 使用较小的缓冲区以避免内存问题
    let mut buffer = [0; 1024 * 1024]; // 1MB 缓冲区
    
    // 使用 Result 处理读取错误
    let result = loop {
        match file.read(&mut buffer) {
            Ok(bytes_read) => {
                if bytes_read == 0 {
                    break Ok(());
                }
                hasher.update(&buffer[..bytes_read]);
            }
            Err(e) => {
                break Err(e);
            }
        }
    };

    // 如果读取出错则返回空字符串
    if result.is_err() {
        return String::new();
    }

    hex::encode(hasher.finalize())
}