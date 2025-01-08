
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

use super::service::UserService;
use crate::utils::jwt::create_token;
use crate::interceptors::AuthInterceptor;

#[controller("/user")]
pub struct UserController {
    user_service: Inject<UserService>,
}

impl UserController {
    #[api]
    #[api_security("$bearer")]
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
