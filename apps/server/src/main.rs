
pub use nidrs::AppError;
pub use nidrs::AppResult;

#[nidrs::main]
fn main() {
    dotenvy::dotenv();

    let app = nidrs::NidrsFactory::create(server_end::app::AppModule);

    let app = app.default_prefix("/api/{version}");
    let app = app.default_version("v1");

    app.listen(3000).block();
}
