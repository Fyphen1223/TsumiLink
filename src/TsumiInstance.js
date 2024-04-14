const { EventEmitter } = require('events');
const WebSocket = require('ws');
const { Node } = require('./Node');
const { send } = require('process');
global.tsumi = {};
global.tsumi.vcsData = {};
/**
 * Represents a Tsumi instance.
 * @class
 */
class TsumiInstance extends EventEmitter {
	constructor(options) {
		super();
		if (!options?.botId || !options?.sendPayload)
			throw new Error('Bot ID or sendPayload is required');
		this.options = options;
		this.botId = options.botId;
		global.tsumi.botId = options.botId;
	}
	Nodes = {};
	purge = () => {
		this.Nodes = {};
	};
	addNode = (node) => {
		if (!node.host || !node.port || !node.pass)
			throw new Error('Host, port, and pass are required');
		const newNode = new Node({
			serverName: node.serverName,
			secure: node.secure,
			host: node.host,
			port: node.port,
			pass: node.pass,
			userAgent: node.userAgent,
			botId: this.botId,
		});
		this.Nodes = { ...this.Nodes, [Object.keys(this.Nodes).length + 1]: newNode };
		newNode.startWs();
		newNode.on('open', () => {
			this.emit('nodeOpen', newNode);
		});
	};
	getIdealNode = () => {
		const keys = Object.keys(this.Nodes);
		const firstKey = keys[0];
		return this.Nodes[firstKey];
	};
}

function handleRaw(data) {
	console.log(data.t);
	switch (data.t) {
		case 'VOICE_SERVER_UPDATE': {
			if (!global.tsumi.vcsData[data.d.guild_id]) return;
			global.tsumi.vcsData[data.d.guild_id] = {
				token: data.d.token,
				endpoint: data.d.endpoint,
			};
			console.log(global.tsumi.vcsData);
			break;
		}
		case 'VOICE_STATE_UPDATE': {
			if (data.d.member.user.id !== global.tsumi.botId) return;
			if (data.d.channel_id === null) return delete vcsData[data.d.guild_id];
			if (data.d.session_id === vcsData[data.d.guild_id]?.sessionId) return;
			vcsData[data.d.guild_id] = {
				...vcsData[data.d.guild_id],
				sessionId: data.d.session_id,
			};
			console.log(global.tsumi.vcsData);
			break;
		}
	}
}
module.exports = { TsumiInstance, handleRaw };
