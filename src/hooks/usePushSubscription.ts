import { useEffect } from 'react';
import { api } from '@/api/client';

async function getVapidKey(): Promise<string> {
  const { data } = await api.get<{ key: string }>('/users/vapid-public-key');
  return data.key;
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  return Uint8Array.from([...raw].map(c => c.charCodeAt(0)));
}

export function usePushSubscription(userId: string | undefined) {
  useEffect(() => {
    if (!userId || !('serviceWorker' in navigator) || !('PushManager' in window)) return;

    let cancelled = false;

    (async () => {
      try {
        const reg = await navigator.serviceWorker.ready;
        const existing = await reg.pushManager.getSubscription();
        if (existing) {
          if (!cancelled) await api.post('/users/me/push-subscription', existing.toJSON());
          return;
        }
        const vapidKey = await getVapidKey();
        if (!vapidKey || cancelled) return;
        const permission = await Notification.requestPermission();
        if (permission !== 'granted' || cancelled) return;
        const sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidKey),
        });
        if (!cancelled) await api.post('/users/me/push-subscription', sub.toJSON());
      } catch {
        // Non-critical — app works without push
      }
    })();

    return () => { cancelled = true; };
  }, [userId]);
}
