import { Request, Response } from 'express';
import pick from 'lodash.pick';
import { DateTime } from "luxon";
import { removeKey } from '../utils';
import teamAbbreviations from '../utils/teamAbbreviations';
import { getMlbSchedule } from '../clients/MlbApiClient';
import { getMlbOdds } from '../clients/OddsApiClient';
import MlbApiDay from '../types/MlbApiDay';
import MlbApiGame from '../types/MlbApiGame';
import TheOddsGameOdds from '../types/TheOddsGameOdds';
import GameOdds from 'types/GameOdds';
import MlbGame from '../types/MlbGame';
import MlbDay from '../types/MlbDay';

const dateParameterRegex = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Adds a GameOdd to the oddsMap, or modifies an existing entry to be a tuple of two GameOdds (for a double-header)
 * 
 * @param oddsMap The odds map to modify
 * @param odds The odds object to insert
 * @param commenceTime the Date representing the start time of the game
 */
const processOdds = (oddsMap: Map<string, Map<number, GameOdds | [GameOdds, GameOdds]>>, odds: GameOdds, commenceTime: Date) => {
  const timeKey = DateTime.fromJSDate(commenceTime).ordinal // Only use the date as the key - the MLB API is inconsistent with start times for double headers

  const existingOdds = oddsMap?.get(odds.name)?.get(timeKey);
  if (existingOdds && !Array.isArray(existingOdds)) {
    oddsMap?.get(odds.name)?.set(timeKey, [existingOdds, odds]);
  } else {
    oddsMap?.get(odds.name)?.set(timeKey, odds);
  }
}

/**
 * Constructs a map of game odds from the raw API response, mapped as <Team name> -> ordinal date -> odds.
 * For example, "Detroit Tigers" -> 110 -> <game odds or tuple of 2 game odds>
 * 
 * @param odds The odds API response
 * @returns A map representing all of the game odds
 */
const buildOddsMap = (odds: Array<TheOddsGameOdds>): Map<string, Map<number, GameOdds | [GameOdds, GameOdds]>> => {
  // Maps team name -> odd.commence_time (as ordinal) -> the odds object to be put into the API response.
  const oddsMap = new Map<string, Map<number, GameOdds | [GameOdds, GameOdds]>>();

  teamAbbreviations.forEach((teamAbbr, teamName) => {
    oddsMap.set(teamName, new Map<number, GameOdds | [GameOdds, GameOdds]>);
  });

  odds.forEach((odd) => {
    const [outcome1, outcome2] = odd.bookmakers[0].markets[0].outcomes; // DraftKings
    const odds1 = {
      name: outcome1.name,
      price:
        outcome1.price > 0
          ? `+${outcome1.price}`
          : outcome1.price.toString(),
    };

    const odds2 = {
      name: outcome2.name,
      price:
        outcome2.price > 0
          ? `+${outcome2.price}`
          : outcome2.price.toString(),
    };
    
    processOdds(oddsMap, odds1, new Date(odd.commence_time));
    processOdds(oddsMap, odds2, new Date(odd.commence_time));
  });

  return oddsMap;
}

/**
 * Normalizes the MLB API data to look the way we want.
 * @param schedule An array of MlbApiDay objects fetched from the MLB API.
 * @param odds An array of MLB odds fetched from The Odds API
 * @returns The normalized response to be returned
 */
const normalizeScheduleData = (
  schedule: Array<MlbApiDay>,
  odds: Array<TheOddsGameOdds>
) => {
  const result: Array<MlbDay> = schedule.map((apiDay) => {
    const day: MlbDay = { date: apiDay.date, games: [] };

    const oddsMap = buildOddsMap(odds);

    let doubleHeaderFlag = false;
    apiDay.games.forEach((apiGame: MlbApiGame) => {
      const game: MlbGame = pick(apiGame, [
        'gameDate',
        'officialDate',
        'status',
        'teams',
        'venue',
        'doubleHeader',
      ]);

      // TODO can we created nested logic or use something else to avoid all this reassigning?
      game.status = pick(game.status, 'detailedState');
      game.teams.home = pick(game.teams.home, ['team', 'probablePitcher']);
      game.teams.away = pick(game.teams.away, ['team', 'probablePitcher']);
      game.venue = pick(game.venue, ['id', 'name']);

      const timeKey = DateTime.fromJSDate(new Date(game.gameDate)).ordinal;

      const homeOdds = oddsMap.get(game.teams.home.team.name)?.get(timeKey);
      const awayOdds = oddsMap.get(game.teams.away.team.name)?.get(timeKey);

      // home and away odds will always be the same type - it's not possible for homeOdds to be a tuple and awayOdds to be a single object
      if (Array.isArray(homeOdds) && Array.isArray(awayOdds)) {
        const gameIndex = doubleHeaderFlag ? 1 : 0;
        game.odds = [homeOdds[gameIndex], awayOdds[gameIndex]]
      } else if (homeOdds && awayOdds && !Array.isArray(homeOdds) && !Array.isArray(awayOdds)) {
        game.odds = [homeOdds, awayOdds]
      }

      if (game.doubleHeader === "Y") {
        doubleHeaderFlag = !doubleHeaderFlag;
      } else {
        doubleHeaderFlag = false;
      }

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
