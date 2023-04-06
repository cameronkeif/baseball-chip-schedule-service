import { MlbApiTeam } from './MlbApiTeam';

export type MlbApiGame = {
  officialDate: string;
  gameDate: string;
  status: {
    detailedState: string;
  };
  teams: {
    away: MlbApiTeam;
    home: MlbApiTeam;
  };
  venue: {
    id: number;
    name: string;
  };
  doubleHeader: string;
};

export default MlbApiGame;
