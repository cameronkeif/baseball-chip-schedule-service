import { Request, Response, NextFunction } from 'express';
import pick from 'lodash.pick';
import { removeKey } from '../utils';
import { getMlbSchedule } from '../clients/MlbApiClient';
import { getMlbOdds } from '../clients/OddsApiClient'
import MlbApiDay from '../types/MlbApiDay';
import MlbApiGame from '../types/MlbApiGame'
import MlbGameOdds from '../types/MlbGameOdds';
import MlbGame from '../types/MlbGame';
import MlbDay from '../types/MlbDay';

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
    const odds = await getMlbOdds();

    return res.status(200).json(normalizeScheduleData(schedule, odds));
};

/**
 * Normalizes the MLB API data to look the way we want.
 * @param schedule An array of MlbApiDay objects fetched from the MLB API.
 * @param odds An array of MLB odds fetched from The Odds API
 * @returns The normalized response to be returned
 */
const normalizeScheduleData = (schedule: Array<MlbApiDay>, odds: Array<MlbGameOdds>) => {
    const result: Array<MlbDay> = schedule.map((apiDay) => {
        const day: MlbDay = {date: apiDay.date, games: []}

        apiDay.games.forEach((apiGame: MlbApiGame) => {
            const game: MlbGame = pick(apiGame, ['gameDate', 'officialDate', 'status', 'teams', 'venue', 'doubleHeader']);

            const homeTeam = game.teams.home.team.name;
            const awayTeam = game.teams.away.team.name;
            
            // TODO can we created nested logic or use something else to avoid all this reassigning?
            game.status = pick(game.status, 'detailedState');
            game.teams.home = pick(game.teams.home, ['team', 'probablePitcher']);
            game.teams.home.probablePitcher;
            game.teams.away = pick(game.teams.away, ['team', 'probablePitcher']);
            game.venue = pick(game.venue, ['id', 'name']);

            odds.forEach((odd) => {
                if (odd.commence_time === game.gameDate && odd.home_team === homeTeam && odd.away_team === awayTeam) {
                    game.odds = odd.bookmakers[0].markets[0].outcomes; // DraftKings
                }
            });

            day.games.push(game);
        });

        removeKey(day, 'link');

        return day;
    });

    return result;
}

export default {
    getSchedule,
}