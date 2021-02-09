const app = require('express')();
const axios = require('axios');
const ms = require('ms');

const spotify = new(require('node-spotify-api'))({
    id: process.env.SPOTIFYID,
    secret: process.env.SPOTIFYSECRET
});

const soundcloud = new (require('sc-searcher'))();
soundcloud.init(process.env.SOUNDCLOUD);

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

    console.log(user);

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

    const recentTrack = await axios.get(`http://ws.audioscrobbler.com/2.0/?method=user.getrecenttracks&user=itsnewt&api_key=${process.env.LASTFM}&format=json&limit=1`)
        .then(res => res.data.recenttracks.track[0]);
    const spotifyTrack = (await spotify.search({ type: 'track', query: `${recentTrack.artist['#text']} - ${recentTrack.name}`})).tracks.items[0];

    if (recentTrack.hasOwnProperty('@attr')) {
        try {
            res.send({
                name: spotifyTrack.name,
                type: 'spotify',
                osu: recentTrack.album['#text'] === 'osu!',
                url: spotifyTrack.external_urls.spotify,
                uri: spotifyTrack.uri,
                preview: spotifyTrack.preview_url,
                id: spotifyTrack.id,
                duration: ms(spotifyTrack.duration_ms, { long: true }),
                album: {
                    name: spotifyTrack.album.name,
                    url: spotifyTrack.album.external_urls.spotify,
                    uri: spotifyTrack.album.uri,
                    id: spotifyTrack.album.id,
                    images: spotifyTrack.album.images,
                    releaseDate: spotifyTrack.album.release_date,
                    trackCount: spotifyTrack.album.total_tracks,
                    trackNumber: spotifyTrack.track_number,
                },
                artists: await spotifyTrack.artists.map(artist => {
                    return {
                        name: artist.name,
                        url: artist.external_urls.spotify,
                        uri: artist.uri,
                        id: artist.id,
                    };
                }),
            });
        } catch (err) {
            try {
                const soundcloudTracks = await soundcloud.getTracks(encodeURI(`${recentTrack.artist['#text']} - ${recentTrack.name}`), 10);

                if (soundcloudTracks.length > 0) {
                    const soundcloudTrack = soundcloudTracks[0];

                    res.send({
                        name: recentTrack.name,
                        type: 'soundcloud',
                        osu: recentTrack.album['#text'] === 'osu!',
                        url: soundcloudTrack.permalink_url,
                        uri: soundcloudTrack.uri,
                        id: soundcloudTrack.id,
                        duration: ms(soundcloudTrack.full_duration, { long: true }),
                        album: recentTrack.album['#text'],
                        artist: soundcloudTrack.publisher_metadata.artist,
                        uploadedBy: soundcloudTrack.user.username,
                        artwork: soundcloudTrack.artwork_url,
                    })
                } else {
                    res.send({
                        name: recentTrack.name,
                        type: 'lastfm',
                        osu: recentTrack.album['#text'] === 'osu!',
                        url: recentTrack.url,
                        album: recentTrack.album['#text'],
                        artist: recentTrack.artist['#text'],
                    });
                }
            } catch (err) {
                res.send({ message: 'there was an error trying to fetch what newt was listening to!', error: err, });        
            }
        }
    } else {
        res.send({ message: 'newt is not listening to anything at the moment!' });
    }
});

module.exports = app;