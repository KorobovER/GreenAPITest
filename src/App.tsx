import { useCallback, useEffect, useState } from 'react';
import {
  defaultApiUrl,
  enableNotifications,
  sendMessage,
  type ParsedMessage,
} from './api/greenApi';
import { ChatList } from './components/ChatList';
import { ChatWindow } from './components/ChatWindow';
import { LoginForm } from './components/LoginForm';
import { useNotifications } from './hooks/useNotifications';
import type { Chat, Credentials } from './types';
import { chatIdToPhone, phoneToChatId } from './utils/chat';
import './App.css';

const CREDS_KEY = 'ga:credentials';
const chatsKey = (idInstance: string) => `ga:chats:${idInstance}`;

function loadCredentials(): Credentials | null {
  try {
    const raw = localStorage.getItem(CREDS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return { ...parsed, apiUrl: parsed.apiUrl ?? defaultApiUrl(parsed.idInstance) };
  } catch {
    return null;
  }
}

function loadChats(idInstance: string): Chat[] {
  try {
    const raw = localStorage.getItem(chatsKey(idInstance));
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function App() {
  const [credentials, setCredentials] = useState<Credentials | null>(
    loadCredentials,
  );
  const [chats, setChats] = useState<Chat[]>(() =>
    credentials ? loadChats(credentials.idInstance) : [],
  );
  const [activeChatId, setActiveChatId] = useState<string | null>(null);

  useEffect(() => {
    if (credentials) {
      localStorage.setItem(chatsKey(credentials.idInstance), JSON.stringify(chats));
    }
  }, [chats, credentials]);

  const handleLogin = (creds: Credentials) => {
    localStorage.setItem(CREDS_KEY, JSON.stringify(creds));
    setChats(loadChats(creds.idInstance));
    setActiveChatId(null);
    setCredentials(creds);
  };

  useEffect(() => {
    if (credentials) enableNotifications(credentials).catch(() => {});
  }, [credentials]);

  const handleLogout = () => {
    localStorage.removeItem(CREDS_KEY);
    setCredentials(null);
    setChats([]);
    setActiveChatId(null);
  };

  const handleIncoming = useCallback((msg: ParsedMessage) => {
    setChats((prev) => {
      const idx = prev.findIndex((c) => c.chatId === msg.chatId);
      if (idx !== -1 && prev[idx].messages.some((m) => m.id === msg.id)) {
        return prev;
      }
      const message = {
        id: msg.id,
        text: msg.text,
        outgoing: msg.outgoing,
        timestamp: msg.timestamp,
      };
      const next = [...prev];
      if (idx === -1) {
        next.unshift({
          chatId: msg.chatId,
          name: msg.senderName || `+${chatIdToPhone(msg.chatId)}`,
          messages: [message],
        });
      } else {
        next[idx] = { ...next[idx], messages: [...next[idx].messages, message] };
      }
      return next;
    });
  }, []);

  useNotifications(credentials, handleIncoming);

  const handleCreateChat = (phone: string) => {
    const chatId = phoneToChatId(phone);
    setChats((prev) =>
      prev.some((c) => c.chatId === chatId)
        ? prev
        : [{ chatId, name: `+${chatIdToPhone(chatId)}`, messages: [] }, ...prev],
    );
    setActiveChatId(chatId);
  };

  const handleSend = async (text: string) => {
    if (!credentials || !activeChatId) return;
    const idMessage = await sendMessage(credentials, activeChatId, text);
    const message = {
      id: idMessage,
      text,
      outgoing: true,
      timestamp: Math.floor(Date.now() / 1000),
    };
    setChats((prev) =>
      prev.map((c) =>
        c.chatId === activeChatId
          ? { ...c, messages: [...c.messages, message] }
          : c,
      ),
    );
  };

  const sortedChats = [...chats].sort(
    (a, b) =>
      (b.messages[b.messages.length - 1]?.timestamp ?? 0) -
      (a.messages[a.messages.length - 1]?.timestamp ?? 0),
  );
  const activeChat = chats.find((c) => c.chatId === activeChatId) ?? null;

  if (!credentials) {
    return <LoginForm onLogin={handleLogin} />;
  }

  return (
    <div className="app">
      <ChatList
        chats={sortedChats}
        activeChatId={activeChatId}
        onSelectChat={setActiveChatId}
        onCreateChat={handleCreateChat}
        onLogout={handleLogout}
      />
      <ChatWindow chat={activeChat} onSend={handleSend} />
    </div>
  );
}

export default App;
