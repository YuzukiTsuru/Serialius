use std::collections::HashMap;
use std::sync::Arc;
use std::sync::atomic::AtomicBool;
use tokio::sync::Mutex;

use crate::line_buffer::LineBuffer;

pub type LineBuffers = Arc<std::sync::Mutex<HashMap<String, LineBuffer>>>;

pub struct PortHandle {
    pub write_tx: std::sync::mpsc::SyncSender<Vec<u8>>,
    pub stop_flag: Arc<AtomicBool>,
    pub log_path: Arc<std::sync::Mutex<Option<String>>>,
    pub port_path: String,
}

pub struct McpHandle {
    pub shutdown: tokio::sync::oneshot::Sender<()>,
}

pub struct AppState {
    pub ports: Mutex<HashMap<String, PortHandle>>,
    pub line_buffers: LineBuffers,
    pub mcp: Mutex<Option<McpHandle>>,
}

impl Default for AppState {
    fn default() -> Self {
        Self {
            ports: Mutex::new(HashMap::new()),
            line_buffers: Arc::new(std::sync::Mutex::new(HashMap::new())),
            mcp: Mutex::new(None),
        }
    }
}
