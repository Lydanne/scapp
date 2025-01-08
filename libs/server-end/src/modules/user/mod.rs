use nidrs::macros::module;

pub mod controller;
pub mod dto;
pub mod service;

use crate::models::dao::users::UserEntity;
use controller::UserController;
use service::UserService;
use crate::interceptors::AuthInterceptor;
use crate::modules::auth::AuthModule;

#[module({
  imports: [AuthModule],
  controllers: [UserController],
  interceptors: [AuthInterceptor],
  services: [UserService, UserEntity],
  exports: [UserService],
})]
pub struct UserModule;
