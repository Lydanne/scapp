use crate::models::schema::rooms;
use nidrs_diesel::sqlite::SqlitePoolManager;
use chrono::NaiveDateTime;
use diesel::prelude::*;
use diesel_async::RunQueryDsl;
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
    pub async fn create(&self, new_room: CreateRoom) -> AppResult<Room> {
        self.pool
            .query(move|mut conn| async move {
                diesel::insert_into(rooms::table)
                    .values(&new_room)
                    .returning(Room::as_returning())
                    .get_result(&mut conn).await
            })
            .await
    }

    pub async fn find_by_id(&self, id: i32) -> AppResult<Room> {
        self.pool
            .query(move |mut conn| async move {
                rooms::table.find(id).first(&mut conn).await
            })
            .await
    }
    

    pub async fn find_by_num(&self, num: i32) -> AppResult<Room> {
        self.pool
            .query(move |mut conn| async move {
                rooms::table.filter(rooms::num.eq(num)).first(&mut conn).await
            })
            .await
    }
    
}
