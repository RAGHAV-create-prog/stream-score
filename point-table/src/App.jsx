import { useState } from "react";
import { initialState } from "./data/initialState";
import Leaderboard from "./components/Leaderboard";
import LivePanel from "./components/LivePanel";
import { calculateTeamPoints } from "./utils/calculatePoints";

function App() {
  const [state, setState] = useState(initialState);

  const handleKillChange = (teamId, delta) => {
    setState((prev) => {
      return {
        ...prev,
        currentMatch: {
          ...prev.currentMatch,
          teamStats: {
            ...prev.currentMatch.teamStats,
            [teamId]: {
              ...prev.currentMatch.teamStats[teamId],
              kills: Math.max(
                0,
                prev.currentMatch.teamStats[teamId].kills + delta
              ),
            },
          },
        },
      };
    });
  };

  const computedTeams = state.teams
    .map((team) => {
      const stats = state.currentMatch.teamStats[team.id];

      const totalPoints = calculateTeamPoints({
        kills: stats.kills,
        position: stats.position,
        killPoints: state.tournament.killPoints,
        positionPoints: state.tournament.positionPoints,
      });

      return {
        ...team,
        totalKills: stats.kills,
        totalPoints,
      };
    })
    .sort((a, b) => {
      if (b.totalPoints !== a.totalPoints) {
        return b.totalPoints - a.totalPoints;
      }
      return b.totalKills - a.totalKills;
    });

  return (
    <div className="min-h-screen bg-neutral-900 text-white flex">
      <div className="flex-1 p-6">
        <h1 className="text-2x
