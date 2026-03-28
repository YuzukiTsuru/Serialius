use std::collections::hash_map::Entry;
use std::io::{Read, Write};
use std::sync::Arc;
use std::sync::atomic::{AtomicBool, Ordering};
use std::time::Duration;

use serde::{Deserialize, Serialize};
use tauri::{ipc::Channel, State};

use crate::state::{AppState, PortHandle};

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

#[tauri::command]
pub async fn list_ports() -> Result<Vec<PortInfoResponse>, String> {
    let ports = serialport::available_ports().map_err(|e| e.to_string())?;
    Ok(ports
        .into_iter()
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
        .collect())
}

#[tauri::command]
pub async fn start_serial_read(
    pane_id: String,
    config: SerialConfig,
    on_data: Channel<SerialChunk>,
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

    tokio::task::spawn_blocking(move || {
        let mut buf = vec![0u8; 4096];
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
            e.insert(PortHandle { write_tx, stop_flag });
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
    }
    Ok(())
}

#[tauri::command]
pub async fn append_log_file(path: String, data: Vec<u8>) -> Result<(), String> {
    use std::io::Write;
    std::fs::OpenOptions::new()
        .create(true)
        .append(true)
        .open(&path)
        .and_then(|mut f| f.write_all(&data))
        .map_err(|e| e.to_string())
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
            .send(data)
            .map_err(|e| e.to_string())?;
    }
    Ok(())
}
