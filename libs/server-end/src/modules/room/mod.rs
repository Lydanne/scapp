use nidrs::macros::module;

pub mod controller;
pub mod dto;
pub mod service;

use crate::models::dao::rooms::RoomEntity;
use controller::RoomController;
use service::RoomService;
use crate::interceptors::AuthInterceptor;
use crate::modules::user::UserModule;

#[module({
    imports: [UserModule],
    controllers: [RoomController],
    interceptors: [AuthInterceptor],
    services: [RoomService, RoomEntity],
    exports: [RoomService],
})]
pub struct RoomModule; 