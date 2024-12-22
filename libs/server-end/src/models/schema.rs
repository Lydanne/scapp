// @generated automatically by Diesel CLI.

diesel::table! {
    members (id) {
        id -> Integer,
        user_id -> Integer,
        room_id -> Integer,
        status -> Integer,
        created_at -> Timestamp,
        updated_at -> Timestamp,
        deleted_at -> Nullable<Timestamp>,
    }
}

diesel::table! {
    packets (id) {
        id -> Integer,
        data -> Text,
        progress -> Integer,
        err_code -> Text,
        err_msg -> Text,
        to_user_id -> Integer,
        from_user_id -> Integer,
        room_id -> Integer,
        created_at -> Timestamp,
        updated_at -> Timestamp,
        deleted_at -> Nullable<Timestamp>,
    }
}

diesel::table! {
    rooms (id) {
        id -> Integer,
        name -> Text,
        num -> Integer,
        avatar -> Text,
        ip -> Text,
        connect_count -> Integer,
        status -> Integer,
        creator_id -> Integer,
        last_visit_at -> Nullable<Timestamp>,
        created_at -> Timestamp,
        updated_at -> Timestamp,
        deleted_at -> Nullable<Timestamp>,
    }
}

diesel::table! {
    users (id) {
        id -> Integer,
        name -> Text,
        server_id -> Text,
        platform -> Text,
        unionid -> Text,
        openid -> Text,
        derive -> Text,
        avatar -> Text,
        ip -> Text,
        last_visit_at -> Nullable<Timestamp>,
        created_at -> Timestamp,
        updated_at -> Timestamp,
        deleted_at -> Nullable<Timestamp>,
    }
}

diesel::joinable!(members -> rooms (room_id));
diesel::joinable!(members -> users (user_id));
diesel::joinable!(packets -> rooms (room_id));
diesel::joinable!(rooms -> users (creator_id));

diesel::allow_tables_to_appear_in_same_query!(
    members,
    packets,
    rooms,
    users,
);
