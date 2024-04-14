const WebSocket = require('ws');
const { EventEmitter } = require('node:events');
const { Player } = require('./Player');
const axios = require('axios');

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
		this.fetchUrl = `http${options.secure ? 's' : ''}://${options.host}:${options.port}`;
		this.pass = options.pass;
		this.userAgent = options.userAgent || 'Tsumi/0.0.1';
		this.botId = options.botId;
		this.sendPayload = options.sendPayload;
		this.sessionId = null;
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
		this.ws.on('message', (data) => {
			const parsedData = JSON.parse(data.toString());
			this.emit('raw', parsedData);
			if (parsedData.op === 'ready') {
				this.emit('ready');
				this.sessionId = parsedData.sessionId;
			} else if (parsedData.op === 'event') {
				this.emit(parsedData);
				console.log(parsedData);
			} else if (parsedData.op === 'stats') {
				this.emit('stats', parsedData);
			} else if (parsedData.op === 'playerUpdate') {
				this.emit('playerUpdate', parsedData);
			}
		});
		return this;
	};
	joinVoiceChannel = (guildId, channelId, options) => {
		global.tsumi.vcsData[guildId] = {
			token: null,
			endpoint: null,
			sessionId: null,
		};
		this.sendPayload(guildId, {
			op: 4,
			d: {
				guild_id: guildId,
				channel_id: channelId,
				self_mute: options?.mute ?? false,
				self_deaf: options?.deaf ?? false,
			},
		});
		const player = new Player({
			guildId,
			node: this,
		});
		this.players = { ...this.players, [guildId]: player };
		return player;
	};
	getPlayers = () => {
		return this.players;
	};
	getPlayer = (guildId) => {
		return this.players[guildId];
	};
	loadTracks = async (data) => {
		const res = await axios.get(`${this.fetchUrl}/v4/loadtracks?identifier=${data}`, {
			headers: {
				Authorization: this.pass,
			},
		});
		return res.data;
	};
}

module.exports = { Node };
