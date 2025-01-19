use nidrs::macros::{controller, get};
use nidrs::openapi::api;
use nidrs::{post, AppResult, Inject};
use nidrs_extern::axum::Json;

use crate::models::dao::packets::Packet;
use crate::modules::packet::dto::CreatePacketDto;
use crate::modules::packet::service::PacketService;

#[controller("/packet")]
pub struct PacketController {
    packet_service: Inject<PacketService>,
}

impl PacketController {
    #[api]
    #[post("/create")]
    pub async fn create(&self, dto: Json<CreatePacketDto>) -> AppResult<Json<Packet>> {
        todo!()
    }
}
