import { Request, Response } from 'express';
import pick from 'lodash.pick';
import { removeKey } from '../utils';
import { getMlbSchedule } from '../clients/MlbApiClient';
import { getMlbOdds } from '../clients/OddsApiClient';
import MlbApiDay from '../types/MlbApiDay';
import MlbApiGame from '../types/MlbApiGame';
import MlbGameOdds from '../types/MlbGameOdds';
import MlbGame from '../types/MlbGame';
import MlbDay from '../types/MlbDay';

const dateParameterRegex = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Normalizes the MLB API data to look the way we want.
 * @param schedule An array of MlbApiDay objects fetched from the MLB API.
 * @param odds An array of MLB odds fetched from The Odds API
 * @returns The normalized response to be returned
 */
const normalizeScheduleData = (
  schedule: Array<MlbApiDay>,
  odds: Array<MlbGameOdds>
) => {
  const result: Array<MlbDay> = schedule.map((apiDay) => {
    const day: MlbDay = { date: apiDay.date, games: [] };

    apiDay.games.forEach((apiGame: MlbApiGame) => {
      const game: MlbGame = pick(apiGame, [
        'gameDate',
        'officialDate',
        'status',
        'teams',
        'venue',
        'doubleHeader',
      ]);

      const homeTeam = game.teams.home.team.name;
      const awayTeam = game.teams.away.team.name;

      // TODO can we created nested logic or use something else to avoid all this reassigning?
      game.status = pick(game.status, 'detailedState');
      game.teams.home = pick(game.teams.home, ['team', 'probablePitcher']);
      game.teams.away = pick(game.teams.away, ['team', 'probablePitcher']);
      game.venue = pick(game.venue, ['id', 'name']);

      odds.forEach((odd) => {
        if (
          odd.commence_time === game.gameDate &&
          odd.home_team === homeTeam &&
          odd.away_team === awayTeam
        ) {
          const [outcome1, outcome2] = odd.bookmakers[0].markets[0].outcomes; // DraftKings
          const outcome1Response = {
            name: outcome1.name,
            price:
              outcome1.price > 0
                ? `+${outcome1.price}`
                : outcome1.price.toString(),
          };

          const outcome2Response = {
            name: outcome2.name,
            price:
              outcome2.price > 0
                ? `+${outcome2.price}`
                : outcome2.price.toString(),
          };

          game.odds = [outcome1Response, outcome2Response];
        }
      });

      day.games.push(game);
    });

    removeKey(day, 'link');

    return day;
  });

  return result;
};


const getSchedule = async (req: Request, res: Response): Promise<Response> => {
  const { startDate, endDate, includeOdds } = req.query;

  if (!startDate) {
    return res.status(400).json({ message: 'startDate is required' });
  } else if (!endDate) {
    return res.status(400).json({ message: 'endDate is required' });
  } else if (
    typeof startDate !== 'string' ||
    !dateParameterRegex.test(startDate)
  ) {
    return res.status(400).json({
      message: 'startDate is invalid. It should be formatted yyyy-mm-dd',
    });
  } else if (typeof endDate !== 'string' || !dateParameterRegex.test(endDate)) {
    return res.status(400).json({
      message: 'endDate is invalid. It should be formatted yyyy-mm-dd',
    });
  } else if (new Date(endDate) < new Date(startDate)) {
    return res
      .status(400)
      .json({ message: 'endDate must be on or after startDate' });
  }

  if (includeOdds) {
    if (
      typeof includeOdds !== 'string' ||
      (includeOdds !== 'true' && includeOdds !== 'false')
    ) {
      return res.status(400).json({
        message: 'includeOdds must be either "true" or "false" if included',
      });
    }
  }

  const schedule = await getMlbSchedule(startDate, endDate);
  const odds = includeOdds === 'true' ? await getMlbOdds() : [];

  return res.status(200).json(normalizeScheduleData(schedule, odds));
};

export default {
  getSchedule,
};
