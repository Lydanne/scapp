use super::dto::CreateRoomDto;
use crate::models::dao::members::{CreateMember, Member, MemberEntity};
use crate::models::dao::rooms::{CreateRoom, Room, RoomEntity};
use crate::models::dao::users::User;
use nidrs::externs::anyhow;
use nidrs::externs::axum::http::StatusCode;
use nidrs::macros::injectable;
use nidrs::{throw, AppResult, Exception, Inject};

#[injectable()]
pub struct RoomService {
    room_entity: Inject<RoomEntity>,
    member_entity: Inject<MemberEntity>,
}

impl RoomService {
    pub async fn create_room(&self, dto: CreateRoomDto, creator_id: i32) -> AppResult<Room> {
        let count = self
            .room_entity
            .create(CreateRoom {
                num: dto.num,
                avatar: dto.avatar,
                ip: dto.ip,
                connect_count: dto.connect_count,
                status: dto.status,
                creator_id: creator_id,
                name: dto.name,
            })
            .await?;
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

    pub async fn get_room_members(&self, room_id: i32) -> AppResult<Vec<Member>> {
        let members = self.member_entity.find_by_room_id(room_id).await?;
        Ok(members)
    }

    pub async fn join_room(&self, room_id: i32, user: User) -> AppResult<Member> {
        let member = self
            .member_entity
            .create(CreateMember {
                room_id: room_id,
                user_id: user.id,
                status: 0,
            })
            .await?;
        if member == 0 {
            throw!(Exception::new(
                StatusCode::INTERNAL_SERVER_ERROR,
                anyhow::Error::msg("Error")
            ));
        }
        let member = self.member_entity.find_by_user_id(room_id, user.id).await?;
        Ok(member)
    }

    pub async fn leave_room(&self, room_id: i32, user: User) -> AppResult<Member> {
        let mut member = self.member_entity.find_by_user_id(room_id, user.id).await?;
        if member.status == 1 {
            throw!(Exception::new(
                StatusCode::BAD_REQUEST,
                anyhow::Error::msg("You are not a member of this room")
            ));
        }
        let update_member = CreateMember {
            room_id: member.room_id,
            user_id: member.user_id,
            status: 1,
        };
        member.status = 1;
        let update_count = self.member_entity.update(member.id, update_member).await?;
        if update_count == 0 {
            throw!(Exception::new(
                StatusCode::INTERNAL_SERVER_ERROR,
                anyhow::Error::msg("Error")
            ));
        }

        Ok(member)
    }

    pub async fn invite_member(&self, room_id: i32, user: User) -> AppResult<Member> {
        let member = self.member_entity.find_by_user_id(room_id, user.id).await?;
        if member.status == 0 {
            throw!(Exception::new(
                StatusCode::BAD_REQUEST,
                anyhow::Error::msg("You are already a member of this room")
            ));
        }
        let count = self
            .member_entity
            .create(CreateMember {
                room_id: room_id,
                user_id: user.id,
                status: 0,
            })
            .await?;
        if count == 0 {
            throw!(Exception::new(
                StatusCode::INTERNAL_SERVER_ERROR,
                anyhow::Error::msg("Error")
            ));
        }
        let member = self.member_entity.find_by_user_id(room_id, user.id).await?;
        Ok(member)
    }
}

