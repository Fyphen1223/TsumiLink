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

Tsumi.on('nodeOpen', (node) => {
	console.log(`Node ${node.serverName} is now open`);
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
});

client.on('messageCreate', async (message) => {
	if (message.author.bot) return;
	if (message.content === 'p') {
		const node = Tsumi.getIdealNode();
		const player = node.createPlayer('919809544648020008');
		const res = await player.join(
			'919809544648020012',
			(data) => {
				client.guilds.cache.get('919809544648020008').shard.send(data);
			},
			{
				mute: false,
				deaf: false,
			}
		);
	}
});
client.login(config.token);
