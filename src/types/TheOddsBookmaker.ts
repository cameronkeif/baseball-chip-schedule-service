export type TheOddsBookmaker = {
    key: string,
    markets: Array<{
        key: string,
        outcomes: Array<{ name: string, price: number }>
    }>
};

export default TheOddsBookmaker;
