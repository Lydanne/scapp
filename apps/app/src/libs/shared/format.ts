/**
 * 智能格式化文件大小
 * @param size 文件大小
 * @returns 格式化后的文件大小
 */
export function formatFileSize(size: number) {
  if (size > 1024 * 1024 * 1024) {
    return `${(size / 1024 / 1024 / 1024).toFixed(2)}GB`;
  } else if (size > 1024 * 1024) {
    return `${(size / 1024 / 1024).toFixed(2)}MB`;
  } else if (size > 1024) {
    return `${(size / 1024).toFixed(2)}KB`;
  }
  return `${size}B`;
}
