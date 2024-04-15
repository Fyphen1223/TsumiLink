const axios = require('axios');
const { EventEmitter } = require('events');

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
		this.guildId = options.guildId;
		this.node = options.node;
		this.connectionInfo = {
			token: null,
			endpoint: null,
			sessionId: null,
		};
		this.node.ws.on('message', (data) => {
			this.emit('message', data);
		});
	}
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
	pause = async (data) => {};
	resume = async (data) => {};
}

module.exports = { Player };
