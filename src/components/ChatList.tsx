import { useState, type FormEvent } from 'react';
import type { Chat } from '../types';
import {
  avatarColor,
  formatTime,
  isValidPhone,
} from '../utils/chat';

interface Props {
  chats: Chat[];
  activeChatId: string | null;
  onSelectChat: (chatId: string) => void;
  onCreateChat: (phone: string) => void;
  onLogout: () => void;
}

export function ChatList({
  chats,
  activeChatId,
  onSelectChat,
  onCreateChat,
  onLogout,
}: Props) {
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');

  const handleCreate = (e: FormEvent) => {
    e.preventDefault();
    if (!isValidPhone(phone)) {
      setError('Введите номер в формате 79001234567');
      return;
    }
    setError('');
    onCreateChat(phone);
    setPhone('');
  };

  return (
    <aside className="sidebar">
      <header className="sidebar-header">
        <span className="sidebar-title">Чаты</span>
        <button className="logout-btn" onClick={onLogout} title="Выйти">
          Выйти
        </button>
      </header>

      <form className="new-chat-form" onSubmit={handleCreate}>
        <input
          type="tel"
          placeholder="Номер: 79001234567"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />
        <button type="submit" title="Создать чат">
          +
        </button>
      </form>
      {error && <div className="new-chat-error">{error}</div>}

      <ul className="chat-list">
        {chats.length === 0 && (
          <li className="chat-list-empty">
            Введите номер телефона, чтобы начать чат
          </li>
        )}
        {chats.map((chat) => {
          const last = chat.messages[chat.messages.length - 1];
          return (
            <li
              key={chat.chatId}
              className={`chat-item${chat.chatId === activeChatId ? ' active' : ''}`}
              onClick={() => onSelectChat(chat.chatId)}
            >
              <div
                className="avatar"
                style={{ background: avatarColor(chat.chatId) }}
              >
                {chat.name.slice(0, 1).toUpperCase()}
              </div>
              <div className="chat-item-body">
                <div className="chat-item-top">
                  <span className="chat-item-name">{chat.name}</span>
                  {last && (
                    <span className="chat-item-time">
                      {formatTime(last.timestamp)}
                    </span>
                  )}
                </div>
                <div className="chat-item-preview">
                  {last ? last.text : 'Нет сообщений'}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}
