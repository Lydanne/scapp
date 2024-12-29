use nidrs::openapi::schema;
use serde::{Deserialize, Serialize};

use crate::models::dao::users::User;

#[schema]
#[derive(Debug, Serialize, Deserialize)]
pub struct LoginDto {
    pub name: String,
    pub server_id: String,
    pub platform: String,
    pub unionid: String,
    pub openid: String,
    pub derive: String,
    pub avatar: String,
    pub ip: String,
}

#[schema]
#[derive(Debug, Serialize)]
pub struct LoginTokenDto {
    pub token: String,
    pub user: User,
}
