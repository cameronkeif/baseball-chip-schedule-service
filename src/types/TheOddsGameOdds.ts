import TheOddsBookmaker from './TheOddsBookmaker';

export type MlbGameOdds = {
  away_team: string;
  home_team: string;
  commence_time: string;
  bookmakers: Array<TheOddsBookmaker>;
};

export default MlbGameOdds;
