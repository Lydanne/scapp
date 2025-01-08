use std::sync::{Arc, Mutex};

use nidrs::macros::injectable;
use nidrs::{AppError, AppResult, Exception, Inject};
use nidrs_extern::anyhow;
use nidrs_extern::axum::http::StatusCode;

use crate::app::service::AppService;
use crate::models::dao::users::{CreateUser, User, UserEntity};

use super::dto::LoginDto;


#[injectable()]
pub struct AuthService {
    user_entity: Inject<UserEntity>,
}

impl AuthService {
    pub async fn login(&self, dto: LoginDto) -> AppResult<User> {
        let user = self.user_entity.find_by_openid(dto.platform.clone(), dto.unionid.clone(), dto.openid.clone()).await;
        if let Ok(user) = user {
            self.user_entity.update_last_visit_at(user.id).await?;
            return Ok(user);
        }

        let create_count = self.user_entity.create(CreateUser {
            name: dto.name,
            server_id: dto.server_id,
            platform: dto.platform.clone(),
            unionid: dto.unionid.clone(),
            openid: dto.openid.clone(),
            derive: dto.derive,
            avatar: dto.avatar,
            ip: dto.ip,
        }).await?;

        if create_count == 0 {
            return Err(AppError::Exception(Exception::new(StatusCode::BAD_REQUEST, anyhow::anyhow!("Failed to create user"))));
        }

        let user = self.user_entity.find_by_openid(dto.platform.clone(), dto.unionid.clone(), dto.openid.clone()).await?;
        return Ok(user);
    }
}
