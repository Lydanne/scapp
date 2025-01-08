use std::sync::{Arc, Mutex};

use nidrs::macros::injectable;
use nidrs::{AppError, AppResult, Exception, Inject};
use nidrs_extern::axum::http::StatusCode;

use crate::app::service::AppService;
use crate::models::dao::users::{CreateUser, User, UserEntity};

use super::dto::LoginDto;

#[injectable()]
pub struct UserService {
    user_entity: Inject<UserEntity>,
}

impl UserService {
    pub async fn get_user_by_id(&self, id: i32) -> AppResult<User> {
        let user = self.user_entity.find_by_id(id).await?;
        Ok(user)
    }
}
