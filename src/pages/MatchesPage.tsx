import { useState, useMemo } from "react";
import { useTournamentStore } from "@/src/store";
import { Card, CardContent } from "@/src/components/ui/card";
import { Badge } from "@/src/components/ui/badge";
import { CustomSelect } from "@/src/components/ui/custom-select";
import {
  Trophy,
  Clock,
  PlayCircle,
  CheckCircle2,
  Network,
  User,
  Medal,
  Zap,
} from "lucide-react";
import { cn } from "@/src/lib/utils";
import { motion, AnimatePresence } from "motion/react";

const BracketConnector = ({
  active = false,
  type = "straight"
}: {
  active?: boolean,
  type?: "straight" | "corner-up" | "corner-down"
}) => (
  <div className="absolute top-1/2 -right-12 w-12 h-20 -translate-y-1/2 pointer-events-none z-0">
    <svg className="w-full h-full overflow-visible">
      <defs>
        <linearGradient id="active-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#8b5cf6" />
          <stop offset="100%" stopColor="#ec4899" />
        </linearGradient>
      </defs>
      {type === "straight" && (
        <motion.path
          d="M 0 40 L 48 40"
          stroke={active ? "url(#active-gradient)" : "#27272a"}
          strokeWidth="3"
          fill="none"
          initial={active ? { pathLength: 0 } : {}}
          animate={active ? { pathLength: 1 } : {}}
          transition={{ duration: 0.8 }}
        />
      )}
      {type === "corner-up" && (
        <motion.path
          d="M 0 40 L 24 40 L 24 0 L 48 0"
          stroke={active ? "url(#active-gradient)" : "#27272a"}
          strokeWidth="3"
          fill="none"
          initial={active ? { pathLength: 0 } : {}}
          animate={active ? { pathLength: 1 } : {}}
          transition={{ duration: 0.8 }}
        />
      )}
      {type === "corner-down" && (
        <motion.path
          d="M 0 40 L 24 40 L 24 80 L 48 80"
          stroke={active ? "url(#active-gradient)" : "#27272a"}
          strokeWidth="3"
          fill="none"
          initial={active ? { pathLength: 0 } : {}}
          animate={active ? { pathLength: 1 } : {}}
          transition={{ duration: 0.8 }}
        />
      )}
    </svg>
  </div>
);

