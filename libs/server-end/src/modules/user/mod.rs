use nidrs::macros::module;

pub mod controller;
pub mod dto;
pub mod service;

use crate::models::dao::users::UserEntity;
use controller::UserController;
use service::UserService;
use crate::interceptors::AuthInterceptor;


#[module({
  imports: [],
  controllers: [UserController],
  interceptors: [AuthInterceptor],
  services: [UserService, UserEntity],
  exports: [UserService],
})]
pub struct UserModule;
