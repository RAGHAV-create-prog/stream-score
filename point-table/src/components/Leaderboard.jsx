export default function Leaderboard({ teams }) {
  return (
    <div className="bg-neutral-800 rounded-lg overflow-hidden">
      <div className="grid grid-cols-4 bg-neutral-700 px-4 py-2 text-sm font-semibold">
        <div>Rank</div>
        <div>Team</div>
        <div>Kills</div>
        <div>Points</div>
      </div>

      {teams.map((team, index) => (
        <div
          key={team.id}
          className="grid grid-cols-4 px-4 py-2 border-t border-neutral-700"
        >
          <div>{index + 1}</div>
          <div>{team.name}</div>
          <div>{team.totalKills}</div>
          <div>{team.totalPoints}</div>
        </div>
      ))}
    </div>
  );
}
