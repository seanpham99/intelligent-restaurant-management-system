import type {
  OrderCreateInput,
  OrderCreateResponse,
  OrderStatusEvent,
  OrderStatusSubscription,
} from '../types';
import { postJson } from './client';

type RuntimeEnv = {
  VITE_WS_BASE_URL?: string;
};

const runtimeEnv = (import.meta as ImportMeta & { env?: RuntimeEnv }).env ?? {};
const WS_BASE_URL = (runtimeEnv.VITE_WS_BASE_URL ?? 'ws://localhost:8000').replace(/\/+$/, '');

function buildWsUrl(path: string): string {
  return `${WS_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
}

export function createOrder(body: OrderCreateInput[]): Promise<OrderCreateResponse[]> {
  return postJson<OrderCreateInput[], OrderCreateResponse[]>('/order/create', body);
}

export function openOrderStatusSocket(onMessage: (event: OrderStatusEvent) => void): WebSocket {
  const socket = new WebSocket(buildWsUrl('/order/status'));
  socket.onmessage = (event) => {
    onMessage(JSON.parse(event.data) as OrderStatusEvent);
  };
  return socket;
}

export function subscribeOrderStatus(
  orderIds: string[],
  onMessage: (event: OrderStatusEvent) => void,
): WebSocket {
  const socket = openOrderStatusSocket(onMessage);
  socket.addEventListener('open', () => {
    orderIds.forEach((orderId) => {
      const payload: OrderStatusSubscription = { order_id: orderId };
      socket.send(JSON.stringify(payload));
    });
  });
  return socket;
}
