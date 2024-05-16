const { EventEmitter } = require('events');
const { Node } = require('./Node');

/**
 * Nodes
 * @type {Object}
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
		this.userAgent = options?.userAgent || 'Tsumi/0.0.18';
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
		try {
			newNode.startWs();
			this.emit('nodeAdded', newNode);
			if (Object.keys(Nodes).length === 1) this.emit('ready');
		} catch (e) {
			this.emit('error', e);
			throw new Error(e);
		}
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

	/**
	 * Handling raw events for players
	 * @function
	 * @param {Object} data - The data to handle
	 */
	handleRaw = (data) => {
		switch (data.t) {
			case 'VOICE_SERVER_UPDATE': {
				const player = findValue(Nodes, data.d.guild_id);
				if (!player?.connectionInfo) return;
				player.connectionInfo.token = data.d.token;
				player.connectionInfo.endpoint = data.d.endpoint;
				if (player.connectionInfo.sessionId && player.connectionInfo.token) {
					player.connect();
				}
				break;
			}
			case 'VOICE_STATE_UPDATE': {
				const player = findValue(Nodes, data.d.guild_id);
				if (data.d.member.user.id !== global.tsumi.botId) return;
				if (data.d.channel_id === null) return (player.connectionInfo = {});
				if (data.d.session_id === player.connectionInfo?.sessionId) return;
				player.connectionInfo.sessionId = data.d.session_id;
				if (player.connectionInfo.sessionId && player.connectionInfo.token) {
					player.connect();
				}
				break;
			}
		}
	};
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

module.exports = { TsumiInstance };
