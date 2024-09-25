import { EventEmitter } from 'events';
import { WebSocket } from 'ws';

export interface PlayerOptions {
  guildId: string;
  node: {
    sessionId?: string;
    pass: string;
    fetchUrl: string;
    url?: string;
    botId?: string;
    userAgent?: string;
  };
}

export interface ConnectionInfo {
  token: string | null;
  endpoint: string | null;
  sessionId: string | null;
}

export interface PlayerUpdateData {
  voice?: {
    token?: string;
    endpoint?: string;
    sessionId?: string;
  };
  paused?: boolean;
  track?: {
    encoded: string | null;
  };
  volume?: number;
  filters?: object;
  position?: number;
}

export declare class Player extends EventEmitter {
  guildId: string;
  node: PlayerOptions['node'];
  connectionInfo: ConnectionInfo;
  listeningWebSocket: WebSocket | null;
  position: number;
  track: object | null;
  paused: boolean;
  volume: number;
  filters: object;
  status: 'stopped' | 'playing';

  constructor(options: PlayerOptions);

  handleEvents(data: { type: string; track: object }): void;
  handlePlayerUpdate(data: { state: { position: number; time: number; connected: boolean; ping: number } }): void;
  
  connect(): Promise<void>;
  update(data: PlayerUpdateData, noReplace?: boolean): Promise<object>;
  
  destroy(): Promise<Response>;
  get(): Promise<{ state: { position: number; ping: number; connected: boolean } }>;

  play(data: { track: any }): Promise<object>;
  pause(): Promise<object>;
  resume(): Promise<object>;
  stop(): Promise<object>;

  setVolume(data: number): Promise<object>;
  getVolume(): Promise<number>;
  setFilter(data: object): Promise<object>;
  clearFilter(): Promise<object>;
  getFilters(): Promise<object>;

  seek(int: number): Promise<object>;

  startListen(): Promise<EventEmitter>;
  stopListen(): Promise<boolean>;
}
