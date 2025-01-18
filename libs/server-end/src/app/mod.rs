use nidrs::macros::module;
use nidrs_diesel::{DieselModule, DieselOptions};
use nidrs_diesel::sqlite::SqlitePoolManager;

pub mod controller;
pub mod dto;
pub mod exception;
pub mod service;

use crate::modules::auth::AuthModule;
use crate::modules::user::UserModule;
use crate::modules::room::RoomModule;
use controller::AppController;
use service::AppService;

#[module({
    imports: [
        DieselModule::for_root(DieselOptions{
            driver: SqlitePoolManager::new(std::env::var("DATABASE_URL").unwrap()),
        }),
        UserModule,
        AuthModule,
        RoomModule,
    ],
    controllers: [AppController],
    services: [AppService],
    exports: [AppService],
})]
pub struct AppModule;
