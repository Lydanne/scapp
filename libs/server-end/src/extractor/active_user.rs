use std::sync::Arc;

use nidrs::{AppError, Exception};
use nidrs_extern::{anyhow, axum::{async_trait, extract::FromRequestParts, http::{request::Parts, StatusCode}}};
use crate::models::dao::users::User;

pub struct ActiveUser(pub User);

#[async_trait]
impl<S> FromRequestParts<S> for ActiveUser
where
    S: Send + Sync,
{
    type Rejection = AppError;

    async fn from_request_parts(parts: &mut Parts, state: &S) -> Result<Self, Self::Rejection> {
      let user = parts.extensions.get::<User>();

      match user {
          Some(user) => Ok(ActiveUser(user.to_owned())),
          None => Err(AppError::Exception(Exception::new(StatusCode::UNAUTHORIZED, anyhow::anyhow!("User not found")))),
      }
    }
}
