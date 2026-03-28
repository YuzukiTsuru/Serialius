mod commands;
mod line_buffer;
mod mcp;
mod state;

use commands::{
    append_log_file, get_mcp_status, list_ports, set_log_path, start_mcp_server, start_serial_read,
    stop_mcp_server, stop_serial_read, write_serial,
};
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
            append_log_file,
            set_log_path,
            start_mcp_server,
            stop_mcp_server,
            get_mcp_status,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
