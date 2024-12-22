use crate::models::schema::rooms;
use chrono::NaiveDateTime;
use diesel::prelude::*;
use serde::{Deserialize, Serialize};

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