use nidrs::macros::injectable;
use nidrs::{throw, AppResult, Exception, Inject};
use crate::models::dao::rooms::{CreateRoom, RoomEntity, Room};
use super::dto::CreateRoomDto;
use nidrs::externs::anyhow;
use nidrs::externs::axum::http::StatusCode;

#[injectable()]
pub struct RoomService {
    room_entity: Inject<RoomEntity>,
}

impl RoomService {
    pub async fn create_room(&self, dto: CreateRoomDto, creator_id: i32) -> AppResult<Room> {
        let count = self.room_entity.create(CreateRoom {
            num: dto.num,
            avatar: dto.avatar,
            ip: dto.ip,
            connect_count: dto.connect_count,
            status: dto.status,
            creator_id: creator_id,
            name: dto.name,
        }).await?;
        if count == 0 {
          throw!(Exception::new(
            StatusCode::INTERNAL_SERVER_ERROR,
            anyhow::Error::msg("Error")
          ));
        }
        let room = self.room_entity.find_by_num(dto.num).await?;

        Ok(room)
    }

    pub async fn get_room_by_id(&self, id: i32) -> AppResult<Room> {
        let room = self.room_entity.find_by_id(id).await?;
        Ok(room)
    }
} 