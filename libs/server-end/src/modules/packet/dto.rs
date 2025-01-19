use nidrs::openapi::schema;
use serde::{Deserialize, Serialize};

use crate::models::dao::packets::Packet;

#[schema]
#[derive(Debug, Serialize, Deserialize)]
pub struct CreatePacketDto {
    pub data: String,
    pub to_user_id: i32,
    pub from_user_id: i32,
    pub room_id: i32,
}

#[schema]
#[derive(Debug, Serialize, Deserialize)]
pub struct UpdatePacketDto {
    pub data: String,
    pub progress: i32,
    pub err_code: String,
    pub err_msg: String,
    pub room_id: i32,
}