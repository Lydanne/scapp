use crate::models::schema::packets;
use chrono::NaiveDateTime;
use diesel::prelude::*;
use serde::{Deserialize, Serialize};

#[derive(Selectable, Queryable, Debug, Serialize)]
#[diesel(table_name = packets)]
#[diesel(check_for_backend(diesel::sqlite::Sqlite))]
pub struct Packet {
    pub id: i32,
    pub data: String,
    pub progress: i32,
    pub err_code: String,
    pub err_msg: String,
    pub to_user_id: i32,
    pub from_user_id: i32,
    pub room_id: i32,
    pub created_at: NaiveDateTime,
    pub updated_at: NaiveDateTime,
    pub deleted_at: Option<NaiveDateTime>,
}

#[derive(Insertable, Serialize, Deserialize)]
#[diesel(table_name = packets)]
pub struct CreatePacket {
    pub data: String,
    pub progress: i32,
    pub err_code: String,
    pub err_msg: String,
    pub to_user_id: i32,
    pub from_user_id: i32,
    pub room_id: i32,
} 