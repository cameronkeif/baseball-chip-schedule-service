import MlbApiGame from './MlbApiGame';

export type MlbApiDay = {
  date: string;
  games: Array<MlbApiGame>;
};

export default MlbApiDay;
