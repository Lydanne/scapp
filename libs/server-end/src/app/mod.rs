use nidrs::macros::module;
use nidrs_diesel::{DieselModule, DieselOptions, SqlitePoolManager};

pub mod controller;
pub mod dto;
pub mod exception;
pub mod service;

use crate::modules::auth::AuthModule;
use crate::modules::user::UserModule;
use controller::AppController;
use service::AppService;

#[module({
    imports: [
        DieselModule::for_root(DieselOptions{
            // driver: PostgresPoolManager::new(std::env::var("DATABASE_URL").unwrap()),
            driver: SqlitePoolManager::new(std::env::var("DATABASE_URL").unwrap()),
        }),
        UserModule,
        AuthModule,
    ],
    controllers: [AppController],
    services: [AppService],
    exports: [AppService],
})]
pub struct AppModule;
