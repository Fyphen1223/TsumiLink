const { EventEmitter } = require('events');
const { Node } = require('./Node');

/**
 * Tsumi global variables
 * @type {Object}
 * @global
 */
global.tsumi = {};

/**
 * Tsumi global VC data
 * @type {Object}
 * @global
 */
global.tsumi.vcsData = {};

/**
 * Nodes
 * @type {Object}
 * @global
 */
var Nodes = {};

/**
 * Represents a Tsumi instance.
 * @extends EventEmitter
 * @class
 */
class TsumiInstance extends EventEmitter {
	/**
	 * @param {Object} options
	 * @param {string} options.botId - The bot ID
	 * @param {Function} options.sendPayload - The function to send payloads
	 * @param {string} options.userAgent - The user agent to use
	 * @return {Object} - An event emitter for listening
	 */
	constructor(options) {
		super();
		if (!options?.botId || !options?.sendPayload)
			throw new Error('Bot ID or sendPayload is required');

		/**
		 * This Instance's option
		 * @type {Object}
		 */
		this.options = options;

		/**
		 * This bot's ID
		 * @type {String}
		 */
		this.botId = options.botId;

		/**
		 * This Instance's user agent
		 * @type {String}
		 */
		this.userAgent = options?.userAgent || 'Tsumi/0.0.1';

		/**
		 * This Instance's bot ID
		 * @type {String}
		 */
		global.tsumi.botId = options.botId;
	}

	/**
	 * Purge all nodes
	 * @function
	 * @return {Boolean} - True if successful
	 */
	purge = () => {
		Nodes = {};
		return true;
	};

	/**
	 * Add a node to the instance
	 * @function
	 * @param {Object} node - The node to add
	 * @return {Object} - The node that was added
	 */
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
		this.emit('ready', newNode);
		return newNode;
	};

	/**
	 * Get the ideal node
	 * @function
	 * @return {Object} The ideal node
	 */
	getIdealNode = () => {
		return Nodes[sortNodesBySystemLoad(Nodes)];
	};
}

/**
 * Handling raw events for players
 * @function
 * @param {Object} data - The data to handle
 */
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

/**
 * Handle finding values in an object
 * @function
 * @param {Object} obj - The object to search
 * @param {string} searchKey - The key to search for
 * @return {Object} - The value of the key
 */
function findValue(obj, searchKey) {
	for (let key in obj) {
		if (obj[key].players && obj[key].players[searchKey]) {
			return obj[key].players[searchKey];
		}
	}
	return null;
}

/**
 * Sort nodes by system load
 * @function
 * @param {Object} nodes - The nodes to sort
 * @return {Object} - Nodes sorted by system load
 */
function sortNodesBySystemLoad(nodes) {
	let sortedNodes = Object.entries(nodes).sort(
		(a, b) => a[1].stats.cpu.systemLoad - b[1].stats.cpu.systemLoad
	);
	return sortedNodes.map((node) => node[0]);
}

module.exports = { TsumiInstance, handleRaw };
