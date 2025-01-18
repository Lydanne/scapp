use crate::models::schema::members;
use nidrs_diesel::sqlite::SqlitePoolManager;
use diesel_async::RunQueryDsl;
use chrono::NaiveDateTime;
use diesel::prelude::*;
use serde::{Deserialize, Serialize};
use nidrs::{injectable, openapi::schema, AppResult, Inject};


#[schema]
#[derive(Selectable, Queryable, Debug, Serialize)]
#[diesel(table_name = members)]
#[diesel(check_for_backend(diesel::sqlite::Sqlite))]
pub struct Member {
    pub id: i32,
    pub user_id: i32,
    pub room_id: i32,
    pub status: i32, // 0: 正常 1: 离开 2: 踢出 3: 禁言 4: 拉黑
    pub created_at: NaiveDateTime,
    pub updated_at: NaiveDateTime,
    pub deleted_at: Option<NaiveDateTime>,
}

#[schema]
#[derive(Insertable, AsChangeset, Serialize, Deserialize)]
#[diesel(table_name = members)]
pub struct CreateMember {
    pub user_id: i32,
    pub room_id: i32,
    pub status: i32,
} 



#[injectable()]
pub struct MemberEntity {
    pool: Inject<SqlitePoolManager>,
}

impl MemberEntity {
    pub async fn create(&self, new_member: CreateMember) -> AppResult<usize> {
        self.pool
            .query(move|mut conn| async move {
                diesel::insert_into(members::table)
                    .values(&new_member)
                    .execute(&mut conn).await
            })
            .await
    }

    pub async fn find_by_id(&self, id: i32) -> AppResult<Member> {
        self.pool
            .query(move |mut conn| {
                members::table.find(id).first(&mut conn)
            })
            .await
    }

    pub async fn find_by_room_id(&self, room_id: i32) -> AppResult<Vec<Member>> {
        self.pool
            .query(move |mut conn| {
                members::table
                    .filter(members::room_id.eq(room_id))
                    .load(&mut conn)
            })
            .await
    }

    pub async fn find_by_user_id(&self, room_id: i32, user_id: i32) -> AppResult<Member> {
        self.pool
            .query(move |mut conn| {
                members::table
                    .filter(members::room_id.eq(room_id))
                    .filter(members::user_id.eq(user_id))
                    .first(&mut conn)
            })
            .await
    }

    pub async fn update(&self, id: i32, update_member: CreateMember) -> AppResult<usize> {
        self.pool
            .query(move |mut conn| {
                diesel::update(members::table.find(id))
                    .set(update_member)
                    .execute(&mut conn)
            })
            .await
    }
}