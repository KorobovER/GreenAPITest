import type { Credentials } from '../types';

const LEGACY_API_HOST = 'https://api.green-api.com';

export function defaultApiUrl(idInstance: string): string {
  return `https://${idInstance.slice(0, 4)}.api.greenapi.com`;
}

export class ApiError extends Error {
  status: number;

  constructor(status: number) {
    super(`GREEN-API request failed with status ${status}`);
    this.status = status;
  }
}

function url(creds: Credentials, method: string, tail = ''): string {
  return `${creds.apiUrl}/waInstance${creds.idInstance}/${method}/${creds.apiTokenInstance}${tail}`;
}

export async function resolveCredentials(
  idInstance: string,
  apiTokenInstance: string,
): Promise<{ creds: Credentials; state: string }> {
  const hosts = [defaultApiUrl(idInstance), LEGACY_API_HOST];
  let apiError: ApiError | null = null;
  for (const apiUrl of hosts) {
    try {
      const creds = { idInstance, apiTokenInstance, apiUrl };
      const state = await getStateInstance(creds);
      return { creds, state };
    } catch (err) {
      if (err instanceof ApiError) apiError = err;
    }
  }
  throw apiError ?? new ApiError(0);
}

export async function getStateInstance(creds: Credentials): Promise<string> {
  const res = await fetch(url(creds, 'getStateInstance'));
  if (!res.ok) throw new ApiError(res.status);
  const data = await res.json();
  return data.stateInstance;
}

export async function enableNotifications(creds: Credentials): Promise<void> {
  const res = await fetch(url(creds, 'setSettings'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      incomingWebhook: 'yes',
      outgoingMessageWebhook: 'yes',
      outgoingAPIMessageWebhook: 'yes',
      markIncomingMessagesReaded: 'yes',
    }),
  });
  if (!res.ok) throw new ApiError(res.status);
}

export async function sendMessage(
  creds: Credentials,
  chatId: string,
  message: string,
): Promise<string> {
  const res = await fetch(url(creds, 'sendMessage'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chatId, message }),
  });
  if (!res.ok) throw new ApiError(res.status);
  const data = await res.json();
  return data.idMessage;
}

export interface RawNotification {
  receiptId: number;
  body: {
    typeWebhook: string;
    timestamp: number;
    idMessage: string;
    senderData?: { chatId?: string; senderName?: string };
    messageData?: {
      typeMessage?: string;
      textMessageData?: { textMessage?: string };
      extendedTextMessageData?: { text?: string };
    };
  };
}

export interface ParsedMessage {
  id: string;
  chatId: string;
  senderName?: string;
  text: string;
  outgoing: boolean;
  timestamp: number;
}

export async function receiveNotification(
  creds: Credentials,
): Promise<RawNotification | null> {
  const res = await fetch(url(creds, 'receiveNotification'));
  if (!res.ok) throw new ApiError(res.status);
  const text = await res.text();
  if (!text) return null;
  return JSON.parse(text);
}

export function extractMessage(n: RawNotification): ParsedMessage | null {
  const { body } = n;
  const supported =
    body.typeWebhook === 'incomingMessageReceived' ||
    body.typeWebhook === 'outgoingMessageReceived' ||
    body.typeWebhook === 'outgoingAPIMessageReceived';
  if (!supported) return null;

  const chatId = body.senderData?.chatId;
  const md = body.messageData;
  const text =
    md?.typeMessage === 'textMessage'
      ? md.textMessageData?.textMessage
      : md?.typeMessage === 'extendedTextMessage'
        ? md.extendedTextMessageData?.text
        : undefined;
  if (!chatId || !text) return null;

  return {
    id: body.idMessage,
    chatId,
    senderName: body.senderData?.senderName,
    text,
    outgoing: body.typeWebhook !== 'incomingMessageReceived',
    timestamp: body.timestamp,
  };
}

export async function deleteNotification(
  creds: Credentials,
  receiptId: number,
): Promise<void> {
  await fetch(url(creds, 'deleteNotification', `/${receiptId}`), {
    method: 'DELETE',
  });
}
