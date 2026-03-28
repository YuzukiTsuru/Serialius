use std::collections::HashMap;
use std::sync::Arc;
use std::sync::atomic::AtomicBool;
use tokio::sync::Mutex;

pub struct PortHandle {
    pub write_tx: std::sync::mpsc::SyncSender<Vec<u8>>,
    pub stop_flag: Arc<AtomicBool>,
}

#[derive(Default)]
pub struct AppState {
    pub ports: Mutex<HashMap<String, PortHandle>>,
}
