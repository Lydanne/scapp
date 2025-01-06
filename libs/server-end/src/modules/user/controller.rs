
use std::sync::Arc;

use nidrs::macros::{controller, get, uses};
use nidrs::openapi::{api, api_security};
use nidrs::{post, AppError, AppResult, Exception, Inject};
use nidrs_extern::anyhow;
use nidrs_extern::axum::extract::Path;
use nidrs_extern::axum::http::StatusCode;
use nidrs_extern::axum::Json;
use nidrs_macro::meta;

use crate::extractor::active_user::ActiveUser;
use crate::models::dao::users::{CreateUser, User};

use super::dto::{LoginDto, LoginTokenDto};
use super::service::UserService;
use crate::utils::jwt::create_token;
use crate::interceptors::AuthInterceptor;

#[controller("/user")]
pub struct UserController {
    user_service: Inject<UserService>,
}

impl UserController {
    #[api]
    #[post("/login")]
    pub async fn login(&self, dto: Json<LoginDto>) -> AppResult<Json<LoginTokenDto>> {
        let user = self.user_service.login(dto.0).await?;
        let token = create_token(user.id.to_string()).map_err(|_| AppError::Exception(
            Exception::new(StatusCode::INTERNAL_SERVER_ERROR, anyhow::anyhow!("Failed to create token"))
        ))?;
        
        Ok(Json(LoginTokenDto {
            token,
            user,
        }))
    }

    #[api]
    #[api_security]
    #[uses(AuthInterceptor)]
    #[get("/info")]
    pub async fn info(&self, user: ActiveUser) -> AppResult<Json<User>> {
        Ok(Json(user.0))
    }

    #[api]
    #[get("/:id/info")]
    pub async fn user_info_by_id(&self, id: Path<i32>) -> AppResult<Json<User>> {
        let user = self.user_service.get_user_by_id(id.0).await?;
        Ok(Json(user))
    }
}
