import axios from 'axios';
import MlbGameOdds from '../types/MlbGameOdds';

export const getMlbOdds = async (): Promise<Array<MlbGameOdds>> => {
    // TODO use API key here, don't hardcode it.
    const url = `https://api.the-odds-api.com/v4/sports/baseball_mlb/odds/?regions=us&oddsFormat=american&apiKey=${process.env.THE_ODDS_API_KEY}`;
    const response = await axios.get(url, {
        headers: {
            'Accept-Encoding': 'application/json',
        }
    });

    return response.data;
}

export default {
    getMlbOdds,
};
