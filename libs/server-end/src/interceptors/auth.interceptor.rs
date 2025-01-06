use std::sync::Arc;

use jsonwebtoken::{decode, DecodingKey, Validation};
use nidrs::{injectable, AppError, AppResult, Exception, Inject, Interceptor};
use nidrs_extern::{anyhow, axum::{extract::{FromRequestParts, Request}, http::StatusCode, middleware::Next, response::IntoResponse, RequestExt}, axum_extra::{headers::{authorization::Bearer, Authorization}, TypedHeader}};

use crate::{modules::user::service::UserService, utils::jwt::get_user_id_from_token};

#[injectable]
pub struct AuthInterceptor{
    user_service: Inject<UserService>,
}

impl Interceptor for AuthInterceptor {
    async fn intercept(&self, mut req: Request, next: Next) -> AppResult<impl IntoResponse> {
        let mut parts = req.extract_parts().await.map_err(|_| {
            AppError::Exception(Exception::new(
                StatusCode::UNAUTHORIZED,
                anyhow::anyhow!("Invalid token format"),
            ))
        })?;
        
        let TypedHeader(Authorization(bearer)) = TypedHeader::<Authorization<Bearer>>::from_request_parts(&mut parts, &())
            .await
            .map_err(|_| {
                AppError::Exception(Exception::new(
                    StatusCode::UNAUTHORIZED,
                    anyhow::anyhow!("Invalid token format"),
                ))
            })?;

        let user_id = get_user_id_from_token(bearer.token()).map_err(|_| {
            AppError::Exception(Exception::new(
                StatusCode::UNAUTHORIZED,
                anyhow::anyhow!("Invalid token"),
            ))
        })?;

        let user_id = user_id.parse::<i32>().map_err(|_| {
            AppError::Exception(Exception::new(
                StatusCode::UNAUTHORIZED,
                anyhow::anyhow!("Invalid user ID in token"),
            ))
        })?;

        let user = self.user_service.get_user_by_id(user_id).await?;

        req.extensions_mut().insert(user);

        let res = next.run(req).await;

        Ok(res)
    }
}
