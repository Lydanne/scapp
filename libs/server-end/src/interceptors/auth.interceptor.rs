use std::sync::Arc;

use jsonwebtoken::{decode, DecodingKey, Validation};
use nidrs::{injectable, AppError, AppResult, Exception, Inject, Interceptor};
use nidrs_extern::{anyhow, axum::{extract::{FromRequestParts, Request}, http::StatusCode, middleware::Next, response::IntoResponse, RequestExt}, axum_extra::{headers::{authorization::Bearer, Authorization}, TypedHeader}};

use crate::modules::user::service::UserService;

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

        let token_data = decode::<serde_json::Value>(
            bearer.token(),
            &DecodingKey::from_secret("your-secret-key".as_ref()),
            &Validation::default(),
        )
        .map_err(|_| {
            AppError::Exception(Exception::new(
                StatusCode::UNAUTHORIZED,
                anyhow::anyhow!("Invalid token"),
            ))
        })?;

        let user_id = token_data
            .claims
            .get("sub")
            .and_then(|v| v.as_str())
            .and_then(|s| s.parse::<i32>().ok())
            .ok_or_else(|| {
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
