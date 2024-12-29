use jsonwebtoken::{decode, encode, DecodingKey, EncodingKey, Header, Validation};
use serde::{Deserialize, Serialize};
use std::time::{SystemTime, UNIX_EPOCH};

#[derive(Debug, Serialize, Deserialize)]
pub struct Claims {
    pub sub: String,  // 用户ID
    pub exp: usize,   // 过期时间
    pub iat: usize,   // 签发时间
}

pub fn create_token(user_id: String) -> Result<String, jsonwebtoken::errors::Error> {
    let expiration = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap()
        .as_secs() as usize + 24 * 3600; // 24小时后过期

    let claims = Claims {
        sub: user_id,
        exp: expiration,
        iat: SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_secs() as usize,
    };

    let secret = std::env::var("JWT_SECRET").unwrap_or_else(|_| "sfexvelaevxetx".to_string());
    encode(
        &Header::default(),
        &claims,
        &EncodingKey::from_secret(secret.as_bytes()),
    )
}

pub fn verify_token(token: &str) -> Result<Claims, jsonwebtoken::errors::Error> {
    let secret = std::env::var("JWT_SECRET").unwrap_or_else(|_| "sfexvelaevxetx".to_string());
    
    let token_data = decode::<Claims>(
        token,
        &DecodingKey::from_secret(secret.as_bytes()),
        &Validation::default()
    )?;
    
    Ok(token_data.claims)
}


pub fn get_user_id_from_token(token: &str) -> Result<String, jsonwebtoken::errors::Error> {
    let claims = verify_token(token)?;
    Ok(claims.sub)
} 