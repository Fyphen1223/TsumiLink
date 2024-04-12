```js
const { TsumiInstance, handleRaw } = require('tsumilink');

const new Tsumi = new TsumiInstance({
	botId: ,
	config: {
		
	}
});

Tsumi.addNode({
	host: '',
	secure: '',
	pass: '',
	port: 8888
});

const node = Tsumi.getIdealNode();

const player = node.createPlayer(guildId);

const track = node.loadTrack('ytsearch:never gonna give you up');

player.join({
	voiceId: '',
	deafen: ,
	mute: ,
});

player.play(track.encoded);

player.pause();
player.resume();

player.seek();

player.leave();

client.on('raw', (data) => handleRaw(data));
```
