const app = require('express')();
const axios = require('axios');
const ms = require('ms');
const musicInfo = require('music-info');
const { Client } = require('youtubei');
const youtube = new Client();

const cors = require('cors')({
    methods: ['GET', 'HEAD'],
});

const runMiddleware = (req, res, fn) => {
    return new Promise((resolve, reject) => {
        fn(req, res, (result) => {
        if (result instanceof Error) {
            return reject(result)
        }

        return resolve(result)
        })
    })
};

// osu
app.get('/api/osu', async (req, res) => {
    await runMiddleware(req, res, cors);

    const id = req.query.id ? req.query.id : '16009610';
    const user = (await axios.get(`https://osu.ppy.sh/api/get_user?k=${process.env.OSU}&u=${id}`)).data[0];

    res.send({ 
        username: user.username,
        id: parseInt(user.user_id),
        globalRank: parseInt(user.pp_rank),
        countryRank: parseInt(user.pp_country_rank),
        country: user.country,
        pp: parseFloat(user.pp_raw),
        level: parseInt(user.level),
        timePlayed: ms(parseInt(user.total_seconds_played) * 1000, { long: true }),
        accuracy: parseFloat(parseFloat(user.accuracy).toFixed(2)),
        avatar: `https://a.ppy.sh/${user.user_id}`,
        join_date: user.join_date,
        hits: {
            total: parseInt(user.count300) + parseInt(user.count100) + parseInt(user.count50),
            300: parseInt(user.count300),
            100: parseInt(user.count100),
            50: parseInt(user.count50),
        },
        playcount: parseInt(user.playcount),
        scores: {
            ranked: parseInt(user.ranked_score),
            total: parseInt(user.total_score),
        },
        ranks: {
            ss: {
                nomod: parseInt(user.count_rank_ss),
                hidden: parseInt(user.count_rank_ssh),
                total: parseInt(user.count_rank_ss) + parseInt(user.count_rank_ssh),
            },
            s: {
                nomod: parseInt(user.count_rank_s),
                hidden: parseInt(user.count_rank_sh),
                total: parseInt(user.count_rank_s) + parseInt(user.count_rank_sh),
            },
            a: user.count_rank_a,
        },
    });
});

// scrobbling
app.get('/api/scrobbling', async (req, res) => {
    await runMiddleware(req, res, cors);

    const scrobbled = await axios.get(`http://ws.audioscrobbler.com/2.0/?method=user.getrecenttracks&user=itsnewt&api_key=${process.env.LASTFM}&format=json&limit=1`)
        .then(res => res.data.recenttracks.track[0]);
    const track = await musicInfo.searchSong({ title: scrobbled.name, artist: scrobbled.artist['#text'] });
    const yt = (await youtube.search(`${track.artist} - ${track.title}`, { type: 'video' }))[0];

    if (track) {
        res.send({
            ...track,
            yt: {
                id: yt.id,
                title: yt.title,
                createdBy: yt.channel.name,
                url: `https://youtube.com/watch?v=${yt.id}`,
            },
        });
    } else {
        res.send({ message: 'newt is not listening to anything at the moment!' });
    }
});

module.exports = app;