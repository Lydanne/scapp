#![feature(print_internals)]
#![feature(panic_internals)]
#![feature(alloc)]
#![feature(fmt_helpers_for_derive)]
#![allow(warnings, unused)]
#![feature(hint_must_use)]
#![feature(liballoc_internals)]
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
// route_derive is_tuple true
// << Pop: Some(Handler("get_hello_world")) ["handler", "RouterMethod", "datasets::role::Role::User", "RouterName", "RouterPath", "service", "ServiceType", "ServiceName", "ControllerPath", "module", "global"]

// << Pop: Some(Service("AppController")) ["service", "ServiceType", "ServiceName", "ControllerPath", "module", "global"]

// >>Push: Service("AppService") -- [Some(String("AppModule"))]
//  CMETA: ["ServiceType"]
//  CMETA: ["ServiceName"]
// service_derive "AppService"
// << Pop: Some(Service("AppService")) ["service", "ServiceName", "ServiceType", "module", "global"]

// >>Push: Service("AppModule") -- [Some(String("AppModule"))]
//  CMETA: ["__"]
// module "AppModule"
// << Pop: Some(Service("AppModule")) ["__", "service", "module", "global"]

// >>Push: Service("DownlogEntity") -- [Some(String("AppModule"))]
//  CMETA: ["ServiceType"]
//  CMETA: ["ServiceName"]
// service_derive "DownlogEntity"
// << Pop: Some(Service("DownlogEntity")) ["ServiceName", "service", "ServiceType", "module", "global"]

// >>Push: Service("ResourceEntity") -- [Some(String("AppModule"))]
//  CMETA: ["ServiceType"]
//  CMETA: ["ServiceName"]
// service_derive "ResourceEntity"
// << Pop: Some(Service("ResourceEntity")) ["ServiceType", "service", "ServiceName", "module", "global"]

// >>Push: Service("RoomEntity") -- [Some(String("AppModule"))]
//  CMETA: ["ServiceType"]
//  CMETA: ["ServiceName"]
// service_derive "RoomEntity"
// << Pop: Some(Service("RoomEntity")) ["ServiceType", "ServiceName", "service", "module", "global"]

// >>Push: Service("UserEntity") -- [Some(String("AppModule"))]
//  CMETA: ["ServiceType"]
//  CMETA: ["ServiceName"]
// service_derive "UserEntity"
// << Pop: Some(Service("UserEntity")) ["service", "ServiceName", "ServiceType", "module", "global"]

// >>Push: Service("UserExtraEntity") -- [Some(String("AppModule"))]
//  CMETA: ["ServiceType"]
//  CMETA: ["ServiceName"]
// service_derive "UserExtraEntity"
// << Pop: Some(Service("UserExtraEntity")) ["ServiceType", "ServiceName", "service", "module", "global"]

// << Pop: Some(Module("AppModule")) ["module", "global"]

// >>Push: Module("UserModule") -- [None]
// >>Push: Service("UserController") -- [Some(String("UserModule"))]
//  CMETA: ["ServiceType"]
//  CMETA: ["ServiceName"]
//  CMETA: ["ControllerPath"]
// service_derive "UserController"
// >>Push: Handler("register") -- [Some(String("UserModule"))]
//  CMETA: ["disable_auto_json"]
//  CMETA: ["RouterOut", "RouterIn"]
//  CMETA: ["RouterName"]
//  CMETA: ["RouterMethod"]
//  CMETA: ["RouterPath"]
// route_derive "register"
// route_derive is_tuple false
// << Pop: Some(Handler("register")) ["handler", "RouterMethod", "RouterPath", "disable_auto_json", "RouterIn", "RouterName", "RouterOut", "service", "ServiceName", "ControllerPath", "ServiceType", "module", "global"]

// << Pop: Some(Service("UserController")) ["service", "ServiceName", "ControllerPath", "ServiceType", "module", "global"]

// >>Push: Service("UserService") -- [Some(String("UserModule"))]
//  CMETA: ["ServiceType"]
//  CMETA: ["ServiceName"]
// service_derive "UserService"
// << Pop: Some(Service("UserService")) ["service", "ServiceType", "ServiceName", "module", "global"]

// >>Push: Service("UserModule") -- [Some(String("UserModule"))]
//  CMETA: ["__"]
// module "UserModule"
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
