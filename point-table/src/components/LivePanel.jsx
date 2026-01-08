export default function LivePanel({ match, teams = [], onKillChange }) {
  if (!match) {
    return <div>No active match</div>;
  }

  const getTeamName = (id) => {
    if (!Array.isArray(teams)) return `Team ${id}`;

    const team = teams.find((t) => t.id === Number(id));
    return team ? team.name : `Team ${id}`;
  };

  return (
    <div>
      <h2 className="text-lg font-semibold mb-4">
        Match {match.matchNumber} – {match.status.toUpperCase()}
      </h2>

      <div className="space-y-3">
        {Object.entries(match.teamStats || {}).map(([teamId, stats]) => (
          <div
            key={teamId}
            className="flex items-center justify-between bg-neutral-700 px-3 py-2 rounded"
          >
            <span className="font-medium">
              {getTeamName(teamId)}
            </span>

            <div className="flex items-center gap-2">
              <button
                className="px-2 py-1 bg-neutral-600 rounded"
                onClick={() => onKillChange(teamId, -1)}
                disabled={!stats || stats.kills === 0}
              >
                –
              </button>

              <span className="w-6 text-center">
                {stats?.kills ?? 0}
              </span>

              <button
                className="px-2 py-1 bg-green-600 rounded"
                onClick={() => onKillChange(teamId, 1)}
              >
                +
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
