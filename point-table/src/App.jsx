import { useState, useEffect } from "react";

/* INLINE STATE TO AVOID PATH ISSUES */
const STORAGE_KEY = "pt_tournament_v1";

const initialState = {
  tournament: {
    name: "Stream Score",
    maxTeams: 16,
    killPoints: 1,
    started: false,
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
    resultsApplied: false,
    teamStats: {
      1: { kills: 0, position: null },
      2: { kills: 0, position: null },
    },
  },
};

// simple points calculator (inlined to avoid missing utils file)
export function calculateTeamPoints({
  kills = 0,
  position = null,
  killPoints = 1,
  positionPoints = {},
}) {
  const posPoints = position != null ? positionPoints[position] ?? 0 : 0;
  return kills * killPoints + posPoints;
}

// minimal Leaderboard component (inlined)
export function Leaderboard({ teams, obsMode = false }) {
  if (obsMode) {
    // Clean, large-text leaderboard for OBS
    return (
      <div className="w-full h-full flex items-center justify-center">
        <ol className="text-6xl font-bold leading-tight text-center list-none p-0 m-0">
          {teams.map((t, i) => (
            <li key={t.id} className="mb-6">
              <div>
                {i + 1}. {t.name} — {t.totalPoints} pts
              </div>
            </li>
          ))}
        </ol>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-xl font-medium mb-2">Leaderboard</h2>
      <ol className="list-decimal ml-5">
        {teams.map((t) => (
          <li key={t.id} className="mb-1">
            <div className="flex justify-between">
              <div>
                <strong>{t.name}</strong>
              </div>
              <div className="text-sm text-gray-300">
                {t.totalPoints} pts • {t.totalKills} kills
              </div>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

// LivePanel now supports End Match, position selection, Apply Results and Next Match
export function LivePanel({
  match,
  teams,
  onKillChange,
  onEndMatch,
  onPositionChange,
  onApplyResults,
  onCancelEnd,
  onNextMatch,
}) {
  const locked = match.status !== "live";

  return (
    <div>
      <h3 className="text-lg font-medium mb-3">
        Match #{match.matchNumber} — {match.status === "live" ? "LIVE" : "ENDED"}
      </h3>
      <div className="space-y-3">
        {teams.map((team) => {
          const stats = match.teamStats[team.id] || { kills: 0, position: null };
          return (
            <div key={team.id} className="p-2 bg-neutral-900 rounded">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">{team.name}</div>
                  <div className="text-sm text-gray-400">Kills: {stats.kills}</div>
                </div>

                <div className="flex items-center gap-3 whitespace-nowrap">
                  {locked ? (
                    <select
                      aria-label={`position ${team.name}`}
                      value={stats.position ?? ""}
                      onChange={(e) =>
                        onPositionChange(
                          team.id,
                          e.target.value ? parseInt(e.target.value, 10) : null
                        )
                      }
                      className="bg-neutral-700 text-sm px-2 py-1 rounded"
                    >
                      <option value="">Pos</option>
                      {Array.from({ length: teams.length }).map((_, i) => (
                        <option key={i + 1} value={i + 1}>
                          {i + 1}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <>
                      <button
                        onClick={() => onKillChange(team.id, -1)}
                        aria-label={`decrease ${team.name} kills`}
                        className="inline-flex items-center justify-center px-3 py-1 bg-red-600 rounded"
                      >
                        -
                      </button>
                      <div className="px-2 text-lg">{stats.kills}</div>
                      <button
                        onClick={() => onKillChange(team.id, 1)}
                        aria-label={`increase ${team.name} kills`}
                        className="inline-flex items-center justify-center px-3 py-1 bg-green-600 rounded"
                      >
                        +
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 flex gap-2">
        {match.status === "live" ? (
          <button onClick={onEndMatch} className="px-3 py-2 bg-yellow-600 rounded">
            End Match
          </button>
        ) : (
          <>
            {!match.resultsApplied ? (
              <button onClick={onApplyResults} className="px-3 py-2 bg-green-600 rounded">
                Apply Results
              </button>
            ) : (
              <button onClick={onNextMatch} className="px-3 py-2 bg-blue-600 rounded">
                Next Match
              </button>
            )}

            <button onClick={onCancelEnd} className="px-3 py-2 bg-red-600 rounded">
              Cancel
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function App() {
  // restore from localStorage if available, fallback to initialState
  const [state, setState] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return initialState;
      const parsed = JSON.parse(raw);
      return parsed?.state ?? initialState;
    } catch {
      return initialState;
    }
  });

  // load presets from storage (persisted alongside state)
  const [presets, setPresets] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return parsed?.presets ?? [];
    } catch {
      return [];
    }
  });

  // selected preset id (default to first preset if available)
  const [selectedPreset, setSelectedPreset] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return "";
      const parsed = JSON.parse(raw);
      const loadedPresets = parsed?.presets ?? [];
      return loadedPresets.length ? loadedPresets[0].id : "";
    } catch {
      return "";
    }
  });

  const [obsMode, setObsMode] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return false;
      const parsed = JSON.parse(raw);
      return !!parsed?.obsMode;
    } catch {
      return false;
    }
  });

  // lastResults stored separately so we can copy most-recent applied match
  const [lastResults, setLastResults] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return parsed?.lastResults ?? null;
    } catch {
      return null;
    }
  });

  // copy feedback (simple)
  const [copying, setCopying] = useState(false);

  // persist to localStorage on changes (include presets)
  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ state, obsMode, lastResults, presets, selectedPreset })
      );
    } catch {}
  }, [state, obsMode, lastResults, presets, selectedPreset]);

  // ---------- Setup helpers ----------
  const handleAddTeam = () => {
    setState((prev) => {
      const maxId = prev.teams.reduce((m, t) => Math.max(m, t.id), 0);
      const newId = maxId + 1;
      const newTeam = { id: newId, name: `Team ${newId}`, totalKills: 0, totalPoints: 0 };
      const newTeams = [...prev.teams, newTeam];

      // extend currentMatch.teamStats
      const newTeamStats = { ...prev.currentMatch.teamStats, [newId]: { kills: 0, position: null } };

      return {
        ...prev,
        teams: newTeams,
        currentMatch: { ...prev.currentMatch, teamStats: newTeamStats },
      };
    });
  };

  const handleRemoveTeam = (id) => {
    setState((prev) => {
      const newTeams = prev.teams.filter((t) => t.id !== id);
      const newTeamStats = { ...prev.currentMatch.teamStats };
      delete newTeamStats[id];
      return {
        ...prev,
        teams: newTeams,
        currentMatch: { ...prev.currentMatch, teamStats: newTeamStats },
      };
    });
  };

  const handleEditTeamName = (id, newName) => {
    setState((prev) => ({ ...prev, teams: prev.teams.map((t) => (t.id === id ? { ...t, name: newName } : t)) }));
  };

  const handleSetKillPoints = (v) => {
    const n = parseFloat(v) || 0;
    setState((prev) => ({ ...prev, tournament: { ...prev.tournament, killPoints: n } }));
  };

  const handleSetPositionPoint = (pos, v) => {
    const n = parseFloat(v) || 0;
    setState((prev) => ({
      ...prev,
      tournament: { ...prev.tournament, positionPoints: { ...prev.tournament.positionPoints, [pos]: n } },
    }));
  };

  // add a new position slot (e.g. increase from 8 to 9, etc.)
  const handleAddPositionSlot = () => {
    setState((prev) => {
      const current = prev.tournament.positionPoints || {};
      const keys = Object.keys(current).map((k) => parseInt(k, 10)).filter(Boolean);
      const maxPos = keys.length ? Math.max(...keys) : 0;
      const next = maxPos + 1;
      return { ...prev, tournament: { ...prev.tournament, positionPoints: { ...current, [next]: 0 } } };
    });
  };

  // remove the highest position slot
  const handleRemovePositionSlot = () => {
    setState((prev) => {
      const current = { ...(prev.tournament.positionPoints || {}) };
      const keys = Object.keys(current).map((k) => parseInt(k, 10)).filter(Boolean);
      if (keys.length === 0) return prev;
      const maxPos = Math.max(...keys);
      const { [maxPos]: _removed, ...rest } = current;
      return { ...prev, tournament: { ...prev.tournament, positionPoints: rest } };
    });
  };

  const handleSavePreset = () => {
    const name = window.prompt("Preset name:");
    if (!name) return;
    const payload = {
      id: Date.now(),
      name,
      teams: state.teams.map((t) => ({ id: t.id, name: t.name })),
      tournament: { killPoints: state.tournament.killPoints, positionPoints: state.tournament.positionPoints },
    };
    setPresets((p) => [payload, ...p]);
    // select new preset by default
    setSelectedPreset(payload.id);
    window.alert("Preset saved.");
  };

  const handleLoadPreset = (presetId) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) return;
    // Map teams to include totals and reset totals/kills
    const teams = preset.teams.map((t, i) => ({ id: t.id, name: t.name, totalKills: 0, totalPoints: 0 }));
    // Rebuild teamStats
    const teamStats = {};
    teams.forEach((t) => (teamStats[t.id] = { kills: 0, position: null }));

    setState((prev) => ({
      ...prev,
      teams,
      tournament: { ...prev.tournament, killPoints: preset.tournament.killPoints, positionPoints: preset.tournament.positionPoints },
      currentMatch: { matchNumber: 1, status: "live", resultsApplied: false, teamStats },
    }));
    setSelectedPreset(presetId);
  };

  const handleDeletePreset = (presetId) => {
    if (!window.confirm("Delete preset?")) return;
    setPresets((p) => p.filter((x) => x.id !== presetId));
    if (selectedPreset === presetId) setSelectedPreset("");
  };

  const handleStartTournament = () => {
    // Ensure teamStats has entries for teams
    setState((prev) => {
      const teamStats = {};
      prev.teams.forEach((t) => (teamStats[t.id] = { kills: 0, position: null }));
      return {
        ...prev,
        tournament: { ...prev.tournament, started: true },
        currentMatch: { matchNumber: 1, status: "live", resultsApplied: false, teamStats },
      };
    });
  };
  // ---------- end Setup helpers ----------

  const handleKillChange = (teamId, delta) => {
    if (state.currentMatch.status !== "live") return;

    setState((prev) => {
      const prevStats = prev.currentMatch.teamStats || {};
      const teamPrev = prevStats[teamId] || { kills: 0, position: null };
      const newKills = Math.max(0, (teamPrev.kills || 0) + delta);
      return { ...prev, currentMatch: { ...prev.currentMatch, teamStats: { ...prevStats, [teamId]: { ...teamPrev, kills: newKills } } } };
    });
  };

  const handleEndMatch = () => {
    setState((prev) => ({ ...prev, currentMatch: { ...prev.currentMatch, status: "ended", resultsApplied: false } }));
  };

  const handleCancelEnd = () => {
    setState((prev) => ({ ...prev, currentMatch: { ...prev.currentMatch, status: "live" } }));
  };

  const handlePositionChange = (teamId, position) => {
    setState((prev) => {
      const prevStats = prev.currentMatch.teamStats || {};
      return { ...prev, currentMatch: { ...prev.currentMatch, teamStats: { ...prevStats, [teamId]: { ...(prevStats[teamId] || {}), position } } } };
    });
  };

  const handleApplyResults = () => {
    const { teamStats } = state.currentMatch;
    const teamIds = Object.keys(teamStats).map((k) => parseInt(k, 10));
    const positions = teamIds.map((id) => teamStats[id].position);
    const allAssigned = positions.every((p) => p != null);
    if (!allAssigned) {
      window.alert("Please assign a position to every team before applying results.");
      return;
    }
    const unique = new Set(positions);
    if (unique.size !== positions.length) {
      window.alert("Positions must be unique. Fix duplicates before applying.");
      return;
    }

    const updatedTeams = state.teams.map((team) => {
      const stats = teamStats[team.id] || { kills: 0, position: null };
      const points = calculateTeamPoints({
        kills: stats.kills,
        position: stats.position,
        killPoints: state.tournament.killPoints,
        positionPoints: state.tournament.positionPoints,
      });
      return { ...team, totalKills: (team.totalKills || 0) + stats.kills, totalPoints: (team.totalPoints || 0) + points };
    });

    // Build lastResults payload for copy/export
    const entries = Object.keys(teamStats)
      .map((k) => {
        const id = parseInt(k, 10);
        const stats = teamStats[id];
        const team = state.teams.find((t) => t.id === id) || { name: `Team ${id}` };
        const pts = calculateTeamPoints({
          kills: stats.kills,
          position: stats.position,
          killPoints: state.tournament.killPoints,
          positionPoints: state.tournament.positionPoints,
        });
        return { teamId: id, teamName: team.name, position: stats.position, kills: stats.kills, points: pts };
      })
      .sort((a, b) => a.position - b.position);

    const resultsPayload = { tournamentName: state.tournament.name, matchNumber: state.currentMatch.matchNumber, entries };

    // persist lastResults and update teams
    setLastResults(resultsPayload);

    setState((prev) => ({ ...prev, teams: updatedTeams, currentMatch: { ...prev.currentMatch, status: "ended", resultsApplied: true } }));
  };

  const handleNextMatch = () => {
    setState((prev) => {
      const nextMatchNumber = prev.currentMatch.matchNumber + 1;
      const resetStats = {};
      // reset stats for all current teams
      prev.teams.forEach((t) => {
        resetStats[t.id] = { kills: 0, position: null };
      });

      return { ...prev, currentMatch: { matchNumber: nextMatchNumber, status: "live", resultsApplied: false, teamStats: resetStats } };
    });
  };

  // Format results text and copy to clipboard
  const numberEmoji = ["0️⃣", "1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣", "6️⃣", "7️⃣", "8️⃣", "9️⃣", "🔟"];
  const handleCopyResults = async () => {
    const r = lastResults;
    if (!r || !r.entries || r.entries.length === 0) {
      window.alert("No results available to copy.");
      return;
    }
    const header = `🏆 ${r.tournamentName}\nMatch ${r.matchNumber} Results\n`;
    const lines = r.entries.map((e) => {
      const emo = numberEmoji[e.position] ?? `${e.position}.`;
      return `${emo} ${e.teamName} — ${e.points} pts (${e.kills} kills)`;
    });
    const out = [header, ...lines].join("\n");

    try {
      setCopying(true);
      await navigator.clipboard.writeText(out);
      setCopying(false);
      window.alert("Results copied to clipboard.");
    } catch (err) {
      setCopying(false);
      // fallback: open prompt with text selected
      window.prompt("Copy the results below (Ctrl+C):", out);
    }
  };

  // Reset tournament manually (clears localStorage)
  const handleResetTournament = () => {
    const confirm = window.prompt("Reset tournament — this will clear all saved data and presets.\nType RESET to confirm.");
    if (confirm !== "RESET") return;
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}
    // deep clone initialState to avoid sharing references
    setState(JSON.parse(JSON.stringify(initialState)));
    setObsMode(false);
    setPresets([]);
    setSelectedPreset("");
    setLastResults(null);
  };

  // computed teams display:
  const computedTeams = state.teams
    .map((team) => {
      if (state.currentMatch.status === "live") {
        const stats = state.currentMatch.teamStats[team.id] || { kills: 0, position: null };
        const matchPoints = calculateTeamPoints({
          kills: stats.kills,
          position: stats.position,
          killPoints: state.tournament.killPoints,
          positionPoints: state.tournament.positionPoints,
        });
        return { ...team, totalKills: (team.totalKills || 0) + stats.kills, totalPoints: (team.totalPoints || 0) + matchPoints };
      }
      return { ...team, totalKills: team.totalKills || 0, totalPoints: team.totalPoints || 0 };
    })
    .sort((a, b) => {
      if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
      return b.totalKills - a.totalKills;
    });

  // Show setup screen before tournament started (Match 1)
  const showSetup = !state.tournament.started && state.currentMatch.matchNumber === 1;

  return (
    <div className="min-h-screen bg-neutral-900 text-white flex">
      <div className={`flex-1 p-6 ${obsMode ? "flex items-center justify-center" : ""}`}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-semibold">Stream Score</h1>
            <div className="text-sm text-gray-400">Live Tournament Scoring for Streamers</div>

            {/* Horizontal live leaderboard strip */}
            <div className="mt-3 flex flex-wrap gap-3">
              {computedTeams.slice(0, 8).map((t, i) => (
                <div key={t.id} className="px-3 py-2 bg-neutral-800 rounded text-sm min-w-[160px]">
                  <div className="font-semibold">{i + 1}. {t.name}</div>
                  <div className="text-xs text-gray-400">{t.totalPoints} pts • {t.totalKills} kills</div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            {/* Copy Results visible (disabled when none) */}
            <button
              onClick={handleCopyResults}
              disabled={!lastResults}
              className={`px-3 py-1 rounded bg-indigo-600 ${!lastResults ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              {copying ? "Copying..." : "Copy Results"}
            </button>

            <button onClick={() => setObsMode((v) => !v)} className={`px-3 py-1 rounded ${obsMode ? "bg-red-600" : "bg-green-600"}`}>
              {obsMode ? "OBS: ON" : "OBS: OFF"}
            </button>

            <button onClick={handleResetTournament} className="px-3 py-1 rounded bg-neutral-700">
              Reset Tournament
            </button>
          </div>
        </div>

        {obsMode ? (
          // OBS mode: show only big leaderboard
          <div className="w-full h-[calc(100vh-64px)]">
            <Leaderboard teams={computedTeams} obsMode={true} />
          </div>
        ) : showSetup ? (
          // ---------- Setup Screen ----------
          <div className="space-y-4">
            <div className="p-4 bg-neutral-800 rounded">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-medium mb-2">Tournament Setup</h2>
                {state.tournament.started && <div className="text-sm text-yellow-400">Setup locked for this tournament</div>}
              </div>

              <div className="mb-3">
                <label className="block text-sm text-gray-300 mb-1">Kill points (per kill)</label>
                <input type="number" value={state.tournament.killPoints} onChange={(e) => handleSetKillPoints(e.target.value)} className="w-32 px-2 py-1 rounded bg-neutral-700" disabled={!!state.tournament.started} />
              </div>

              <div className="mb-3">
                <label className="block text-sm text-gray-300 mb-1">Position points</label>
                <div className="grid grid-cols-4 gap-2">
                  {Object.keys(state.tournament.positionPoints)
                    .map((k) => parseInt(k, 10))
                    .sort((a, b) => a - b)
                    .map((pos) => (
                      <div key={pos} className="flex flex-col">
                        <label className="text-xs text-gray-400">#{pos}</label>
                        <input type="number" value={state.tournament.positionPoints[pos] ?? 0} onChange={(e) => handleSetPositionPoint(pos, e.target.value)} className="px-2 py-1 rounded bg-neutral-700 w-full" disabled={!!state.tournament.started} />
                      </div>
                    ))}
                </div>
                <div className="mt-2">
                  <button onClick={handleAddPositionSlot} className="px-3 py-1 bg-green-600 rounded text-sm" disabled={!!state.tournament.started}>
                    Add position
                  </button>

                  <button onClick={handleRemovePositionSlot} className="ml-2 px-3 py-1 bg-red-600 rounded text-sm" disabled={!!state.tournament.started}>
                    Remove position
                  </button>
                </div>
              </div>

              <div className="flex gap-2 mt-3">
                {/* hide preset controls when setup locked */}
                {!state.tournament.started && <button onClick={handleSavePreset} className="px-3 py-2 bg-indigo-600 rounded">Save Preset</button>}

                <div className="flex items-center gap-2">
                  <label className="text-sm text-gray-300">Presets</label>
                  {!state.tournament.started ? (
                    <select value={selectedPreset} onChange={(e) => { const id = e.target.value ? parseInt(e.target.value, 10) : null; if (id) { setSelectedPreset(id); handleLoadPreset(id); } else { setSelectedPreset(""); } }} className="bg-neutral-700 text-sm px-2 py-1 rounded">
                      <option value="">Select preset...</option>
                      {presets.map((preset) => (
                        <option key={preset.id} value={preset.id}>
                          {preset.name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="text-sm text-gray-400">Presets available after reset</div>
                  )}
                </div>
              </div>
            </div>

            <div className="p-4 bg-neutral-800 rounded">
              <h2 className="text-lg font-medium mb-2">Teams</h2>

              <div className="space-y-2">
                {state.teams.map((team) => (
                  <div key={team.id} className="flex items-center gap-2">
                    <input type="text" value={team.name} onChange={(e) => handleEditTeamName(team.id, e.target.value)} className="flex-1 px-3 py-1 rounded bg-neutral-700" disabled={state.tournament.started} />

                    <button onClick={() => handleRemoveTeam(team.id)} className="px-3 py-1 bg-red-600 rounded" disabled={state.tournament.started}>
                      Remove
                    </button>
                  </div>
                ))}

                {!state.tournament.started && (
                  <button onClick={handleAddTeam} className="px-3 py-2 bg-blue-600 rounded">
                    Add Team
                  </button>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2">
              {!state.tournament.started ? (
                <button onClick={handleStartTournament} className="px-3 py-2 bg-green-600 rounded">
                  Start Tournament
                </button>
              ) : (
                <div className="text-sm text-gray-400 flex items-center">Tournament in progress... (Match #{state.currentMatch.matchNumber})</div>
              )}
            </div>
          </div>
        ) : (
          // ---------- Live / Results Screen ----------
          <div className="space-y-4">
            <div className="p-4 bg-neutral-800 rounded">
              <h2 className="text-lg font-medium mb-2">Match #{state.currentMatch.matchNumber}</h2>

              <div className="flex flex-col gap-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-sm text-gray-400">Team</div>
                  <div className="text-sm text-gray-400">Kills</div>
                  <div className="text-sm text-gray-400">Position</div>
                </div>

                {computedTeams.map((team) => {
                  const stats = state.currentMatch.teamStats[team.id] || { kills: 0, position: null };
                  const locked = state.currentMatch.status !== "live";
                  return (
                    <div key={team.id} className="grid grid-cols-3 gap-4 items-center">
                      <div className="font-medium">{team.name}</div>

                      {/* Kills column: show +/- when match is live */}
                      <div className="flex items-center gap-3 whitespace-nowrap">
                        {!locked ? (
                          <>
                            <button onClick={() => handleKillChange(team.id, -1)} className="inline-flex items-center justify-center px-3 py-1 bg-red-600 rounded">-</button>
                            <div className="text-lg px-2">{state.currentMatch.teamStats[team.id]?.kills ?? 0}</div>
                            <button onClick={() => handleKillChange(team.id, 1)} className="inline-flex items-center justify-center px-3 py-1 bg-green-600 rounded">+</button>
                          </>
                        ) : (
                          <div className="text-lg">{stats.kills}</div>
                        )}
                      </div>

                      {/* Position column */}
                      <div className="flex gap-2 items-center">
                        {!locked ? (
                          <select value={stats.position ?? ""} onChange={(e) => handlePositionChange(team.id, e.target.value ? parseInt(e.target.value, 10) : null)} className="bg-neutral-700 text-sm px-2 py-1 rounded">
                            <option value="">Pos</option>
                            {Array.from({ length: state.teams.length }).map((_, i) => (
                              <option key={i + 1} value={i + 1}>
                                {i + 1}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <div className="text-lg">{stats.position ?? "-"}</div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-end gap-2">
              {state.currentMatch.status === "live" ? (
                <button onClick={handleEndMatch} className="px-3 py-2 bg-yellow-600 rounded">
                  End Match
                </button>
              ) : (
                <>
                  {!state.currentMatch.resultsApplied ? (
                    <button onClick={handleApplyResults} className="px-3 py-2 bg-green-600 rounded">
                      Apply Results
                    </button>
                  ) : (
                    <button onClick={handleNextMatch} className="px-3 py-2 bg-blue-600 rounded">
                      Next Match
                    </button>
                  )}

                  <button onClick={handleResetTournament} className="px-3 py-2 bg-red-600 rounded">
                    Reset Tournament
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      <footer className="w-full text-center text-sm text-gray-400 p-3">Stream Score • Built for streamers • v0.1</footer>
    </div>
  );
}

export default App;
