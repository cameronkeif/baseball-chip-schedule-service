import MlbApiGame from "./MlbApiGame";

export type MlbGame = MlbApiGame & {
    odds?: Array<{ name: string, price: string }>
};

export default MlbGame;
