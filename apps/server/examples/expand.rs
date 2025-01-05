#![feature(print_internals)]
#![feature(panic_internals)]
#![feature(alloc)]
#![feature(fmt_helpers_for_derive)]
#![allow(warnings, unused)]
#![feature(hint_must_use)]
#![feature(liballoc_internals)]
// >>Push: Global("app") -- [None]
//  CMETA: []
// >>Push: Module("DieselModule") -- [None]
// >>Push: Service("SqlitePoolManager") -- [Some(String("DieselModule"))]
//  CMETA: ["ServiceType"]
//  CMETA: ["ServiceName"]
// service_derive "SqlitePoolManager"
// << Pop: Some(Service("SqlitePoolManager")) ["ServiceType", "service", "ServiceName", "module", "global"]

// >>Push: Service("DieselService") -- [Some(String("DieselModule"))]
//  CMETA: ["ServiceType"]
//  CMETA: ["ServiceName"]
// service_derive "DieselService"
// << Pop: Some(Service("DieselService")) ["ServiceType", "ServiceName", "service", "module", "global"]

// >>Push: Service("DieselModule") -- [Some(String("DieselModule"))]
//  CMETA: ["Global"]
//  CMETA: ["__"]
// module "DieselModule"
// >>Push: Global("app") -- [None]
//  CMETA: []
// >>Push: Module("AppModule") -- [None]
// >>Push: Service("AppController") -- [Some(String("AppModule"))]
//  CMETA: ["ServiceType"]
//  CMETA: ["ServiceName"]
//  CMETA: ["ControllerPath"]
// service_derive "AppController"
// >>Push: Handler("get_hello_world") -- [Some(String("AppModule"))]
//  CMETA: ["datasets::role::Role::User"]
//  CMETA: ["RouterName"]
//  CMETA: ["RouterMethod"]
//  CMETA: ["RouterPath"]
// route_derive "get_hello_world"
// << Pop: Some(Handler("get_hello_world")) ["handler", "RouterPath", "RouterName", "datasets::role::Role::User", "RouterMethod", "ServiceType", "ControllerPath", "service", "ServiceName", "module", "global"]

// << Pop: Some(Service("AppController")) ["ServiceType", "ControllerPath", "service", "ServiceName", "module", "global"]

// >>Push: Service("AppService") -- [Some(String("AppModule"))]
//  CMETA: ["ServiceType"]
//  CMETA: ["ServiceName"]
// service_derive "AppService"
// << Pop: Some(Service("AppService")) ["service", "ServiceName", "ServiceType", "module", "global"]

// >>Push: Service("AppModule") -- [Some(String("AppModule"))]
//  CMETA: ["__"]
// module "AppModule"
// << Pop: Some(Service("AppModule")) ["__", "service", "module", "global"]

// >>Push: Service("UserEntity") -- [Some(String("AppModule"))]
//  CMETA: ["ServiceType"]
//  CMETA: ["ServiceName"]
// service_derive "UserEntity"
// << Pop: Some(Service("UserEntity")) ["ServiceName", "service", "ServiceType", "module", "global"]

// << Pop: Some(Module("AppModule")) ["module", "global"]

// >>Push: Module("UserModule") -- [None]
// >>Push: Service("UserController") -- [Some(String("UserModule"))]
//  CMETA: ["ServiceType"]
//  CMETA: ["ServiceName"]
//  CMETA: ["ControllerPath"]
// service_derive "UserController"
// >>Push: Handler("login") -- [Some(String("UserModule"))]
//  CMETA: ["RouterOut", "RouterIn"]
//  CMETA: ["RouterName"]
//  CMETA: ["RouterMethod"]
//  CMETA: ["RouterPath"]
// route_derive "login"
// << Pop: Some(Handler("login")) ["RouterName", "handler", "RouterMethod", "RouterPath", "RouterIn", "RouterOut", "ServiceType", "ServiceName", "service", "ControllerPath", "module", "global"]

// >>Push: Handler("info") -- [Some(String("UserModule"))]
//  CMETA: ["RouterOut", "RouterIn"]
//  CMETA: ["RouterName"]
//  CMETA: ["RouterMethod"]
//  CMETA: ["RouterPath"]
// route_derive "info"
// << Pop: Some(Handler("info")) ["RouterIn", "RouterMethod", "RouterName", "RouterPath", "handler", "RouterOut", "ServiceType", "ServiceName", "service", "ControllerPath", "module", "global"]

// >>Push: Handler("user_info_by_id") -- [Some(String("UserModule"))]
//  CMETA: ["RouterIn", "RouterOut"]
//  CMETA: ["RouterName"]
//  CMETA: ["RouterMethod"]
//  CMETA: ["RouterPath"]
// route_derive "user_info_by_id"
// << Pop: Some(Handler("user_info_by_id")) ["RouterPath", "handler", "RouterIn", "RouterMethod", "RouterOut", "RouterName", "ServiceType", "ServiceName", "service", "ControllerPath", "module", "global"]

// << Pop: Some(Service("UserController")) ["ServiceType", "ServiceName", "service", "ControllerPath", "module", "global"]

// >>Push: Service("UserService") -- [Some(String("UserModule"))]
//  CMETA: ["ServiceType"]
//  CMETA: ["ServiceName"]
// service_derive "UserService"
// << Pop: Some(Service("UserService")) ["ServiceName", "service", "ServiceType", "module", "global"]

// >>Push: Service("UserModule") -- [Some(String("UserModule"))]
//  CMETA: ["__"]
// module "UserModule"
// << Pop: Some(Service("UserModule")) ["__", "service", "module", "global"]

// << Pop: Some(Module("UserModule")) ["module", "global"]

// >>Push: Module("AuthModule") -- [None]
// >>Push: Service("AuthController") -- [Some(String("AuthModule"))]
//  CMETA: ["ServiceType"]
//  CMETA: ["ServiceName"]
//  CMETA: ["ControllerPath"]
// service_derive "AuthController"
// >>Push: Handler("wxlogin") -- [Some(String("AuthModule"))]
//  CMETA: ["RouterIn", "RouterOut"]
//  CMETA: ["RouterName"]
//  CMETA: ["RouterMethod"]
//  CMETA: ["RouterPath"]
// route_derive "wxlogin"
// << Pop: Some(Handler("wxlogin")) ["RouterName", "RouterIn", "RouterMethod", "handler", "RouterOut", "RouterPath", "ServiceType", "ServiceName", "ControllerPath", "service", "module", "global"]

// << Pop: Some(Service("AuthController")) ["ServiceType", "ServiceName", "ControllerPath", "service", "module", "global"]

// >>Push: Service("AuthModule") -- [Some(String("AuthModule"))]
//  CMETA: ["__"]
// module "AuthModule"
#![feature(prelude_import)]
#[prelude_import]
use std::prelude::rust_2024::*;
#[macro_use]
extern crate std;
pub use nidrs::AppError;
pub use nidrs::AppResult;
fn main() {
    dotenvy::dotenv();
    let app = nidrs::NidrsFactory::create(server_end::app::AppModule);
    let app = app.default_prefix("/api/{version}");
    let app = app.default_version("v1");
    app.listen(3000).block();
}
pub mod import {}
extern crate alloc;
