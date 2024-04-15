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
	stats = {
		memory: {
			free: 0,
			used: 0,
			allocated: 0,
			reservable: 0,
		},
		cpu: { cores: 0, systemLoad: 0, lavalinkLoad: 0 },
	};

	players = {};

	startWs = () => {
		try {
			this.ws = new WebSocket(`${this.url}/v4/websocket`, {
				headers: {
					Authorization: this.pass,
					'User-Id': this.botId,
					'Client-name': this.userAgent,
				},
			});
		} catch (err) {
			throw new Error(err.stack);
		}
		this.ws.on('message', (data) => {
			const parsedData = JSON.parse(data.toString());
			if (parsedData.op === 'ready') {
				this.emit('ready');
				this.sessionId = parsedData.sessionId;
			} else if (parsedData.op === 'event') {
				this.emit('event', parsedData);
				this.players[parsedData.guildId].handleEvents(parsedData);
			} else if (parsedData.op === 'stats') {
				this.emit('stats', parsedData);
				this.stats.memory = parsedData.memory;
				this.stats.cpu = parsedData.cpu;
			} else if (parsedData.op === 'playerUpdate') {
				this.emit('playerUpdate', parsedData);
			}
		});
		return this;
	};

	joinVoiceChannel = async (options) => {
		if (!this.sessionId)
			throw new Error(
				'Node is not ready, please wait for it to receive session ID to work properly.'
			);
		global.tsumi.vcsData[options.guildId] = {
			token: null,
			endpoint: null,
			sessionId: null,
		};
		await this.sendPayload(options.guildId, {
			op: 4,
			d: {
				guild_id: options.guildId,
				channel_id: options.channelId,
				self_mute: options.options?.mute ?? false,
				self_deaf: options.options?.deaf ?? false,
			},
		});
		const player = new Player({
			guildId: options.guildId,
			node: this,
		});
		this.players = { ...this.players, [options.guildId]: player };
		return player;
	};

	leaveVoiceChannel = async (guildId) => {
		if (!this.players[guildId]) throw new Error('Player not found');
		await this.players[guildId].destroy();
		await this.sendPayload(guildId, {
			op: 4,
			d: {
				guild_id: guildId,
				channel_id: null,
				self_mute: false,
				self_deaf: false,
			},
		});
		await this.players[guildId].removeAllListeners();
		delete this.players[guildId];
		return this;
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
