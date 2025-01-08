use crate::models::schema::rooms;
use chrono::NaiveDateTime;
use diesel::prelude::*;
use nidrs_diesel::{PoolManager, SqlitePoolManager};
use serde::{Deserialize, Serialize};
use nidrs::{injectable, openapi::schema, AppResult, Inject};

#[schema]
#[derive(Selectable, Queryable, Debug, Serialize)]
#[diesel(table_name = rooms)]
#[diesel(check_for_backend(diesel::sqlite::Sqlite))]
pub struct Room {
    pub id: i32,
    pub name: String,
    pub num: i32,
    pub avatar: String,
    pub ip: String,
    pub connect_count: i32,
    pub status: i32,
    pub creator_id: i32,
    pub last_visit_at: Option<NaiveDateTime>,
    pub created_at: NaiveDateTime,
    pub updated_at: NaiveDateTime,
    pub deleted_at: Option<NaiveDateTime>,
}

#[derive(Insertable, Serialize, Deserialize)]
#[diesel(table_name = rooms)]
pub struct CreateRoom {
    pub name: String,
    pub num: i32,
    pub avatar: String,
    pub ip: String,
    pub connect_count: i32,
    pub status: i32,
    pub creator_id: i32,
} 


#[injectable()]
pub struct RoomEntity {
    pool: Inject<SqlitePoolManager>,
}

impl RoomEntity {
    pub async fn create(&self, new_room: CreateRoom) -> AppResult<usize> {
        self.pool
            .query(move|mut conn| {
                diesel::insert_into(rooms::table)
                    .values(&new_room)
                    .execute(&mut conn)
            })
            .await
    }

    pub async fn find_by_id(&self, id: i32) -> AppResult<Room> {
        self.pool
            .query(move |mut conn| {
                rooms::table.find(id).first(&mut conn)
            })
            .await
    }
    

    pub async fn find_by_num(&self, num: i32) -> AppResult<Room> {
        self.pool
            .query(move |mut conn| {
                rooms::table.filter(rooms::num.eq(num)).first(&mut conn)
            })
            .await
    }
    
}
