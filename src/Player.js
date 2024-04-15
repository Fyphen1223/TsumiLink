const axios = require('axios');
const { EventEmitter } = require('events');
const { WebSocket } = require('ws');

/**
 * Represents a Player that connects to a node and interacts with a guild's session.
 * @extends EventEmitter
 */
class Player extends EventEmitter {
	/**
	 * Creates a new Player instance.
	 * @param {Object} options - The options for the Player.
	 * @param {string} options.guildId - The ID of the guild.
	 * @param {Object} options.node - The node to connect to.
	 */
	constructor(options) {
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

		this.listeningWebSocket = null;
	}

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

	connect = async () => {
		this.update({
			voice: {
				token: this.connectionInfo.token,
				endpoint: this.connectionInfo.endpoint,
				sessionId: this.connectionInfo.sessionId,
			},
		});
	};

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

	play = async (data) => {
		/**
		 * Plays a track.
		 * @param {string} track - The track to play.
		 * @param {Object} options - The options for playing the track.
		 * @returns {Promise} A promise that resolves when the track starts playing.
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
		return await this.update({
			paused: true,
		});
	};

	resume = async () => {
		return await this.update({
			paused: false,
		});
	};

	setVolume = async (data) => {
		if (data >= 1000 || data < 0) {
			throw new Error('Volume must be between 0 and 1000');
		} else {
			return await this.update({
				volume: data,
			});
		}
	};

	setFilter = async (data) => {
		return await this.update({
			filters: data,
		});
	};

	getVolume = async () => {
		const { volume } = await this.get();
		return volume;
	};

	getFilters = async () => {
		const { filters } = await this.get();
		return filters;
	};

	seek = async (int) => {
		console.log(int);
		return await this.update({
			position: int,
		});
	};

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

	stopListen = async () => {
		if (!this.listeningWebSocket) return false;
		this.listeningWebSocket.close();
		this.listeningWebSocket = null;
		return true;
	};
}

module.exports = { Player };
