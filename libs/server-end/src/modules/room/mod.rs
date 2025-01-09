use nidrs::macros::module;

pub mod controller;
pub mod dto;
pub mod service;

use crate::models::dao::rooms::RoomEntity;
use crate::models::dao::members::MemberEntity;
use controller::RoomController;
use service::RoomService;
use crate::modules::auth::AuthModule;

#[module({
    imports: [AuthModule],
    controllers: [RoomController],
    services: [RoomService, RoomEntity, MemberEntity],
    exports: [RoomService],
})]
pub struct RoomModule; 