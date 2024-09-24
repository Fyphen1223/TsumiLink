import { EventEmitter } from 'events';
import WebSocket from 'ws';
import { Player } from './Player';

interface NodeOptions {
  serverName?: string;
  secure: boolean;
  host: string;
  port: number;
  pass: string;
  userAgent?: string;
  botId: string;
  sendPayload: (guildId: string, payload: object) => Promise<void>;
}

interface Stats {
  players: number;
  playingPlayers: number;
  uptime: number;
  memory: {
    free: number;
    used: number;
    allocated: number;
    reservable: number;
  };
  cpu: {
    cores: number;
    systemLoad: number;
    lavalinkLoad: number;
  };
  frameStats: {
    sent: number;
    nulled: number;
    expected: number;
    deficit: number;
  };
}

interface JoinVoiceChannelOptions {
  guildId: string;
  channelId: string;
  options?: {
    mute?: boolean;
    deaf?: boolean;
  };
}

export declare class Node extends EventEmitter {
  constructor(options: NodeOptions);

  serverName: string;
  url: string;
  fetchUrl: string;
  pass: string;
  userAgent: string;
  botId: string;
  sendPayload: (guildId: string, payload: object) => Promise<void>;
  sessionId: string | null;
  stats: Stats;
  players: { [guildId: string]: Player };
  ws: WebSocket | undefined;

  startWs(): Promise<this>;

  joinVoiceChannel(options: JoinVoiceChannelOptions): Promise<Player>;

  leaveVoiceChannel(guildId: string): Promise<this>;

  getPlayers(): { [guildId: string]: Player };

  getPlayer(guildId: string): Player | undefined;

  loadTracks(data: string): Promise<object>;

  loadTTS(text: string, voice?: string): Promise<object>;

  loadLyrics(track: string, lang?: string): Promise<object>;

  getStats(): Promise<Stats>;

  decodeTrack(track: string): Promise<object>;

  decodeTracks(tracks: string[]): Promise<object>;

  destroy(): boolean;
}
