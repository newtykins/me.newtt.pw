const axios = require('axios');
const spotify = new(require('node-spotify-api'))({
    id: process.env.SPOTIFYID,
    secret: process.env.SPOTIFYSECRET
});

module.export = async (_req, res) => {
    const recentTrack = await axios.get(`http://ws.audioscrobbler.com/2.0/?method=user.getrecenttracks&user=itsnewt&api_key=${process.env.LASTFM}&format=json&limit=1`)
        .then(res => res.data.recenttracks.track[0]);
    const spotifyTrack = (await spotify.search({ type: 'track', query: `${recentTrack.artist['#text']} - ${recentTrack.name}`})).tracks.items[0];
    const nowPlaying = recentTrack.hasOwnProperty('@attr');

    if (nowPlaying) {
        res.send({
            name: spotifyTrack.name,
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
    } else {
        res.send({ message: 'newt is not listening to anything at the moment!' });
    }
}