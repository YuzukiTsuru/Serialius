mod commands;
mod state;

use commands::{list_ports, start_serial_read, stop_serial_read, write_serial};
use state::AppState;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .manage(AppState::default())
        .invoke_handler(tauri::generate_handler![
            list_ports,
            start_serial_read,
            stop_serial_read,
            write_serial,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
