use crate::models::schema::packets;
use chrono::NaiveDateTime;
use diesel::prelude::*;
use diesel_async::RunQueryDsl;
use nidrs::{injectable, AppResult, Inject};
use nidrs_diesel::{sqlite::SqlitePoolManager, AsyncQuery};
use serde::{Deserialize, Serialize};
use nidrs::openapi::schema;

#[schema]
#[derive(Selectable, Queryable, Debug, Serialize)]
#[diesel(table_name = packets)]
#[diesel(check_for_backend(diesel::sqlite::Sqlite))]
pub struct Packet {
    pub id: i32,
    pub data: String,
    pub progress: i32, // 1: 开始发送，[2, 98]: 发送中，99: 发送完成, 100: 已读
    pub err_code: String,
    pub err_msg: String,
    pub to_user_id: i32,
    pub from_user_id: i32,
    pub room_id: i32,
    pub created_at: NaiveDateTime,
    pub updated_at: NaiveDateTime,
    pub deleted_at: Option<NaiveDateTime>,
}

#[schema]
#[derive(Insertable, Serialize, Deserialize, Default)]
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

#[schema]
#[derive(AsChangeset, Serialize, Deserialize, Default)]
#[diesel(table_name = packets)]
pub struct UpdatePacket {
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

#[injectable]
pub struct PacketEntity {
    pool: Inject<SqlitePoolManager>,
}

impl PacketEntity {
    pub async fn create(&self, new_packet: CreatePacket) -> AppResult<Packet> {
        self.pool
            .query(move|mut conn| async move {
                diesel::insert_into(packets::table)
                    .values(&new_packet)
                    .returning(Packet::as_returning())
                    .get_result(&mut conn).await
            })
            .await
    }

    pub async fn find_by_id(&self, id: i32) -> AppResult<Packet> {
        self.pool
            .query(move |mut conn| async move {
                packets::table.find(id).first(&mut conn).await
            })
            .await
    }

    pub async fn find_by_room_id(&self, room_id: i32) -> AppResult<Vec<Packet>> {
        self.pool
            .query(move |mut conn| async move {
                packets::table.filter(packets::room_id.eq(room_id)).load(&mut conn).await
            })
            .await
    }

    pub async fn update(&self, id: i32, packet: UpdatePacket) -> AppResult<usize> {
        self.pool
            .query(move |mut conn| async move {
                diesel::update(packets::table.find(id)).set(&packet).execute(&mut conn).await
            })
            .await
    }

    pub async fn delete(&self, id: i32) -> AppResult<usize> {
        self.pool
            .query(move |mut conn| async move {
                diesel::delete(packets::table.find(id)).execute(&mut conn).await
            })
            .await
    }

    pub async fn find_by_to_user_id(&self, to_user_id: i32) -> AppResult<Vec<Packet>> {
        self.pool
            .query(move |mut conn| async move {
                packets::table.filter(packets::to_user_id.eq(to_user_id)).load(&mut conn).await
            })
            .await
    }

    pub async fn find_by_from_user_id(&self, from_user_id: i32) -> AppResult<Vec<Packet>> {
        self.pool
            .query(move |mut conn| async move {
                packets::table.filter(packets::from_user_id.eq(from_user_id)).load(&mut conn).await
            })
            .await
    }

    pub async fn find_unread_by_to_user_id(&self, to_user_id: i32) -> AppResult<Vec<Packet>> {
        self.pool
            .query(move |mut conn| async move {
                packets::table.filter(packets::to_user_id.eq(to_user_id)).filter(packets::progress.lt(100)).load(&mut conn).await
            })
            .await
    }
}