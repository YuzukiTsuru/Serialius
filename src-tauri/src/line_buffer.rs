use std::collections::VecDeque;

pub struct LineBuffer {
    lines: VecDeque<String>,
    partial: String,
    max_lines: usize,
}

impl LineBuffer {
    pub fn new(max_lines: usize) -> Self {
        Self {
            lines: VecDeque::new(),
            partial: String::new(),
            max_lines,
        }
    }

    pub fn push_bytes(&mut self, data: &[u8]) {
        let text = String::from_utf8_lossy(data);
        self.partial.push_str(&text);

        let mut start = 0;
        while let Some(pos) = self.partial[start..].find('\n') {
            let abs = start + pos;
            self.lines.push_back(self.partial[start..abs].to_string());
            if self.lines.len() > self.max_lines {
                self.lines.pop_front();
            }
            start = abs + 1;
        }
        if start > 0 {
            self.partial.drain(..start);
        }
    }

    pub fn last_n_lines(&self, n: usize) -> Vec<String> {
        self.last_n_lines_offset(n, 0)
    }

    pub fn last_n_lines_offset(&self, n: usize, offset: usize) -> Vec<String> {
        let total = self.lines.len();
        if offset >= total {
            return Vec::new();
        }
        let end = total - offset;
        let start = end.saturating_sub(n);
        self.lines.range(start..end).cloned().collect()
    }
}
