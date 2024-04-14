const WebSocket = require('ws');
const { EventEmitter } = require('node:events');
const { Player } = require('./Player');

class Node extends EventEmitter {
	constructor(options) {
		super();
		/**
		 * @param {Object} options - Object that contains the options for the Node
		 * @param {string} options.serverName - The name of the server
		 * @param {boolean} options.secure - Whether the connection is secure or not
		 * @param {string} options.host - Hostname
		 * @param {number} options.port - Port
		 * @param {string} options.pass - Password
		 * @param {string} options.userAgent - User-Agent
		 * @param {string} options.botId - Bot ID
		 */

		this.serverName = options.serverName || 'Tsumi';
		this.url = `ws${options.secure ? 's' : ''}://${options.host}:${options.port}`;
		this.pass = options.pass;
		this.userAgent = options.userAgent || 'Tsumi/0.0.1';
		this.botId = options.botId;
	}
	players = {};
	startWs = () => {
		this.ws = new WebSocket(`${this.url}/v4/websocket`, {
			headers: {
				Authorization: this.pass,
				'User-Id': this.botId,
				'Client-name': this.userAgent,
			},
		});
		this.ws.on('open', () => {
			this.emit('open');
		});
		this.ws.on('message', (data) => {
			this.emit('message', data);
		});
		return this;
	};
	createPlayer = (guildId, options) => {
		const player = new Player({
			guildId: guildId,
			options: options,
		});
		this.players = { ...this.players, [guildId]: player };
		return player;
	};
}

module.exports = { Node };
