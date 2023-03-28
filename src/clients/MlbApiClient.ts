import axios from 'axios';
import MlbApiDay from '../types/MlbApiDay';

export const getMlbSchedule = async (startDate: string, endDate: string): Promise<Array<MlbApiDay>> => {
    const url = `https://statsapi.mlb.com/api/v1/schedule/games/?sportId=1&startDate=${startDate}&endDate=${endDate}&hydrate=probablePitcher`;
    const response = await axios.get(url, {
        headers: {
            'Accept-Encoding': 'application/json',
        }
    });

    return response.data.dates;
}

export default {
    getMlbSchedule,
};
