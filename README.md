# TsumiLink

Fast, easy-to-use, reliable, feature-rich Lava/NodeLink compatible client.

NOT WELL-DOCUMENTED, BE CAREFUL WHEN YOU USE THIS CLIENT. YOU MIGHT NEED TO LOOK THE CODE TO REALIZE WHAT THE CODE IS DOING.

# How to install

```
npm install tsumi
```

or

```
npm install https://github.com/Fyphen1223/TsumiLink
```

# Docs

See [GitHub Webpages](https://fyphen1223.github.io/TsumiLink/) for documentation.

# Example

```js
const discord = require('discord.js');

const { TsumiInstance, handleRaw } = require('tsumi');

const Tsumi = new TsumiInstance({
	botId: 'Your bot ID goes here',
	sendPayload: (guildId, payload) => {
		client.guilds.cache.get(guildId).shard.send(payload);
	},
	userAgent: 'Tsumi/0.0.2', //userAgent can be anything, but should be in this format: CLIENTNAME/VERSION
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
		discord.GatewayIntentBits.GuildMembers,
		discord.GatewayIntentBits.GuildMessages,
		discord.GatewayIntentBits.GuildPresences,
		discord.GatewayIntentBits.Guilds,
		discord.IntentsBitField.Flags.MessageContent,
		discord.IntentsBitField.Flags.GuildVoiceStates, //You MUST ENABLE this
	],
	partials: [
		discord.Partials.Channel,
		discord.Partials.GuildMember
		discord.Partials.Message,
		discord.Partials.User,
	],
});

client.on('raw', async (data) => {
	handleRaw(data);
});
/*
This is very important, please write this code. If there's no code like this above, the entire Tsumi won't work at all!
*/

client.on('ready', async () => {
	console.log('Ready');
	const node = Tsumi.getIdealNode();
	await wait(1000); //This is just for delay, but deleting this might let Tsumi to send request too early to the server so I do not recommend deleting this line.
	//But for comman implementation, you DON'T NEED to write this kind of dumb code
	const player = await node.joinVoiceChannel({
		guildId: '919809544648020008',
		channelId: '919809544648020012',
	});
	const data = await node.loadTracks('ytsearch:Alan Walker The Spectre');
	await player.play({
		track: {
			encoded: data.data[0].encoded,
		}
	});
	player.on('trackStart', async (data) => {
		await wait(2000);
		await player.pause();
		await wait(2000);
		await player.resume();
		await player.seek(20000);
		const record = await player.startListen();
		console.log('Start Speaking');
		record.on('endSpeaking', (voice) => {
			const base64Voice = voice.data;
			//Do your own stuff here, or wait until I create this part of code
			//See /test/test.js for more information
		});
		await node.leaveVoiceChannel('919809544648020008');
	});
});
client.login('Yout Bot token goes here');
```
