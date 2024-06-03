# TsumiLink

<p align="center">
<image src="https://github.com/Fyphen1223/Swallow/assets/89511960/872ace42-9e44-4092-96d2-5e82e6d85466" width="300px">
</p>

<a href="https://hits.seeyoufarm.com"><img src="https://hits.seeyoufarm.com/api/count/incr/badge.svg?url=https%3A%2F%2Fgithub.com%2FFyphen1223%2FTsumiLink&count_bg=%2379C83D&title_bg=%23555555&icon=&icon_color=%23E7E7E7&title=hits&edge_flat=false"/></a>

Fast, easy-to-use, reliable, feature-rich Lava/NodeLink compatible client.

Document released, check it out with the link in the description. STILL NOT WELL-DOCUMENTED, BE CAREFUL WHEN YOU USE THIS CLIENT. YOU MIGHT NEED TO LOOK THE CODE TO REALIZE WHAT THE CODE IS DOING.

This client is compatible with Node.js v18 or higher because of the use of globalThis.fetch().

For help, you should go to this [Discord Channel](https://discord.gg/wvKAHxgdVb) (offical LavaLink guild) and seek help.

# 💖 Super Thanks

@RainyXeon for letting me to borrow idea of drivers.
Here's a copyright for him.

```
Copyright (c) <2024>, RainyXeon
```

@ThePedroo for creating [NodeLink](https://github.com/PerformanC/NodeLink) and [Fastlink](https://github.com/PerformanC/FastLink) for the ideas.

# ✨ Related project

[Swallow](https://github.com/Fyphen1223/Swallow) is an ongoing project based on TsumiLink.

You can use it as an example for your bot.

# 💪 How to install

```
npm install tsumi
```

I STRONGLY RECOMMEND INSTALLING GITHUB REPO DIRECTLY SINCE NPM PACKAGE IS NOT UP-TO-DATE
or, if you prefer the latest feature, please directly install it with

```
npm install https://github.com/Fyphen1223/TsumiLink
```

# 📖 Docs

See [GitHub Webpages](https://fyphen1223.github.io/TsumiLink/) for documentation.

# 📕 Example

```js
const discord = require('discord.js');

const { TsumiInstance } = require('tsumi');

//You shuoldn't name TsumiInstance "tsumi". It will override core stuffs of TsumiLink.
const Tsumi = new TsumiInstance({
	botId: 'Your bot ID goes here',
	sendPayload: (guildId, payload) => {
		client.guilds.cache.get(guildId).shard.send(payload);
	},
	userAgent: 'Tsumi/0.0.2', //userAgent can be anything, but should be in this format: CLIENTNAME/VERSION
});

Tsumi.on('ready', () => {
	console.log('Tsumi is ready');
});

Tsumi.on('error', (e) => {
	console.log('Tsumi error');
});

/*
These avobe should be called before adding node
*/

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
	// since v0.0.17 on npm, global "handleRaw" function is no longer provided. Use TsumiInstance.handleRaw instead.
	Tsumi.handleRaw(data);
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

	//Also 'start' event is available
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
