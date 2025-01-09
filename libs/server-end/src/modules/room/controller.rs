use nidrs::macros::{controller, get, uses, post};
use nidrs::openapi::{api, api_security};
use nidrs::{throw, AppResult, Inject};
use nidrs_extern::axum::extract::Path;
use nidrs_extern::axum::Json;

use crate::extractor::active_user::ActiveUser;
use crate::interceptors::AuthInterceptor;
use crate::models::dao::members::Member;
use crate::models::dao::rooms::Room;
use super::dto::{CreateRoomDto, RoomResultDto};
use super::service::RoomService;

#[controller("/room")]
pub struct RoomController {
    room_service: Inject<RoomService>,
}

impl RoomController {
    #[api]
    #[api_security("$bearer")]
    #[uses(AuthInterceptor)]
    #[post("/create")]
    pub async fn create(&self, user: ActiveUser, dto: Json<CreateRoomDto>) -> AppResult<Json<RoomResultDto>> {
        let room = self.room_service.create_room(dto.0, user.0.id).await?;
        Ok(Json(RoomResultDto { room }))
    }

    #[api]
    #[get("/:id")]
    pub async fn get_room(&self, id: Path<i32>) -> AppResult<Json<Room>> {
        let room = self.room_service.get_room_by_id(id.0).await?;
        Ok(Json(room))
    }

    #[api]
    #[api_security("$bearer")]
    #[uses(AuthInterceptor)]
    #[get("/:id/members")]
    pub async fn get_room_members(&self, id: Path<i32>, user: ActiveUser) -> AppResult<Json<Vec<Member>>> {
        let members = self.room_service.get_room_members(id.0).await?;
        if !members.iter().any(|m| m.user_id == user.0.id) {
          throw!(nidrs::Exception::new(
            nidrs_extern::axum::http::StatusCode::FORBIDDEN,
            nidrs_extern::anyhow::Error::msg("You are not a member of this room")
          ));
        }
        Ok(Json(members))
    }

    #[api]
    #[api_security("$bearer")]
    #[uses(AuthInterceptor)]
    #[post("/:id/join")]
    pub async fn join_room(&self, id: Path<i32>, user: ActiveUser) -> AppResult<Json<Member>> {
        let member = self.room_service.join_room(id.0, user.0).await?;
        Ok(Json(member))
    }

    #[api]
    #[api_security("$bearer")]
    #[uses(AuthInterceptor)]
    #[post("/:id/leave")]
    pub async fn leave_room(&self, id: Path<i32>, user: ActiveUser) -> AppResult<Json<Member>> {
        let member = self.room_service.leave_room(id.0, user.0).await?;
        Ok(Json(member))
    }

    
    /// 拉人加入房间
    #[api]
    #[api_security("$bearer")]
    #[uses(AuthInterceptor)]
    #[post("/:id/invite")]
    pub async fn invite_member(&self, id: Path<i32>, user: ActiveUser) -> AppResult<Json<Member>> {
        let member = self.room_service.invite_member(id.0, user.0).await?;
        Ok(Json(member))
    }
} 