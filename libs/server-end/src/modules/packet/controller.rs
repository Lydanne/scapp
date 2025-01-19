use nidrs::macros::{controller, get, uses};
use nidrs::openapi::{api, api_security};
use nidrs::{delete, post, put, AppResult, Inject};
use nidrs_extern::axum::extract::Path;
use nidrs_extern::axum::Json;

use crate::models::dao::packets::Packet;
use crate::modules::packet::dto::CreatePacketDto;
use crate::modules::packet::service::PacketService;

use super::dto::UpdatePacketDto;

use crate::interceptors::AuthInterceptor;
#[controller("/packet")]
pub struct PacketController {
    packet_service: Inject<PacketService>,
}

impl PacketController {
    /// 创建消息
    #[api]
    #[api_security("$bearer")]
    #[uses(AuthInterceptor)]
    #[post("/")]
    pub async fn create(&self, dto: Json<CreatePacketDto>) -> AppResult<Json<Packet>> {
        Ok(Json(self.packet_service.create(dto.0).await?))
    }

    /// 更新消息
    #[api]
    #[api_security("$bearer")]
    #[uses(AuthInterceptor)]
    #[put("/:id")]
    pub async fn update(&self, id: Path<i32>, dto: Json<UpdatePacketDto>) -> AppResult<String> {
        Ok(self.packet_service.update(id.0, dto.0).await?.to_string())
    }

    /// 获取单个消息
    #[api]
    #[api_security("$bearer")]
    #[uses(AuthInterceptor)]
    #[get("/:id")]
    pub async fn find_by_id(&self, id: Path<i32>) -> AppResult<Json<Packet>> {
        Ok(Json(self.packet_service.find_by_id(id.0).await?))
    }

    /// 获取房间的消息
    #[api]
    #[api_security("$bearer")]
    #[uses(AuthInterceptor)]
    #[get("/room/:room_id")]
    pub async fn find_by_room_id(&self, room_id: Path<i32>) -> AppResult<Json<Vec<Packet>>> {
        Ok(Json(self.packet_service.find_by_room_id(room_id.0).await?))
    }

    /// 获取接收的消息
    #[api]
    #[api_security("$bearer")]
    #[uses(AuthInterceptor)]
    #[get("/to_user/:to_user_id")]
    pub async fn find_by_to_user_id(&self, to_user_id: Path<i32>) -> AppResult<Json<Vec<Packet>>> {
        Ok(Json(self.packet_service.find_by_to_user_id(to_user_id.0).await?))
    }

    /// 获取发送的消息
    #[api]
    #[api_security("$bearer")]
    #[uses(AuthInterceptor)]
    #[get("/from_user/:from_user_id")]
    pub async fn find_by_from_user_id(&self, from_user_id: Path<i32>) -> AppResult<Json<Vec<Packet>>> {
        Ok(Json(self.packet_service.find_by_from_user_id(from_user_id.0).await?))
    }

    /// 获取未读的消息
    #[api]
    #[api_security("$bearer")]
    #[uses(AuthInterceptor)]
    #[get("/unread/:to_user_id")]
    pub async fn find_unread_by_to_user_id(&self, to_user_id: Path<i32>) -> AppResult<Json<Vec<Packet>>> {
        Ok(Json(self.packet_service.find_unread_by_to_user_id(to_user_id.0).await?))
    }

    /// 标记已读
    #[api]
    #[api_security("$bearer")]
    #[uses(AuthInterceptor)]
    #[put("/read/:id")]
    pub async fn read(&self, id: Path<i32>) -> AppResult<String> {
        Ok(self.packet_service.read(id.0).await?.to_string())
    }

    /// 删除消息
    #[api]
    #[api_security("$bearer")]
    #[uses(AuthInterceptor)]
    #[delete("/:id")]
    pub async fn delete(&self, id: Path<i32>) -> AppResult<String> {
        Ok(self.packet_service.delete(id.0).await?.to_string())
    }
}
