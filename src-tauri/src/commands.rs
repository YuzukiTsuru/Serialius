use std::collections::hash_map::Entry;
use std::io::{Read, Write};
use std::sync::Arc;
use std::sync::atomic::{AtomicBool, Ordering};
use std::time::Duration;

use serde::{Deserialize, Serialize};
use tauri::{ipc::Channel, State};

use crate::line_buffer::LineBuffer;
use crate::state::{AppState, McpHandle, PortHandle};

#[derive(Serialize, Clone)]
pub struct SerialChunk {
    pub data: Vec<u8>,
}

#[derive(Serialize, Clone)]
pub struct PortInfoResponse {
    pub path: String,
    pub product: Option<String>,
    pub manufacturer: Option<String>,
    pub serial_number: Option<String>,
}

#[derive(Serialize, Clone)]
pub struct LogFileEntry {
    pub path: String,
    pub name: String,
    pub size: u64,
    pub modified: u64,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SerialConfig {
    pub path: String,
    pub baud_rate: u32,
    pub data_bits: u8,
    pub stop_bits: u8,
    pub parity: String,
    pub flow_control: String,
}

fn port_basename(path: &str) -> &str {
    path.rsplit('/').next().unwrap_or(path)
}

fn port_sort_key(path: &str) -> u8 {
    let name = port_basename(path);
    if name.starts_with("ttyUSB") || name.starts_with("ttyACM") {
        0
    } else if name.contains("usbserial") || name.contains("usbmodem") {
        1
    } else if name.starts_with("ttyS") {
        2
    } else {
        3
    }
}

fn is_filtered_port(path: &str) -> bool {
    let name = port_basename(path);
    name.starts_with("tty.debug")
        || name.starts_with("tty.Bluetooth")
        || name.starts_with("cu.debug")
        || name.starts_with("cu.Bluetooth")
}

fn append_to_file(path: &str, data: &[u8]) -> std::io::Result<()> {
    std::fs::OpenOptions::new()
        .create(true)
        .append(true)
        .open(path)
        .and_then(|mut f| f.write_all(data))
}

#[tauri::command]
pub async fn list_ports() -> Result<Vec<PortInfoResponse>, String> {
    let ports = serialport::available_ports().map_err(|e| e.to_string())?;
    let mut result: Vec<PortInfoResponse> = ports
        .into_iter()
        .filter(|p| !is_filtered_port(&p.port_name))
        .map(|p| {
            let (product, manufacturer, serial_number) = match p.port_type {
                serialport::SerialPortType::UsbPort(usb) => {
                    (usb.product, usb.manufacturer, usb.serial_number)
                }
                _ => (None, None, None),
            };
            PortInfoResponse {
                path: p.port_name,
                product,
                manufacturer,
                serial_number,
            }
        })
        .collect();
    result.sort_by_key(|p| port_sort_key(&p.path));
    Ok(result)
}

#[tauri::command]
pub async fn start_serial_read(
    pane_id: String,
    config: SerialConfig,
    on_data: Channel<SerialChunk>,
    log_path: Option<String>,
    state: State<'_, AppState>,
) -> Result<(), String> {
    // Check for duplicate without holding the lock during blocking I/O
    {
        let ports = state.ports.lock().await;
        if ports.contains_key(&pane_id) {
            return Err(format!("Port already open for pane {pane_id}"));
        }
    }

    let data_bits = match config.data_bits {
        5 => serialport::DataBits::Five,
        6 => serialport::DataBits::Six,
        7 => serialport::DataBits::Seven,
        _ => serialport::DataBits::Eight,
    };
    let stop_bits = if config.stop_bits == 2 {
        serialport::StopBits::Two
    } else {
        serialport::StopBits::One
    };
    let parity = match config.parity.as_str() {
        "odd" => serialport::Parity::Odd,
        "even" => serialport::Parity::Even,
        _ => serialport::Parity::None,
    };
    let flow_control = match config.flow_control.as_str() {
        "software" => serialport::FlowControl::Software,
        "hardware" => serialport::FlowControl::Hardware,
        _ => serialport::FlowControl::None,
    };

    // All blocking I/O happens outside the lock
    let port = serialport::new(&config.path, config.baud_rate)
        .data_bits(data_bits)
        .stop_bits(stop_bits)
        .parity(parity)
        .flow_control(flow_control)
        .timeout(Duration::from_millis(50))
        .open()
        .map_err(|e| e.to_string())?;

    let mut read_port = port.try_clone().map_err(|e| e.to_string())?;
    let mut write_port = port;

    let stop_flag = Arc::new(AtomicBool::new(false));
    let read_stop = stop_flag.clone();
    let (write_tx, write_rx) = std::sync::mpsc::sync_channel::<Vec<u8>>(32);

    let log_path_shared = Arc::new(std::sync::Mutex::new(log_path));
    let log_path_read = log_path_shared.clone();

    let line_buffers = state.line_buffers.clone();
    let port_path = config.path.clone();

    // Pre-insert buffer before the loop so the hot path avoids cloning port_path
    if let Ok(mut buffers) = line_buffers.lock() {
        buffers
            .entry(port_path.clone())
            .or_insert_with(|| LineBuffer::new(1000));
    }

    tokio::task::spawn_blocking(move || {
        let mut buf = vec![0u8; 4096];
        let mut log_file: Option<std::io::BufWriter<std::fs::File>> = None;
        let mut current_log_path: Option<String> = None;

        while !read_stop.load(Ordering::Relaxed) {
            match read_port.read(&mut buf) {
                Ok(n) if n > 0 => {
                    if on_data
                        .send(SerialChunk {
                            data: buf[..n].to_vec(),
                        })
                        .is_err()
                    {
                        break;
                    }
                    if let Ok(mut buffers) = line_buffers.try_lock() {
                        if let Some(lb) = buffers.get_mut(&port_path) {
                            lb.push_bytes(&buf[..n]);
                        }
                    }
                    if let Ok(guard) = log_path_read.try_lock() {
                        if *guard != current_log_path {
                            current_log_path = guard.clone();
                            log_file = current_log_path.as_ref().and_then(|p| {
                                std::fs::OpenOptions::new()
                                    .create(true)
                                    .append(true)
                                    .open(p)
                                    .map(std::io::BufWriter::new)
                                    .ok()
                            });
                        }
                    }
                    if let Some(ref mut w) = log_file {
                        let _ = w.write_all(&buf[..n]);
                    }
                }
                Err(ref e) if e.kind() == std::io::ErrorKind::TimedOut => {}
                Err(_) => break,
                _ => {}
            }
        }
    });

    tokio::task::spawn_blocking(move || loop {
        match write_rx.recv_timeout(Duration::from_millis(100)) {
            Ok(data) => {
                if write_port.write_all(&data).is_err() {
                    break;
                }
            }
            Err(std::sync::mpsc::RecvTimeoutError::Disconnected) => break,
            Err(std::sync::mpsc::RecvTimeoutError::Timeout) => {}
        }
    });

    // Re-acquire lock to insert; handle TOCTOU race with Entry API
    let mut ports = state.ports.lock().await;
    match ports.entry(pane_id) {
        Entry::Occupied(_) => {
            stop_flag.store(true, Ordering::Relaxed);
            Err("Port already open (race condition)".into())
        }
        Entry::Vacant(e) => {
            e.insert(PortHandle {
                write_tx,
                stop_flag,
                log_path: log_path_shared,
                port_path: config.path,
            });
            Ok(())
        }
    }
}

#[tauri::command]
pub async fn stop_serial_read(
    pane_id: String,
    state: State<'_, AppState>,
) -> Result<(), String> {
    let mut ports = state.ports.lock().await;
    if let Some(handle) = ports.remove(&pane_id) {
        handle.stop_flag.store(true, Ordering::Relaxed);
        if let Ok(mut buffers) = state.line_buffers.lock() {
            buffers.remove(&handle.port_path);
        }
    }
    Ok(())
}

#[tauri::command]
pub async fn set_log_path(
    pane_id: String,
    log_path: Option<String>,
    state: State<'_, AppState>,
) -> Result<(), String> {
    let ports = state.ports.lock().await;
    if let Some(handle) = ports.get(&pane_id) {
        if let Ok(mut guard) = handle.log_path.lock() {
            *guard = log_path;
        }
        Ok(())
    } else {
        Err(format!("No open port for pane {pane_id}"))
    }
}

#[tauri::command]
pub async fn append_log_file(path: String, data: Vec<u8>) -> Result<(), String> {
    append_to_file(&path, &data).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn write_serial(
    pane_id: String,
    data: Vec<u8>,
    state: State<'_, AppState>,
) -> Result<(), String> {
    let ports = state.ports.lock().await;
    if let Some(handle) = ports.get(&pane_id) {
        handle
            .write_tx
            .try_send(data)
            .map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[tauri::command]
pub async fn start_mcp_server(
    port: u16,
    api_key: String,
    state: State<'_, AppState>,
) -> Result<(), String> {
    let mut mcp = state.mcp.lock().await;
    if mcp.is_some() {
        return Err("MCP server already running".into());
    }

    let (shutdown_tx, shutdown_rx) = tokio::sync::oneshot::channel::<()>();
    let cancel = tokio_util::sync::CancellationToken::new();
    let cancel_clone = cancel.clone();
    let line_buffers = state.line_buffers.clone();
    let ports = state.ports.clone();

    tokio::spawn(async move {
        tokio::select! {
            result = crate::mcp::start_server(port, api_key, line_buffers, ports, cancel_clone) => {
                if let Err(e) = result {
                    eprintln!("MCP server error: {e}");
                }
            }
            _ = shutdown_rx => {
                cancel.cancel();
            }
        }
    });

    *mcp = Some(McpHandle { shutdown: shutdown_tx });
    Ok(())
}

#[tauri::command]
pub async fn stop_mcp_server(state: State<'_, AppState>) -> Result<(), String> {
    let mut mcp = state.mcp.lock().await;
    if let Some(handle) = mcp.take() {
        let _ = handle.shutdown.send(());
    }
    Ok(())
}

#[tauri::command]
pub async fn get_mcp_status(state: State<'_, AppState>) -> Result<bool, String> {
    let mcp = state.mcp.lock().await;
    Ok(mcp.is_some())
}

#[tauri::command]
pub async fn list_log_files(
    directory: String,
    port_name: Option<String>,
) -> Result<Vec<LogFileEntry>, String> {
    let dir = std::path::Path::new(&directory);
    let mut entries: Vec<LogFileEntry> = vec![];

    let read_dir = std::fs::read_dir(dir).map_err(|e| e.to_string())?;
    for entry in read_dir {
        let entry = entry.map_err(|e| e.to_string())?;
        let path = entry.path();

        if path.extension().map(|e| e == "log").unwrap_or(false) {
            let name = path.file_name().map(|n| n.to_string_lossy().into_owned()).unwrap_or_default();

            if let Some(ref port) = port_name {
                if !name.starts_with(port) {
                    continue;
                }
            }

            let metadata = entry.metadata().map_err(|e| e.to_string())?;
            let modified = metadata
                .modified()
                .ok()
                .and_then(|t| t.duration_since(std::time::UNIX_EPOCH).ok())
                .map(|d| d.as_secs())
                .unwrap_or(0);

            entries.push(LogFileEntry {
                path: path.to_string_lossy().into_owned(),
                name,
                size: metadata.len(),
                modified,
            });
        }
    }

    entries.sort_by(|a, b| b.modified.cmp(&a.modified));

    Ok(entries)
}
