const WebSocket = require('ws');
const { EventEmitter } = require('node:events');
const { Player } = require('./Player');
const axios = require('axios');

/**
 * Represents a Player that connects to a node and interacts with a guild's session.
 * @extends EventEmitter
 * @class
 */
class Node extends EventEmitter {
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
	constructor(options) {
		super();

		/**
		 * This Node's name
		 * @type {String}
		 */
		this.serverName = options.serverName || 'Tsumi';

		/**
		 * This Node's WS URL
		 * @type {String}
		 */
		this.url = `ws${options.secure ? 's' : ''}://${options.host}:${options.port}`;

		/**
		 * This Node's API URL
		 * @type {String}
		 */
		this.fetchUrl = `http${options.secure ? 's' : ''}://${options.host}:${options.port}`;

		/**
		 * This Node's password
		 * @type {String}
		 */
		this.pass = options.pass;

		/**
		 * Useragent used to connect this node
		 * @type {String}
		 */
		this.userAgent = options.userAgent || 'Tsumi/0.0.1';

		/**
		 * This Node's ID
		 * @type {String}
		 */
		this.botId = options.botId;

		/**
		 * This Node's function to send payload to Discord server
		 * @type {Function}
		 */
		this.sendPayload = options.sendPayload;

		/**
		 * This Node's session ID
		 * @type {String}
		 */
		this.sessionId = null;
	}

	/**
	 * This Node's stats
	 * @type {Object}
	 */
	stats = {
		memory: {
			free: 0,
			used: 0,
			allocated: 0,
			reservable: 0,
		},
		cpu: { cores: 0, systemLoad: 0, lavalinkLoad: 0 },
	};

	/**
	 * This Node's player
	 * @type {Object}
	 */
	players = {};

	/**
	 * Start WS with LavaLink server
	 * @function
	 * @return {Object} - This node instance
	 */
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

	/**
	 * Join voice channel
	 * @function
	 * @async
	 * @param {Object} options - Object that contains the options for the voice channel
	 * @param {String} options.guildId - Guild ID
	 * @param {String} options.channelId - Channel ID
	 * @param {Object} options.options - Options for the voice channel
	 * @return {Object} - Player instance
	 */
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

	/**
	 * Leave voice channel
	 * @function
	 * @param {String} guildId - Guild ID
	 * @return {Object} - This node instance
	 */
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

	/**
	 * Get players
	 * @function
	 * @return {Object} - Players
	 */
	getPlayers = () => {
		return this.players;
	};

	/**
	 * Get player on specified guild
	 * @function
	 * @param {String} guildId - Guild ID
	 * @return {Object} - The player for the guild
	 */
	getPlayer = (guildId) => {
		return this.players[guildId];
	};

	/**
	 * Load tracks
	 * @function
	 * @async
	 * @param {String} data - Data to load
	 * @return {Object} - Load results
	 */
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
