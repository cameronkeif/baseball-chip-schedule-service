# Baseball Chip Schedule Service

This is the schedule service for baseball chip. It allows you to get a schedule of MLB games including the starting pitcher and game odds from [DraftKings](https://www.draftkings.com/).

## Endpoints

GET /schedule
| Parameter      | Expected Value | Required? |
| ----------- | ----------- | ----------- |
| startDate      | Date as a string formatted yyyy-mm-dd | yes |
| endDate      | Date as a string formatted yyyy-mm-dd (must be on or after startDate)| yes |
| includeOdds      | true or false | no (defaults to false) |

## Environment Variables

`THE_ODDS_API_KEY` - your API key from [The Odds API](https://the-odds-api.com/). If this isn't set, you can't use the `includeOdds` query parameter

## How to run

`npm run dev` will stand this up by itself on port 6060 by default. You can also use the Dockerfile to run this in Docker.
