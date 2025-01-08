use nidrs::macros::{controller, get, uses, post};
use nidrs::openapi::{api, api_security};
use nidrs::{AppResult, Inject};
use nidrs_extern::axum::extract::Path;
use nidrs_extern::axum::Json;

use crate::extractor::active_user::ActiveUser;
use crate::interceptors::AuthInterceptor;
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
} 