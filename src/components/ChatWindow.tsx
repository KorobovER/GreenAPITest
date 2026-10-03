import { useEffect, useRef, useState } from 'react';
import type { Chat } from '../types';
import { avatarColor, formatTime } from '../utils/chat';
import { MessageInput } from './MessageInput';

interface Props {
  chat: Chat | null;
  onSend: (text: string) => void;
}

export function ChatWindow({ chat, onSend }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const [sendError, setSendError] = useState('');

  useEffect(() => {
    bottomRef.current?.scrollIntoView();
  }, [chat?.chatId, chat?.messages.length]);

  if (!chat) {
    return (
      <main className="chat-window chat-window-empty">
        <p>Выберите чат или создайте новый</p>
      </main>
    );
  }

  const handleSend = async (text: string) => {
    setSendError('');
    try {
      await onSend(text);
    } catch {
      setSendError('Не удалось отправить сообщение');
    }
  };

  return (
    <main className="chat-window">
      <header className="chat-header">
        <div
          className="avatar"
          style={{ background: avatarColor(chat.chatId) }}
        >
          {chat.name.slice(0, 1).toUpperCase()}
        </div>
        <span className="chat-header-name">{chat.name}</span>
      </header>

      <div className="messages">
        {chat.messages.map((msg) => (
          <div
            key={msg.id}
            className={`message${msg.outgoing ? ' outgoing' : ''}`}
          >
            <div className="message-text">{msg.text}</div>
            <div className="message-time">{formatTime(msg.timestamp)}</div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {sendError && <div className="send-error">{sendError}</div>}
      <MessageInput onSend={handleSend} />
    </main>
  );
}
