const { TsumiInstance, handleRaw } = require('../src/TsumiInstance');
const { Node } = require('../src/Node');

const discord = require('discord.js');

const config = require('./config.json');

const Tsumi = new TsumiInstance({
	botId: config.botId,
	sendPayload: (guildId, payload) => {
		client.guilds.cache.get(guildId).shard.send(payload);
	},
});

Tsumi.addNode({
	serverName: 'Tsumi',
	secure: false,
	host: 'localhost',
	pass: 'youshallnotpass',
	port: 2333,
});

const client = new discord.Client({
	intents: [
		discord.GatewayIntentBits.DirectMessageReactions,
		discord.GatewayIntentBits.DirectMessageTyping,
		discord.GatewayIntentBits.DirectMessages,
		discord.GatewayIntentBits.GuildBans,
		discord.GatewayIntentBits.GuildEmojisAndStickers,
		discord.GatewayIntentBits.GuildIntegrations,
		discord.GatewayIntentBits.GuildInvites,
		discord.GatewayIntentBits.GuildMembers,
		discord.GatewayIntentBits.GuildMessageReactions,
		discord.GatewayIntentBits.GuildMessageTyping,
		discord.GatewayIntentBits.GuildMessages,
		discord.GatewayIntentBits.GuildPresences,
		discord.GatewayIntentBits.GuildScheduledEvents,
		discord.GatewayIntentBits.GuildVoiceStates,
		discord.GatewayIntentBits.GuildWebhooks,
		discord.GatewayIntentBits.Guilds,
		discord.GatewayIntentBits.MessageContent,
		discord.IntentsBitField.Flags.Guilds,
		discord.IntentsBitField.Flags.MessageContent,
		discord.IntentsBitField.Flags.GuildMessages,
		discord.IntentsBitField.Flags.GuildVoiceStates,
	],
	partials: [
		discord.Partials.Channel,
		discord.Partials.GuildMember,
		discord.Partials.GuildScheduledEvent,
		discord.Partials.Message,
		discord.Partials.Reaction,
		discord.Partials.ThreadMember,
		discord.Partials.User,
	],
});

client.on('raw', async (data) => {
	handleRaw(data);
});

client.on('ready', async () => {
	console.log('Ready');
	const node = Tsumi.getIdealNode();
	node.on('ready', () => {
		console.log('Node is ready');
	});
	const player = node.joinVoiceChannel({
		guildId: '919809544648020008',
		channelId: '919809544648020012',
	});
	await player.play({
		track: 'QAABAwMAXEZvbyBGaWdodGVycyBXaXRoIFJpY2sgQXN0bGV5IC0gTmV2ZXIgR29ubmEgR2l2ZSBZb3UgVXAgIC0gTG9uZG9uIE8yIEFyZW5hIDE5IFNlcHRlbWJlciAyMDE3AA9Hb3Rzb21lUGVhcmxKYW0AAAAAAAQ98AALSWRrQ0Vpb0NwMjQAAQAraHR0cHM6Ly93d3cueW91dHViZS5jb20vd2F0Y2g/dj1JZGtDRWlvQ3AyNAEAOmh0dHBzOi8vaS55dGltZy5jb20vdmlfd2VicC9JZGtDRWlvQ3AyNC9tYXhyZXNkZWZhdWx0LndlYnAAAAd5b3V0dWJlAAAAAAAAAAA=',
	});
	await player.setVolume(100);
	console.log(await player.getVolume());
});
client.login(config.token);