export function MatchesPage() {
  const { matches, games, players } = useTournamentStore();
  const [viewMode, setViewMode] = useState<"list" | "bracket">("list");
  const [filter, setFilter] = useState<
    "all" | "upcoming" | "ongoing" | "finished"
  >("all");
  const [selectedGame, setSelectedGame] = useState<string>(games[0]?.id || "");

  const getPlayer = (id: string | null) =>
    id ? players.find((p) => p.id === id) : null;
  const getGame = (id: string) => games.find((g) => g.id === id);

  const filteredMatches = matches.filter(
    (m) => filter === "all" || m.status === filter,
  );
  const bracketMatches = matches.filter((m) => m.gameId === selectedGame);

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "upcoming":
        return {
          icon: Clock,
          color: "text-zinc-400",
          bg: "bg-zinc-800",
          label: "À venir",
        };
      case "ongoing":
        return {
          icon: PlayCircle,
          color: "text-emerald-500",
          bg: "bg-emerald-500/20",
          label: "En cours",
        };
      case "finished":
        return {
          icon: CheckCircle2,
          color: "text-violet-500",
          bg: "bg-violet-500/20",
          label: "Terminé",
        };
      default:
        return {
          icon: Clock,
          color: "text-zinc-400",
          bg: "bg-zinc-800",
          label: "Inconnu",
        };
    }
  };

  const rounds = useMemo(() => {
    return bracketMatches.reduce(
      (acc, match) => {
        const r = match.round || 1;
        if (!acc[r]) acc[r] = [];
        acc[r].push(match);
        return acc;
      },
      {} as Record<number, typeof matches>,
    );
  }, [bracketMatches]);

  const maxRound = Math.max(...Object.keys(rounds).map(Number), 0);

  return (
    <div className="mx-auto max-w-7xl space-y-12 pb-20 pt-10">
      <div className="relative z-30 flex flex-col items-start justify-between gap-8 md:flex-row md:items-end bg-zinc-900/40 p-10 rounded-3xl border border-zinc-800/50 backdrop-blur-xl">
        <div className="space-y-4">
          <Badge variant="outline" className="border-violet-500/50 bg-violet-500/10 text-violet-400 px-4 py-1 text-sm font-bold">
            <Zap className="h-3.5 w-3.5 mr-2 fill-current" /> CHAMPIONNAT 2026
          </Badge>
          <h1 className="text-5xl font-black tracking-tighter text-white">
            MATCHS DU <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-fuchsia-500">CHAMPIONNAT</span>
          </h1>
          <p className="text-zinc-400 text-lg max-w-md font-medium">
            Le champ de bataille est prêt. Qui régnera sur l'arène ?
          </p>
        </div>

        <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
          <div className="flex gap-1 rounded-2xl bg-zinc-950 p-1.5 border border-zinc-800/50 shadow-2xl">
            <button
              onClick={() => setViewMode("list")}
              className={cn(
                "rounded-xl px-6 py-2.5 text-sm font-black uppercase tracking-widest transition-all flex items-center gap-2",
                viewMode === "list"
                  ? "bg-violet-600 text-white shadow-[0_0_20px_rgba(139,92,246,0.4)]"
                  : "text-zinc-500 hover:text-zinc-300"
              )}
            >
              <Clock className="h-4 w-4" /> Liste
            </button>
            <button
              onClick={() => setViewMode("bracket")}
              className={cn(
                "rounded-xl px-6 py-2.5 text-sm font-black uppercase tracking-widest transition-all flex items-center gap-2",
                viewMode === "bracket"
                  ? "bg-violet-600 text-white shadow-[0_0_20px_rgba(139,92,246,0.4)]"
                  : "text-zinc-500 hover:text-zinc-300"
              )}
            >
              <Network className="h-4 w-4" /> Arbre
            </button>
          </div>

          <div className="min-w-48">
            {viewMode === "list" ? (
              <CustomSelect
                value={filter}
                onChange={(v) => setFilter(v as any)}
                options={[
                  { value: "all", label: "Tous les Statuts" },
                  { value: "upcoming", label: "À venir" },
                  { value: "ongoing", label: "En cours" },
                  { value: "finished", label: "Terminés" },
                ]}
                className="h-12"
              />
            ) : (
              <CustomSelect
                value={selectedGame}
                onChange={(v) => setSelectedGame(v)}
                options={games.map(g => ({ value: g.id, label: g.name }))}
                className="h-12"
                placeholder="Choisir un jeu..."
              />
            )}
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {viewMode === "list" ? (
          <motion.div
            key="list-view"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3 }}
            className="grid gap-8 md:grid-cols-2 lg:grid-cols-3"
          >
            {filteredMatches.length === 0 ? (
              <div className="col-span-full flex min-h-[40vh] flex-col items-center justify-center rounded-[3rem] border-2 border-dashed border-zinc-800/50 bg-zinc-900/20 text-center p-12 backdrop-blur-sm">
                <div className="h-24 w-24 rounded-full bg-zinc-800/50 flex items-center justify-center mb-6">
                  <Trophy className="h-12 w-12 text-zinc-600" />
                </div>
                <h3 className="text-3xl font-black text-zinc-300 uppercase tracking-tighter">
                  Aucun duel n'attend
                </h3>
                <p className="text-zinc-500 mt-4 max-w-xs font-medium">
                  Le calme avant la tempête. Vérifiez les autres catégories pour trouver de l'action.
                </p>
              </div>
            ) : (
              filteredMatches.map((match, index) => {
                const p1 = getPlayer(match.player1Id);
                const p2 = getPlayer(match.player2Id);
                const game = getGame(match.gameId);
                const status = getStatusConfig(match.status);
                const StatusIcon = status.icon;

                return (
                  <motion.div
                    key={match.id}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05, duration: 0.5 }}
                  >
                    <Card className="group relative overflow-hidden border-zinc-800/50 bg-zinc-900/40 backdrop-blur-2xl transition-all duration-500 hover:border-violet-500/50 hover:shadow-[0_0_50px_rgba(139,92,246,0.15)] rounded-[2.5rem]">
                      <div className="relative h-36 overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/60 to-transparent z-10" />
                        <img
                          src={game?.backgroundImageUrl || game?.imageUrl}
                          alt={game?.name}
                          className="h-full w-full object-cover opacity-30 transition-all duration-700 group-hover:scale-110 group-hover:opacity-50 blur-[2px] group-hover:blur-0"
                        />
                        <div className="absolute top-6 left-6 z-20 flex flex-col gap-2">
                          <Badge
                            className="bg-zinc-950/80 backdrop-blur-md text-zinc-200 border-zinc-800 px-3 py-1 text-xs font-black uppercase tracking-widest"
                          >
                            {game?.name}
                          </Badge>
                          <Badge
                            className={cn(
                              "border-transparent font-black uppercase tracking-tighter text-xs px-3 py-1",
                              status.bg,
                              status.color,
                            )}
                          >
                            <StatusIcon className="mr-1.5 h-3.5 w-3.5" />
                            {status.label}
                          </Badge>
                        </div>
                        {match.round && (
                          <div className="absolute top-6 right-6 z-20">
                            <span className="text-xs font-black text-violet-400/50 uppercase tracking-[0.2em]">Round {match.round}</span>
                          </div>
                        )}
                      </div>

                      <CardContent className="p-8 relative z-20">
                        <div className="flex items-center justify-between gap-6 relative">
                          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-0">
                            <span className="text-6xl font-black italic text-zinc-900/30 selection:bg-transparent pointer-events-none tracking-tighter">VS</span>
                          </div>

                          {/* Player 1 */}
                          <div className="flex flex-1 flex-col items-center text-center z-10">
                            <motion.div
                              whileHover={{ scale: 1.1 }}
                              className={cn(
                                "mb-4 flex h-20 w-20 items-center justify-center rounded-3xl border-2 bg-zinc-950 overflow-hidden transition-all duration-500 shadow-2xl relative",
                                match.winnerId === p1?.id
                                  ? "border-emerald-500 shadow-[0_0_30px_rgba(16,185,129,0.3)] ring-4 ring-emerald-500/10"
                                  : "border-zinc-800",
                              )}
                            >
                              {p1 ? (
                                <img
                                  src={p1.avatarUrl}
                                  alt={p1.pseudo || p1.firstName}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <User className="h-8 w-8 text-zinc-600" />
                              )}
                              {match.winnerId === p1?.id && (
                                <div className="absolute inset-0 bg-emerald-500/10" />
                              )}
                            </motion.div>
                            <span className="font-black text-white text-lg tracking-tight line-clamp-1 mb-1">
                              {p1 ? p1.pseudo || p1.firstName : "ANNONCÉ"}
                            </span>
                            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-600">
                              {p1 ? p1.major : "TBD"}
                            </span>
                          </div>

                          {/* Player 2 */}
                          <div className="flex flex-1 flex-col items-center text-center z-10">
                            <motion.div
                              whileHover={{ scale: 1.1 }}
                              className={cn(
                                "mb-4 flex h-20 w-20 items-center justify-center rounded-3xl border-2 bg-zinc-950 overflow-hidden transition-all duration-500 shadow-2xl relative",
                                match.winnerId === p2?.id
                                  ? "border-emerald-500 shadow-[0_0_30px_rgba(16,185,129,0.3)] ring-4 ring-emerald-500/10"
                                  : "border-zinc-800",
                              )}
                            >
                              {p2 ? (
                                <img
                                  src={p2.avatarUrl}
                                  alt={p2.pseudo || p2.firstName}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <User className="h-8 w-8 text-zinc-600" />
                              )}
                              {match.winnerId === p2?.id && (
                                <div className="absolute inset-0 bg-emerald-500/10" />
                              )}
                            </motion.div>
                            <span className="font-black text-white text-lg tracking-tight line-clamp-1 mb-1">
                              {p2 ? p2.pseudo || p2.firstName : "ANNONCÉ"}
                            </span>
                            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-600">
                              {p2 ? p2.major : "TBD"}
                            </span>
                          </div>
                        </div>

                        {match.status === "finished" && match.winnerId && (
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mt-8 flex items-center justify-center gap-3 rounded-2xl bg-emerald-500/5 py-3 text-sm font-black uppercase tracking-tighter text-emerald-400 border border-emerald-500/10"
                          >
                            <Medal className="h-4 w-4" />
                            VICTOIRE DE {getPlayer(match.winnerId)?.pseudo || getPlayer(match.winnerId)?.firstName}
                          </motion.div>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })
            )}
          </motion.div>
        ) : (
          /* BRACKET VIEW */
          <motion.div
            key="bracket-view"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="overflow-x-auto pb-12 cursor-grab active:cursor-grabbing scrollbar-hide"
          >
            {maxRound === 0 ? (
              <div className="flex min-h-[50vh] flex-col items-center justify-center rounded-[4rem] border-2 border-dashed border-zinc-800 bg-zinc-900/20 text-center p-20 backdrop-blur-md">
                <Network className="mb-8 h-20 w-20 text-zinc-700 animate-pulse" />
                <h3 className="text-4xl font-black text-zinc-300 uppercase tracking-tighter">
                  L'Arbre est en <span className="text-violet-500">Gestation</span>
                </h3>
                <p className="text-zinc-500 mt-6 max-w-sm text-lg font-medium leading-relaxed">
                  L'administration doit forger cet arbre. Revenez dès que les duels auront été décidés.
                </p>
              </div>
            ) : (
              <div className="flex gap-20 min-w-max px-10 py-20 relative">
                {/* Visual Glow behind bracket */}
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                  <div className="absolute top-1/2 left-1/4 w-[500px] h-[500px] bg-violet-600/10 blur-[150px] rounded-full -translate-y-1/2" />
                  <div className="absolute top-1/2 right-1/4 w-[500px] h-[500px] bg-fuchsia-600/10 blur-[150px] rounded-full -translate-y-1/2" />
                </div>

                {Array.from({ length: maxRound }).map((_, i) => {
                  const roundNum = i + 1;
                  const roundMatches = rounds[roundNum] || [];

                  return (
                    <div
                      key={roundNum}
                      className="flex flex-col justify-around gap-12 min-w-[320px] relative z-10"
                    >
                      <div className="text-center mb-8 relative">
                        <div className="inline-block relative">
                          <h3 className="text-sm font-black text-violet-500 uppercase tracking-[0.3em] bg-zinc-950 px-6 py-2 rounded-full border border-violet-500/20 shadow-[0_0_20px_rgba(139,92,246,0.1)]">
                            {roundNum === maxRound
                              ? "FINALE"
                              : roundNum === maxRound - 1
                                ? "DEMI-FINALES"
                                : `ROUND ${roundNum}`}
                          </h3>
                        </div>
                      </div>

                      {roundMatches.map((match, mIdx) => {
                        const p1 = getPlayer(match.player1Id);
                        const p2 = getPlayer(match.player2Id);

                        let connectorType: "straight" | "corner-up" | "corner-down" = "straight";
                        if (roundNum < maxRound) {
                          connectorType = mIdx % 2 === 0 ? "corner-down" : "corner-up";
                        }

                        return (
                          <div key={match.id} className="relative group">
                            <motion.div
                              whileHover={{ y: -5, scale: 1.02 }}
                              className={cn(
                                "rounded-[1.5rem] border-2 bg-zinc-950/80 backdrop-blur-xl overflow-hidden flex flex-col shadow-2xl transition-all duration-500 w-[300px]",
                                match.status === "ongoing"
                                  ? "border-violet-500 shadow-[0_0_40px_rgba(139,92,246,0.25)] ring-4 ring-violet-500/10 z-20"
                                  : "border-zinc-800 group-hover:border-zinc-700",
                              )}
                            >
                              {/* Player 1 */}
                              <div
                                className={cn(
                                  "flex items-center gap-4 p-4 transition-all duration-300",
                                  match.winnerId === match.player1Id
                                    ? "bg-emerald-500/10"
                                    : match.winnerId && match.winnerId !== match.player1Id
                                      ? "opacity-40 grayscale-[0.5]"
                                      : "hover:bg-zinc-900/50",
                                )}
                              >
                                <div className={cn(
                                  "h-12 w-12 rounded-xl bg-zinc-900 border overflow-hidden flex-shrink-0 transition-transform",
                                  match.winnerId === match.player1Id ? "border-emerald-500 scale-105" : "border-zinc-800"
                                )}>
                                  {p1 ? (
                                    <img src={p1.avatarUrl} alt="" className="h-full w-full object-cover" />
                                  ) : (
                                    <User className="h-full w-full p-3 text-zinc-700" />
                                  )}
                                </div>
                                <div className="flex flex-col min-w-0 flex-1">
                                  <span className={cn(
                                    "font-black text-sm uppercase tracking-tight truncate",
                                    match.winnerId === match.player1Id ? "text-emerald-400" : "text-zinc-200",
                                  )}>
                                    {p1 ? p1.pseudo || p1.firstName : "ANNONCÉ"}
                                  </span>
                                  <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">{p1 ? p1.major : "TBD"}</span>
                                </div>
                                {match.winnerId === match.player1Id && (
                                  <Trophy className="h-5 w-5 text-emerald-500 drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                                )}
                              </div>

                              <div className="h-px w-full bg-gradient-to-r from-transparent via-zinc-800/50 to-transparent" />

                              {/* Player 2 */}
                              <div
                                className={cn(
                                  "flex items-center gap-4 p-4 transition-all duration-300",
                                  match.winnerId === match.player2Id
                                    ? "bg-emerald-500/10"
                                    : match.winnerId && match.winnerId !== match.player2Id
                                      ? "opacity-40 grayscale-[0.5]"
                                      : "hover:bg-zinc-900/50",
                                )}
                              >
                                <div className={cn(
                                  "h-12 w-12 rounded-xl bg-zinc-900 border overflow-hidden flex-shrink-0 transition-transform",
                                  match.winnerId === match.player2Id ? "border-emerald-500 scale-105" : "border-zinc-800"
                                )}>
                                  {p2 ? (
                                    <img src={p2.avatarUrl} alt="" className="h-full w-full object-cover" />
                                  ) : (
                                    <User className="h-full w-full p-3 text-zinc-700" />
                                  )}
                                </div>
                                <div className="flex flex-col min-w-0 flex-1">
                                  <span className={cn(
                                    "font-black text-sm uppercase tracking-tight truncate",
                                    match.winnerId === match.player2Id ? "text-emerald-400" : "text-zinc-200",
                                  )}>
                                    {p2 ? p2.pseudo || p2.firstName : "ANNONCÉ"}
                                  </span>
                                  <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">{p2 ? p2.major : "TBD"}</span>
                                </div>
                                {match.winnerId === match.player2Id && (
                                  <Trophy className="h-5 w-5 text-emerald-500 drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                                )}
                              </div>
                            </motion.div>

                            {roundNum < maxRound && (
                              <BracketConnector
                                active={!!match.winnerId}
                                type={connectorType}
                              />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
