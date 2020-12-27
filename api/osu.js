const axios = require('axios');

module.exports = async (_req, res) => {
    const data = (await axios.get(`https://osu.ppy.sh/api/get_user?k=${process.env.OSU}&u=16009610`)).data;
    res.send({ rank: formatNumber(data[0].pp_rank) });
};