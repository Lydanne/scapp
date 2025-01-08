use nidrs::macros::{controller, get};
use nidrs::openapi::api;
use nidrs::{post, AppError, AppResult, Exception, Inject};
use nidrs_extern::anyhow;
use nidrs_extern::axum::http::StatusCode;
use nidrs_extern::axum::Json;

use crate::utils::jwt::create_token;

use super::dto::{LoginDto, LoginTokenDto, WxLoginDto, WxLoginResDto};
use super::service::AuthService;

#[controller("/auth")]
pub struct AuthController {
    auth_service: Inject<AuthService>,
}

impl AuthController {
    #[api]
    #[post("/wxlogin")]
    pub async fn wxlogin(&self, dto: Json<WxLoginDto>) -> AppResult<Json<WxLoginResDto>> {
        // let openid = dto.appid.to_string();
        // let user = self.auth_service.login(openid).await?;
        Ok(Json(WxLoginResDto {
            openid: "oWxxx".to_string(),
        }))
    }

    #[api]
    #[post("/login")]
    pub async fn login(&self, dto: Json<LoginDto>) -> AppResult<Json<LoginTokenDto>> {
        let user = self.auth_service.login(dto.0).await?;
        let token = create_token(user.id.to_string()).map_err(|_| AppError::Exception(
            Exception::new(StatusCode::INTERNAL_SERVER_ERROR, anyhow::anyhow!("Failed to create token"))
        ))?;
        
        Ok(Json(LoginTokenDto {
            token,
            user,
        }))
    }

}
