const axios = require('axios');
const { EventEmitter } = require('events');
const { WebSocket } = require('ws');

class Player extends EventEmitter {
	/**
	 * Represents a Player that connects to a node and interacts with a guild's session.
	 * @extends EventEmitter
	 * @class
	 */
	constructor(options) {
		/**
		 * Creates a new Player instance.
		 * @param {Object} options - The options for the Player.
		 * @param {string} options.guildId - The ID of the guild.
		 * @param {Object} options.node - The node to connect to.
		 */
		super();

		/**
		 * The ID of the guild.
		 * @type {string}
		 */
		this.guildId = options.guildId;

		/**
		 * The node to connect to.
		 * @type {string}
		 */
		this.node = options.node;

		/**
		 * The connection information.
		 * @type {Object}
		 */
		this.connectionInfo = {
			token: null,
			endpoint: null,
			sessionId: null,
		};

		/**
		 * Listening web socket, works with NodeLink only
		 * @return {Object} WebSocket instance
		 */
		this.listeningWebSocket = null;
	}

	handleEvents = (data) => {
		/**
		 * Function for handling events
		 * @type {Function}
		 * @param {Object} data The data to handle
		 */
		switch (data.type) {
			case 'TrackStartEvent':
				this.emit('trackStart', data.track);
				break;
			case 'TrackEndEvent':
				this.emit('trackEnd', data.track);
				break;
			case 'TrackExceptionEvent':
				this.emit('trackException', data.track);
				break;
			case 'TrackStuckEvent':
				this.emit('trackStuck', data.track);
				break;
			case 'WebSocketClosedEvent':
				this.emit('webSocketClosed', data);
				break;
		}
	};

	connect = async () => {
		/**
		 * Start connection between LavaLink/NodeLink and Discord voice server
		 * @type {Function}
		 */
		this.update({
			voice: {
				token: this.connectionInfo.token,
				endpoint: this.connectionInfo.endpoint,
				sessionId: this.connectionInfo.sessionId,
			},
		});
	};

	update = async (data) => {
		/**
		 * Update player data
		 * @type {Function}
		 * @param {Object} data - The data to update
		 * @return {Object} Request result
		 */
		if (!this.node.sessionId) throw new Error('Node is not ready');
		const res = await axios.patch(
			`${this.node.fetchUrl}/v4/sessions/${this.node.sessionId}/players/${this.guildId}?noReplace=true`,
			data,
			{
				headers: {
					Authorization: this.node.pass,
				},
			}
		);
		return res.data;
	};

	destroy = async () => {
		/**
		 * Destroy this player on the server
		 * @type {Function}
		 * @return {Object} Request result
		 */
		return await axios.delete(
			`${this.node.fetchUrl}/v4/sessions/${this.node.sessionId}/players/${this.guildId}`,
			{
				headers: {
					Authorization: this.node.pass,
				},
			}
		);
	};

	get = async () => {
		/**
		 * Get this player's information
		 * @type {Function}
		 * @return {Object} This player's information
		 */
		if (!this.node.sessionId) throw new Error('Node is not ready');
		const res = await axios.get(
			`${this.node.fetchUrl}/v4/sessions/${this.node.sessionId}/players/${this.guildId}`,
			{
				headers: {
					Authorization: this.node.pass,
				},
			}
		);
		return res.data;
	};

	play = async (data) => {
		/**
		 * Plays a track
		 * @type {Function}
		 * @param {Object} data The data to play
		 * @param {string} data.track The base64 encoded track to play
		 * @param {Object} options The options for playing the track
		 * @returns {Object} Request result
		 */
		const res = await axios.patch(
			`${this.node.fetchUrl}/v4/sessions/${this.node.sessionId}/players/${this.guildId}?noReplace=true`,
			{
				track: {
					encoded: data.track,
				},
			},
			{
				headers: {
					Authorization: this.node.pass,
				},
			}
		);
		return res.data;
	};

	pause = async () => {
		/**
		 * Pause playing
		 * @type {Function}
		 * @return {Object} Request result
		 */ _;
		return await this.update({
			paused: true,
		});
	};

	resume = async () => {
		/**
		 * Resume playing
		 * @type {Function}
		 * @return {Object} Request result
		 */
		return await this.update({
			paused: false,
		});
	};

	setVolume = async (data) => {
		/**
		 * Set volume
		 * @type {Function}
		 * @param {number} data The volume to set
		 * @return {Object} Request result
		 */
		if (data >= 1000 || data < 0) {
			throw new Error('Volume must be between 0 and 1000');
		} else {
			return await this.update({
				volume: data,
			});
		}
	};

	setFilter = async (data) => {
		/**
		 * Set filter
		 * @type {Function}
		 * @param {Object} data The filter to set
		 * @return {Object} This node instance
		 */
		return await this.update({
			filters: data,
		});
	};

	getVolume = async () => {
		/**
		 * Get volume
		 * @type {Function}
		 * @return {number} Volume
		 */
		const { volume } = await this.get();
		return volume;
	};

	getFilters = async () => {
		/**
		 * Get filters
		 * @type {Function}
		 * @return {Object} Filters
		 */
		const { filters } = await this.get();
		return filters;
	};

	seek = async (int) => {
		/**
		 * Seek track
		 * @type {Function}
		 * @param {number} int The position to seek to
		 * @return {number} Request result
		 */
		console.log(int);
		return await this.update({
			position: int,
		});
	};

	startListen = async () => {
		/**
		 * Start listening on VC
		 * @type {Function}
		 * @return {Object} An event emitter for listening
		 */
		if (this.listeningWebSocket) return this.listeningWebSocket;
		const listener = new EventEmitter();
		const listeningWebSocket = new WebSocket(`${this.node.url}/connection/data`, {
			headers: {
				Authorization: this.node.pass,
				'user-id': this.node.botId,
				'guild-id': this.guildId,
				'Client-Name': this.node.userAgent,
			},
		});
		this.listeningWebSocket = listeningWebSocket;
		listeningWebSocket.on('open', function () {
			listener.emit('open');
		});
		listeningWebSocket.on('message', function (data) {
			const message = JSON.parse(data);
			if (message.type === 'startSpeakingEvent') {
				listener.emit('startSpeaking', message.data);
				/*
				{
  					op: 'speak',
  					type: 'startSpeakingEvent',
  					data: { userId: '897295756124360744', guildId: '919809544648020008' }
				}
				*/
			}
			if (message.type == 'endSpeakingEvent') {
				listener.emit('endSpeaking', message.data);
				/*
				{
  					op: 'speak',
  					type: 'endSpeakingEvent',
  					data: {
    					userId: '897295756124360744',
    					guildId: '919809544648020008',
						data: 'Raw PCM data'
						type: 'pcm'
  					}
				}
				*/
			}
		});
		listeningWebSocket.on('close', function () {
			listener.emit('close');
		});
		listeningWebSocket.on('error', function () {
			listener.emit('error');
		});
		return listener;
	};

	stopListen = async () => {
		/**
		 * Stop listening on VC
		 * @type {Function}
		 * @return {Boolean} Return true if stopped listening
		 */
		if (!this.listeningWebSocket) return false;
		this.listeningWebSocket.close();
		this.listeningWebSocket = null;
		return true;
	};
}

module.exports = { Player };
