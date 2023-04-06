import MlbGame from './MlbApiGame';

export type MlbDay = {
  date: string;
  games: Array<MlbGame>;
};

export default MlbDay;
