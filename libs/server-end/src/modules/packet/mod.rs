use nidrs::macros::module;

pub mod controller;
pub mod dto;
pub mod service;

use controller::PacketController;
use service::PacketService;

use crate::interceptors::AuthInterceptor;
use crate::models::dao::packets::PacketEntity;

#[module({
  controllers: [PacketController],
  interceptors: [AuthInterceptor],
  services: [PacketService, PacketEntity],
  exports: [PacketService],
})]
pub struct PacketModule;
