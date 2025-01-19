use nidrs::{AppResult, Inject, injectable};

use crate::models::dao::packets::{CreatePacket, Packet};

use crate::models::dao::packets::PacketEntity;

#[injectable]
pub struct PacketService {
    packet_entity: Inject<PacketEntity>,
}

impl PacketService {
   
}
