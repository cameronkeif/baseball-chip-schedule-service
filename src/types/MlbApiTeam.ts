export type MlbApiTeam = {
  team: {
    id: number;
    name: string;
  };
  probablePitcher?: {
    id: number;
    fullName: string;
  };
};

export default MlbApiTeam;
