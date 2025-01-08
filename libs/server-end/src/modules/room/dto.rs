use nidrs::openapi::schema;
use serde::{Deserialize, Serialize};

use crate::models::dao::rooms::Room;

#[schema]
#[derive(Debug, Serialize, Deserialize)]
pub struct CreateRoomDto {
    pub name: String,
    pub num: i32,
    pub avatar: String,
    pub ip: String,
    pub connect_count: i32,
    pub status: i32,
    pub creator_id: i32,
}

#[schema]
#[derive(Debug, Serialize)]
pub struct RoomResultDto {
    pub room: Room,
} 