const { EventEmitter } = require('events');
const WebSocket = require('ws');
const { Node } = require('./Node');
const { Player } = require('./Player');
const { send } = require('process');
global.tsumi = {};
global.tsumi.vcsData = {};
var Nodes = {};
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
		this.userAgent = options?.userAgent || 'Tsumi/0.0.1';
		global.tsumi.botId = options.botId;
	}
	purge = () => {
		Nodes = {};
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
			userAgent: this.userAgent,
			botId: this.botId,
			sendPayload: this.options.sendPayload,
		});
		Nodes = { ...Nodes, [Object.keys(Nodes).length + 1]: newNode };
		newNode.startWs();
		newNode.on('open', () => {
			this.emit('nodeOpen', newNode);
		});
	};
	getIdealNode = () => {
		return Nodes[sortNodesBySystemLoad(Nodes)];
	};
}

function handleRaw(data) {
	switch (data.t) {
		case 'VOICE_SERVER_UPDATE': {
			if (!global.tsumi.vcsData[data.d.guild_id]) return;
			global.tsumi.vcsData[data.d.guild_id] = {
				...global.tsumi.vcsData[data.d.guild_id],
				token: data.d.token,
				endpoint: data.d.endpoint,
			};
			if (
				global.tsumi.vcsData[data.d.guild_id].sessionId &&
				global.tsumi.vcsData[data.d.guild_id].token
			) {
				const player = findValue(Nodes, data.d.guild_id);
				player.connectionInfo = {
					token: global.tsumi.vcsData[data.d.guild_id].token,
					endpoint: global.tsumi.vcsData[data.d.guild_id].endpoint,
					sessionId: global.tsumi.vcsData[data.d.guild_id].sessionId,
				};
				player.connect();
				delete global.tsumi.vcsData[data.d.guild_id];
			}
			break;
		}
		case 'VOICE_STATE_UPDATE': {
			if (data.d.member.user.id !== global.tsumi.botId) return;
			if (data.d.channel_id === null) return delete global.tsumi.vcsData[data.d.guild_id];
			if (data.d.session_id === global.tsumi.vcsData[data.d.guild_id]?.sessionId) return;
			global.tsumi.vcsData[data.d.guild_id] = {
				...global.tsumi.vcsData[data.d.guild_id],
				sessionId: data.d.session_id,
			};
			if (
				global.tsumi.vcsData[data.d.guild_id].sessionId &&
				global.tsumi.vcsData[data.d.guild_id].token
			) {
				const player = findValue(Nodes, data.d.guild_id);
				player.connectionInfo = {
					token: global.tsumi.vcsData[data.d.guild_id].token,
					endpoint: global.tsumi.vcsData[data.d.guild_id].endpoint,
					sessionId: global.tsumi.vcsData[data.d.guild_id].sessionId,
				};
				player.connect();
				delete global.tsumi.vcsData[data.d.guild_id];
			}
			break;
		}
	}
}

function findValue(obj, searchKey) {
	for (let key in obj) {
		if (obj[key].players && obj[key].players[searchKey]) {
			return obj[key].players[searchKey];
		}
	}
	return null;
}

function sortNodesBySystemLoad(nodes) {
	let sortedNodes = Object.entries(nodes).sort(
		(a, b) => a[1].stats.cpu.systemLoad - b[1].stats.cpu.systemLoad
	);
	return sortedNodes.map((node) => node[0]);
}

module.exports = { TsumiInstance, handleRaw };
