import { EventEmitter } from 'events';
import { Node } from './Node';

interface TsumiOptions {
  botId: string;
  sendPayload: (guildId: string, payload: object) => Promise<void>;
  userAgent?: string;
}

interface NodeOptions {
  serverName?: string;
  secure: boolean;
  host: string;
  port: number;
  pass: string;
}

export declare class TsumiInstance extends EventEmitter {
  constructor(options: TsumiOptions);

  options: TsumiOptions;
  botId: string;
  userAgent: string;
  Nodes: { [key: string]: Node };

  purge(): boolean;

  addNode(node: NodeOptions): Promise<Node>;

  getIdealNode(): Node | undefined;

  handleRaw(data: { t: string; d: any }): void;
}

export declare function findValue(obj: { [key: string]: Node }, searchKey: string): any;

export declare function sortNodesBySystemLoad(nodes: { [key: string]: Node }): string[];
