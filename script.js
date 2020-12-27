// newt's song
fetch(new URL('https://me.newtt.pw/api/song'))
    .then(res => res.json())
    .then(res => {
        // Fetch the element
        const el = document.getElementById('song');

        if (!res.hasOwnProperty('message')) {
            // Update the content of the element
            const artist = res.artists[0].name.toLowerCase();
            const song = res.name.toLowerCase();
            el.innerHTML = `newt is currently listening to: <a href="${res.url}">${artist} - ${song}</a>`;

            console.log(`Currently listening to ${artist} - ${song}`);
            console.log(res);
        } else {
            el.innerHTML = 'newt is not listening to anything at the moment!'
            console.log('Currently listening to nothing!');
        }
    })
    .catch(err => console.error('There was an issue fetching data about newt\'s current song. Sorry!', err));

// newt's osu profile
fetch(new URL('https://me.newtt.pw/api/osu'))
    .then(res => res.json())
    .then(res => {
        document.getElementById('username').innerText = res.username;
        document.getElementById('id').innerText = res.id;
        document.getElementById('rank').innerText = res.globalRank;
        document.getElementById('pp').innerText = res.pp;
        document.getElementById('level').innerText = res.level;

        console.log(res);
    })
    .catch(err => console.error('There was an issue fetching information about newt\'s osu profile. Sorry!', err));
    
// mute's osu profile
fetch(new URL('https://me.newtt.pw/api/osu?id=18137394'))
.then(res => res.json())
.then(res => {
    document.getElementById('username2').innerText = res.username;
    document.getElementById('id2').innerText = res.id;
    document.getElementById('rank2').innerText = res.globalRank;
    document.getElementById('pp2').innerText = res.pp;
    document.getElementById('level2').innerText = res.level;

    console.log(res);
})
.catch(err => console.error('There was an issue fetching information about mute\'s osu profile. Sorry!', err));