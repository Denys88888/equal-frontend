import { api } from './client';

export const callsApi = {
  /** STUN plus a TURN relay with short-lived credentials when the server has one. */
  iceServers: async (): Promise<RTCIceServer[]> => {
    const { data } = await api.get<{ iceServers: RTCIceServer[] }>('/calls/ice-servers', { signal: AbortSignal.timeout(6000) });
    return data.iceServers;
  },
};
