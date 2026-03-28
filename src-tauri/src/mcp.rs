use std::sync::Arc;
use std::time::Duration;

use rmcp::handler::server::{router::tool::ToolRouter, wrapper::Parameters};
use rmcp::model::{CallToolResult, Content, ServerCapabilities, ServerInfo};
use rmcp::transport::streamable_http_server::{StreamableHttpServerConfig, StreamableHttpService};
use rmcp::{schemars, tool, tool_handler, tool_router, ServerHandler};
use serde::Deserialize;
use tokio_util::sync::CancellationToken;

use crate::commands::list_ports;
use crate::state::LineBuffers;

#[derive(Debug, Deserialize, schemars::JsonSchema)]
pub struct ReadSerialParams {
    #[schemars(description = "Serial port path, e.g. /dev/ttyUSB0")]
    pub port_path: String,
    #[schemars(description = "Number of recent lines to return (default 50)")]
    pub lines: Option<u32>,
}

#[derive(Clone)]
pub struct SerialiusMcp {
    line_buffers: LineBuffers,
    tool_router: ToolRouter<Self>,
}

#[tool_router]
impl SerialiusMcp {
    #[tool(description = "List available serial ports on the system")]
    async fn list_serial_ports(&self) -> String {
        match list_ports().await {
            Ok(ports) => {
                if ports.is_empty() {
                    "No serial ports found".to_string()
                } else {
                    ports
                        .iter()
                        .map(|p| {
                            let mut s = p.path.clone();
                            if let Some(ref prod) = p.product {
                                s.push_str(&format!(" — {prod}"));
                            }
                            if let Some(ref mfr) = p.manufacturer {
                                s.push_str(&format!(" ({mfr})"));
                            }
                            s
                        })
                        .collect::<Vec<_>>()
                        .join("\n")
                }
            }
            Err(e) => format!("Error listing ports: {e}"),
        }
    }

    #[tool(description = "Read recent lines from a serial port's buffer")]
    fn read_serial_data(
        &self,
        Parameters(params): Parameters<ReadSerialParams>,
    ) -> String {
        let n = params.lines.unwrap_or(50) as usize;
        let Ok(buffers) = self.line_buffers.lock() else {
            return "Error: failed to lock buffer".to_string();
        };
        match buffers.get(&params.port_path) {
            Some(buf) => {
                let lines = buf.last_n_lines(n);
                if lines.is_empty() {
                    format!("Port {} connected but no data received yet", params.port_path)
                } else {
                    lines.join("\n")
                }
            }
            None => format!(
                "No data buffer for port {}. Is it connected?",
                params.port_path
            ),
        }
    }
}

#[tool_handler]
impl ServerHandler for SerialiusMcp {
    fn get_info(&self) -> ServerInfo {
        ServerInfo {
            instructions: Some(
                "Serialius MCP server provides access to serial port data. \
                 Use list_serial_ports to see available ports, and \
                 read_serial_data to read recent output from a connected port."
                    .to_string(),
            ),
            capabilities: ServerCapabilities::builder().enable_tools().build(),
            ..Default::default()
        }
    }
}

pub async fn start_server(
    port: u16,
    api_key: String,
    line_buffers: LineBuffers,
    cancel: CancellationToken,
) -> Result<(), String> {
    let bind_addr: std::net::SocketAddr = format!("127.0.0.1:{port}")
        .parse()
        .map_err(|e| format!("{e}"))?;

    let config = StreamableHttpServerConfig {
        sse_keep_alive: Some(Duration::from_secs(15)),
        cancellation_token: cancel,
        ..Default::default()
    };

    let session_manager = Arc::new(
        rmcp::transport::streamable_http_server::session::local::LocalSessionManager::default(),
    );

    let service = StreamableHttpService::new(
        move || Ok(SerialiusMcp {
            line_buffers: line_buffers.clone(),
            tool_router: SerialiusMcp::tool_router(),
        }),
        session_manager,
        config,
    );

    // Wrap with API key auth middleware
    let app = if api_key.is_empty() {
        axum::Router::new().fallback_service(service)
    } else {
        let expected_header = format!("Bearer {api_key}");
        axum::Router::new()
            .fallback_service(service)
            .layer(axum::middleware::from_fn(
                move |req: axum::extract::Request, next: axum::middleware::Next| {
                    let expected = expected_header.clone();
                    async move {
                        let auth = req
                            .headers()
                            .get("authorization")
                            .and_then(|v| v.to_str().ok())
                            .unwrap_or("");
                        if auth != expected {
                            return Err(axum::http::StatusCode::UNAUTHORIZED);
                        }
                        Ok(next.run(req).await)
                    }
                },
            ))
    };

    let listener = tokio::net::TcpListener::bind(bind_addr)
        .await
        .map_err(|e| e.to_string())?;

    axum::serve(listener, app)
        .await
        .map_err(|e| e.to_string())
}
