use nidrs::openapi::schema;
use serde::{Deserialize, Serialize};

use crate::models::dao::packets::Packet;

#[schema]
#[derive(Debug, Serialize, Deserialize)]
pub struct CreatePacketDto {
    pub name: String,
    pub price: i32,
    pub description: String,
}