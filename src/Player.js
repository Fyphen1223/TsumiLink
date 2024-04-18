const axios = require('axios');
const { EventEmitter } = require('events');
const { WebSocket } = require('ws');

/**
 * Represents a Player that connects to a node and interacts with a guild's session.
 * @extends EventEmitter
 * @class
 */
class Player extends EventEmitter {
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
		 * @type {Object}
		 */
		this.listeningWebSocket = null;
	}

	/**
	 * Function for handling events
	 * @function
	 * @param {Object} data - The data to handle
	 */
	handleEvents = (data) => {
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

	/**
	 * Start connection between LavaLink/NodeLink and Discord voice server
	 * @function
	 * @async
	 */
	connect = async () => {
		this.update({
			voice: {
				token: this.connectionInfo.token,
				endpoint: this.connectionInfo.endpoint,
				sessionId: this.connectionInfo.sessionId,
			},
		});
	};

	/**
	 * Update player data
	 * @function
	 * @async
	 * @param {Object} data - The data to update
	 * @return {Object} - Request result
	 */
	update = async (data) => {
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

	/**
	 * Destroy this player on the server
	 * @function
	 * @async
	 * @return {Object} - Request result
	 */
	destroy = async () => {
		return await axios.delete(
			`${this.node.fetchUrl}/v4/sessions/${this.node.sessionId}/players/${this.guildId}`,
			{
				headers: {
					Authorization: this.node.pass,
				},
			}
		);
	};

	/**
	 * Get this player's information
	 * @function
	 * @async
	 * @return {Object} - This player's information
	 */
	get = async () => {
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

	/**
	 * Plays a track
	 * @function
	 * @async
	 * @param {Object} data - The data to play
	 * @param {string} data.track - The base64 encoded track to play
	 * @param {Object} options - The options for playing the track
	 * @return {Object} - Request result
	 */
	play = async (data) => {
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

	/**
	 * Pause playing
	 * @function
	 * @async
	 * @return {Object} - Request result
	 */
	pause = async () => {
		return await this.update({
			paused: true,
		});
	};

	/**
	 * Resume playing
	 * @function
	 * @async
	 * @return {Object} - Request result
	 */
	resume = async () => {
		return await this.update({
			paused: false,
		});
	};

	/**
	 * Set volume
	 * @function
	 * @async
	 * @param {number} data - The volume to set
	 * @return {Object} - Request result
	 */
	setVolume = async (data) => {
		if (data >= 1000 || data < 0) {
			throw new Error('Volume must be between 0 and 1000');
		} else {
			return await this.update({
				volume: data,
			});
		}
	};

	/**
	 * Set filter
	 * @function
	 * @async
	 * @param {Object} data - The filter to set
	 * @return {Object} - This node instance
	 */
	setFilter = async (data) => {
		return await this.update({
			filters: data,
		});
	};

	/**
	 * Get volume
	 * @function
	 * @async
	 * @return {number} - Volume
	 */
	getVolume = async () => {
		const { volume } = await this.get();
		return volume;
	};

	/**
	 * Get filters
	 * @function
	 * @async
	 * @return {Object} - Filters
	 */
	getFilters = async () => {
		const { filters } = await this.get();
		return filters;
	};

	/**
	 * Seek track
	 * @function
	 * @async
	 * @param {number} int - The position to seek to
	 * @return {number} - Request result
	 */
	seek = async (int) => {
		console.log(int);
		return await this.update({
			position: int,
		});
	};

	/**
	 * Start listening on VC
	 * @function
	 * @async
	 * @return {Object} - An event emitter for listening
	 */
	startListen = async () => {
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

	/**
	 * Stop listening on VC
	 * @function
	 * @async
	 * @return {Boolean} Return true if stopped listening
	 */
	stopListen = async () => {
		if (!this.listeningWebSocket) return false;
		this.listeningWebSocket.close();
		this.listeningWebSocket = null;
		return true;
	};
}

module.exports = { Player };
