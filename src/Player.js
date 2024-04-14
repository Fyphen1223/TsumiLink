const axios = require('axios');
const { EventEmitter } = require('events');

class Player extends EventEmitter {
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
