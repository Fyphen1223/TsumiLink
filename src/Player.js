const axios = require('axios');
const { EventEmitter } = require('events');

class Player extends EventEmitter {
	constructor(options) {
		super();
		this.guildId = options.guildId;
	}
	join = async (channelId, shard, options) => {
		global.tsumi.vcsData[this.guildId] = {
			token: null,
			endpoint: null,
			sessionId: null,
		};
		const res = await shard(
			this.guildId,
			JSON.stringify({
				op: 4,
				d: {
					guild_id: this.guildId,
					channel_id: channelId,
					self_mute: options?.mute ?? false,
					self_deaf: options?.deaf ?? false,
				},
			})
		);
		console.log('Hi!');
		return res;
	};
}

module.exports = { Player };
