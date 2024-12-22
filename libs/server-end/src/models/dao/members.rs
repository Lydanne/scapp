use crate::models::schema::members;
use chrono::NaiveDateTime;
use diesel::prelude::*;
use serde::{Deserialize, Serialize};

#[derive(Selectable, Queryable, Debug, Serialize)]
#[diesel(table_name = members)]
#[diesel(check_for_backend(diesel::sqlite::Sqlite))]
pub struct Member {
    pub id: i32,
    pub user_id: i32,
    pub room_id: i32,
    pub status: i32,
    pub created_at: NaiveDateTime,
    pub updated_at: NaiveDateTime,
    pub deleted_at: Option<NaiveDateTime>,
}

#[derive(Insertable, Serialize, Deserialize)]
#[diesel(table_name = members)]
pub struct CreateMember {
    pub user_id: i32,
    pub room_id: i32,
    pub status: i32,
} 