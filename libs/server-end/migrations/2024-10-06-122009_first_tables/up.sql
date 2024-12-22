-- 用户表 - 存储用户基本信息
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(64) NOT NULL DEFAULT '',          -- 用户名
    server_id VARCHAR(32) NOT NULL DEFAULT '',     -- 服务器ID
    platform VARCHAR(20) NOT NULL DEFAULT '',      -- 平台
    unionid VARCHAR(64) NOT NULL DEFAULT '',       -- 固定ID
    openid VARCHAR(64) NOT NULL DEFAULT '',        -- 平台openid/uuid
    derive VARCHAR(100) NOT NULL DEFAULT '',       -- 来源
    avatar VARCHAR(255) NOT NULL DEFAULT '',       -- 头像
    ip VARCHAR(45) NOT NULL DEFAULT '',            -- IP地址
    last_visit_at TIMESTAMP,                      -- 最后访问时间
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,  -- 创建时间
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,  -- 更新时间
    deleted_at TIMESTAMP                          -- 删除时间
);
CREATE UNIQUE INDEX uk_unionid ON users(unionid);
CREATE INDEX idx_openid_platform ON users(openid, platform);

-- 房间表 - 存储聊天房间信息
CREATE TABLE rooms (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(64) NOT NULL DEFAULT '',          -- 房间名称
    num INTEGER NOT NULL,                          -- 房间号
    avatar VARCHAR(255) NOT NULL DEFAULT '',       -- 房间头像
    ip VARCHAR(45) NOT NULL DEFAULT '',            -- IP地址
    connect_count INTEGER NOT NULL DEFAULT 0,      -- 连接数
    status INTEGER NOT NULL DEFAULT 0,             -- 状态 0:在线 1:离线
    creator_id INTEGER NOT NULL,                   -- 创建者ID
    last_visit_at TIMESTAMP,                      -- 最后访问时间
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,  -- 创建时间
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,  -- 更新时间
    deleted_at TIMESTAMP,                         -- 删除时间
    FOREIGN KEY (creator_id) REFERENCES users(id)
);
CREATE UNIQUE INDEX uk_num ON rooms(num);
CREATE INDEX idx_creator_status ON rooms(creator_id, status);

-- 成员表 - 存储房间成员关系
CREATE TABLE members (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,                      -- 用户ID
    room_id INTEGER NOT NULL,                      -- 房间ID
    status INTEGER NOT NULL DEFAULT 0,             -- 状态 0:在线 1:离线
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,  -- 创建时间
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,  -- 更新时间
    deleted_at TIMESTAMP,                         -- 删除时间
    FOREIGN KEY (room_id) REFERENCES rooms(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
);
CREATE UNIQUE INDEX uk_room_user ON members(room_id, user_id);
CREATE INDEX idx_user_status ON members(user_id, status);

-- 消息包表 - 存储聊天消息
CREATE TABLE packets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    data JSON NOT NULL,                           -- 消息内容
    progress INTEGER NOT NULL DEFAULT 0,           -- 进度 0-100
    err_code VARCHAR(32) NOT NULL DEFAULT '',      -- 错误码
    err_msg VARCHAR(255) NOT NULL DEFAULT '',      -- 错误信息
    to_user_id INTEGER NOT NULL,                   -- 接收者ID
    from_user_id INTEGER NOT NULL,                 -- 发送者ID
    room_id INTEGER NOT NULL,                      -- 房间ID
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,  -- 创建时间
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,  -- 更新时间
    deleted_at TIMESTAMP,                         -- 删除时间
    FOREIGN KEY (room_id) REFERENCES rooms(id),
    FOREIGN KEY (to_user_id) REFERENCES users(id),
    FOREIGN KEY (from_user_id) REFERENCES users(id)
);
CREATE INDEX idx_room_created ON packets(room_id, created_at);
CREATE INDEX idx_to_user_created ON packets(to_user_id, created_at);
CREATE INDEX idx_from_user_created ON packets(from_user_id, created_at);