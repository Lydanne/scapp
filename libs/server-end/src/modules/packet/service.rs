use nidrs::{AppResult, Inject, injectable};

use crate::models::dao::packets::{CreatePacket, Packet, UpdatePacket};

use crate::models::dao::packets::PacketEntity;

use super::dto::{CreatePacketDto, UpdatePacketDto};

#[injectable]
pub struct PacketService {
    packet_entity: Inject<PacketEntity>,
}

impl PacketService {
    pub async fn create(&self, dto: CreatePacketDto) -> AppResult<Packet> {
        let packet = CreatePacket {
            data: dto.data,
            to_user_id: dto.to_user_id,
            from_user_id: dto.from_user_id,
            room_id: dto.room_id,
            ..Default::default()
        };
        self.packet_entity.create(packet).await
    }
    
    pub async fn find_by_id(&self, id: i32) -> AppResult<Packet> {
        self.packet_entity.find_by_id(id).await
    }

    pub async fn find_by_room_id(&self, room_id: i32) -> AppResult<Vec<Packet>> {
        self.packet_entity.find_by_room_id(room_id).await
    }

    pub async fn update(&self, id: i32, dto: UpdatePacketDto) -> AppResult<usize> {
        let packet = UpdatePacket {
            data: dto.data,
            progress: dto.progress,
            err_code: dto.err_code,
            err_msg: dto.err_msg,
            room_id: dto.room_id,
            ..Default::default()
        };
        self.packet_entity.update(id, packet).await
    }
    
    pub async fn find_by_to_user_id(&self, to_user_id: i32) -> AppResult<Vec<Packet>> {
        self.packet_entity.find_by_to_user_id(to_user_id).await
    }

    pub async fn find_unread_by_to_user_id(&self, to_user_id: i32) -> AppResult<Vec<Packet>> {
        self.packet_entity.find_unread_by_to_user_id(to_user_id).await
    }

    pub async fn find_by_from_user_id(&self, from_user_id: i32) -> AppResult<Vec<Packet>> {
        self.packet_entity.find_by_from_user_id(from_user_id).await
    }

    pub async fn read(&self, id: i32) -> AppResult<usize> {
        self.packet_entity.update(id, UpdatePacket {
            progress: 100,
            ..Default::default()
        }).await
    }

    pub async fn delete(&self, id: i32) -> AppResult<usize> {
        self.packet_entity.delete(id).await
    }
}

