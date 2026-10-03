import { useEffect, useRef } from 'react';
import {
  deleteNotification,
  extractMessage,
  receiveNotification,
  type ParsedMessage,
} from '../api/greenApi';
import type { Credentials } from '../types';

const IDLE_DELAY = 1000;
const ERROR_DELAY = 5000;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export function useNotifications(
  creds: Credentials | null,
  onMessage: (msg: ParsedMessage) => void,
) {
  const onMessageRef = useRef(onMessage);

  useEffect(() => {
    onMessageRef.current = onMessage;
  }, [onMessage]);

  useEffect(() => {
    if (!creds) return;
    let stopped = false;

    const loop = async () => {
      while (!stopped) {
        try {
          const notification = await receiveNotification(creds);
          if (!notification) {
            await sleep(IDLE_DELAY);
            continue;
          }
          try {
            const msg = extractMessage(notification);
            if (msg) onMessageRef.current(msg);
          } finally {
            await deleteNotification(creds, notification.receiptId).catch(
              () => {},
            );
          }
        } catch {
          if (!stopped) await sleep(ERROR_DELAY);
        }
      }
    };

    void loop();
    return () => {
      stopped = true;
    };
  }, [creds]);
}
