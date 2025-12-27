-- Добавляем таблицу настроек чатов
CREATE TABLE chat_settings (
    id SERIAL PRIMARY KEY,
    chat_id INTEGER REFERENCES chats(id),
    user_id INTEGER REFERENCES users(id),
    is_muted BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(chat_id, user_id)
);

-- Добавляем таблицу для WebRTC сигналов
CREATE TABLE call_sessions (
    id SERIAL PRIMARY KEY,
    chat_id INTEGER REFERENCES chats(id),
    caller_id INTEGER REFERENCES users(id),
    receiver_id INTEGER REFERENCES users(id),
    call_type VARCHAR(20) DEFAULT 'audio',
    status VARCHAR(20) DEFAULT 'calling',
    signal_data TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ended_at TIMESTAMP
);

CREATE INDEX idx_call_sessions_status ON call_sessions(status);
CREATE INDEX idx_call_sessions_chat_id ON call_sessions(chat_id);