export const initialState = {
  tournament: {
    name: "Demo Tournament",
    maxTeams: 16,
    killPoints: 1,
    positionPoints: {
      1: 15,
      2: 12,
      3: 10,
      4: 8,
      5: 6,
      6: 4,
      7: 2,
      8: 1,
    },
  },

  teams: [
    { id: 1, name: "Team Alpha", totalKills: 0, totalPoints: 0 },
    { id: 2, name: "Team Bravo", totalKills: 0, totalPoints: 0 },
  ],

  currentMatch: {
    matchNumber: 1,
    status: "live",
    teamStats: {
      1: { kills: 0, position: null },
      2: { kills: 0, position: null },
    },
  },
};
