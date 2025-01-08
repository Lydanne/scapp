use nidrs::macros::module;

pub mod controller;
pub mod dto;
pub mod service;

use controller::AuthController;
use service::AuthService;

use crate::modules::user::UserModule;
use crate::interceptors::AuthInterceptor;
use crate::models::dao::users::UserEntity;

#[module({
  imports: [UserModule],
  controllers: [AuthController],
  interceptors: [AuthInterceptor],
  services: [AuthService, UserEntity],
  exports: [AuthService],
})]
pub struct AuthModule;
