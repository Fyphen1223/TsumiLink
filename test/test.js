const { TsumiInstance, handleRaw } = require('../src/TsumiInstance');
const { Node } = require('../src/Node');

const fs = require('fs');

const ffmpeg = require('fluent-ffmpeg');
const prism = require('prism-media');

const discord = require('discord.js');

const config = require('./config.json');

const Tsumi = new TsumiInstance({
	botId: config.botId,
	sendPayload: (guildId, payload) => {
		client.guilds.cache.get(guildId).shard.send(payload);
	},
	userAgent: 'Tsumi/0.0.2',
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

function wait(ms) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

client.on('ready', async () => {
	console.log('Ready');
	const node = Tsumi.getIdealNode();
	await wait(1000);
	const player = await node.joinVoiceChannel({
		guildId: '919809544648020008',
		channelId: '919809544648020012',
	});
	const data = await node.loadTracks('ytsearch:Alan Walker The Spectre');
	await player.play({
		track: data.data[0].encoded,
	});
	player.on('trackStart', async (data) => {
		await wait(500);
		const record = await player.startListen();
		console.log('Start Speaking');
		record.on('endSpeaking', (voice) => {
			const base64Voice = voice.data;
			const buffer = Buffer.from(base64Voice, 'base64');
			let readable = new require('stream').Readable();
			readable._read = () => {};
			readable.push(buffer);
			readable.push(null);
			let transcoder = new prism.FFmpeg({
				args: [
					'-analyzeduration',
					'0',
					'-loglevel',
					'0',
					'-f',
					's16le',
					'-ar',
					'48000',
					'-ac',
					'2',
				],
			});
			const s16le = readable.pipe(transcoder);
			const opus = s16le.pipe(
				new prism.opus.Encoder({ rate: 48000, channels: 2, frameSize: 960 })
			);
		});
	});
});
client.login(config.token);
