import { Request, Response, NextFunction } from 'express';
import pick from 'lodash.pick';
import { removeKey } from '../utils';
import { getMlbSchedule } from '../clients/MlbApiClient';
import MlbApiDay from '../types/MlbApiDay';
import MlbApiGame from '../types/MlbApiGame'

const dateParameterRegex: RegExp = /^\d{4}-\d{2}-\d{2}$/;

const getSchedule = async (req: Request, res: Response, next: NextFunction): Promise<Response> => {
    const { startDate, endDate } = req.query;

    if (!startDate) {
        return res.status(400).json({ message: "startDate is required" })
    } else if (!endDate) {
        return res.status(400).json({ message: "endDate is required" })
    } else if (typeof startDate !== 'string' || !dateParameterRegex.test(startDate)) {
        return res.status(400).json({ message: "startDate is invalid. It should be formatted yyyy-mm-dd" });
    } else if (typeof endDate !== 'string'|| !dateParameterRegex.test(endDate)) {
        return res.status(400).json({ message: "endDate is invalid. It should be formatted yyyy-mm-dd" });
    } else if (new Date(endDate) < new Date(startDate)) {
        return res.status(400).json({ message: "endDate must be on or after startDate" });
    }

    const schedule = await getMlbSchedule(startDate, endDate);
    return res.status(200).json(normalizeScheduleData(schedule));
};

/**
 * Normalizes the MLB API data to look the way we want.
 * @param schedule An array of MlbApiDay objects fetched from the MLB API.
 * @returns The normalized response to be returned
 */
const normalizeScheduleData = (schedule: Array<MlbApiDay>) => {
    const result: Array<MlbApiDay> = [];
    schedule.forEach((apiDay) => {
        const day: MlbApiDay = {date: apiDay.date, games: []}

        apiDay.games.forEach((apiGame: MlbApiGame) => {
            const game = pick(apiGame, ['officialDate', 'status', 'teams', 'venue', 'doubleHeader']);
            
            // TODO can we created nested logic or use something else to avoid all this reassigning?
            // TODO remove these nasty links
            game.status = pick(game.status, 'detailedState');
            game.teams.home = pick(game.teams.home, ['team', 'probablePitcher']);
            game.teams.home.probablePitcher
            game.teams.away = pick(game.teams.away, ['team', 'probablePitcher']);
            game.venue = pick(game.venue, ['id', 'name']);

            day.games.push(game);
        });

        removeKey(day, 'link');

        result.push(day);
    })

    return result;
}

export default {
    getSchedule,
}