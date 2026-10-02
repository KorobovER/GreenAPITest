export function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, '');
}

export function isValidPhone(phone: string): boolean {
  const digits = normalizePhone(phone);
  return digits.length >= 10 && digits.length <= 15;
}

export function phoneToChatId(phone: string): string {
  return `${normalizePhone(phone)}@c.us`;
}

export function chatIdToPhone(chatId: string): string {
  return chatId.split('@')[0];
}

export function formatTime(timestamp: number): string {
  return new Date(timestamp * 1000).toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

const AVATAR_COLORS = [
  '#5b8def',
  '#7c5cff',
  '#00a884',
  '#e8546b',
  '#e8a13c',
  '#3aaed8',
];

export function avatarColor(key: string): string {
  let hash = 0;
  for (const ch of key) hash = (hash * 31 + ch.charCodeAt(0)) | 0;
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}
