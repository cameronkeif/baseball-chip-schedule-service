import MlbApiGame from "./MlbApiGame";
import MlbGameOdds from "./MlbGameOdds";

export type MlbGame = MlbApiGame & {
    odds?: Array<{ name: string, price: number }>
};

export default MlbGame;
