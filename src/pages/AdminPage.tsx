import { useState } from 'react';
import { useTournamentStore } from '@/src/store';
import { cn } from '@/src/lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { CustomSelect } from '@/src/components/ui/custom-select';
import {
  LayoutDashboard, Users, Swords, Gamepad2, ListFilter,
  Plus, Trash2, X, Network, Trophy,
  Search, Shield, Medal, Star, Zap, Lock, Key, Loader2, Settings
} from 'lucide-react';
import { uploadImage } from '@/src/lib/cloudinary';

// ─── Types ───────────────────────────────────────────────────────────────────
type Tab = 'dashboard' | 'players' | 'matches' | 'games' | 'settings';

// ─── Small reusable UI atoms ────────────────────────
const Btn = ({
  children, onClick, className = '', variant = 'primary', disabled = false, type = 'button', size = 'md'
}: {
  children: React.ReactNode;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  className?: string;
  variant?: 'primary' | 'ghost' | 'danger' | 'outline' | 'success';
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
  size?: 'sm' | 'md' | 'lg' | 'icon';
}) => {
  const base = 'inline-flex items-center justify-center gap-2 font-semibold transition-all duration-200 select-none rounded-lg disabled:opacity-40 disabled:cursor-not-allowed';
  const sizes = { sm: 'px-3 py-1.5 text-xs', md: 'px-4 py-2 text-sm', lg: 'px-6 py-2.5 text-sm', icon: 'p-2 text-sm' };
  const variants = {
    primary: 'bg-violet-600 text-white hover:bg-violet-500 shadow-sm shadow-violet-600/30',
    ghost: 'bg-transparent text-zinc-400 hover:bg-white/5 hover:text-zinc-200',
    danger: 'bg-transparent text-zinc-500 hover:bg-red-500/10 hover:text-red-400',
    outline: 'border border-zinc-700 bg-transparent text-zinc-300 hover:bg-white/5',
    success: 'bg-emerald-600/15 text-emerald-400 hover:bg-emerald-600/25',
  };
  return (
    <button type={type} disabled={disabled} onClick={onClick}
      className={cn(base, sizes[size], variants[variant], className)}>
      {children}
    </button>
  );
};

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="space-y-1.5">
    <label className="block text-[11px] font-semibold uppercase tracking-widest text-zinc-500">{label}</label>
    {children}
  </div>
);

const inputCls = 'w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2.5 text-sm text-zinc-200 placeholder:text-zinc-600 outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/30 transition-colors';

// ─── Stat Card ────────────────────────────────────────────────────────────────
const StatCard = ({ label, value, icon: Icon, color, sub }: {
  label: string; value: number | string; icon: any; color: string; sub?: string;
}) => (
  <div className="rounded-xl border border-white/5 bg-white/[0.03] p-5 flex items-start gap-4">
    <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-lg', color)}>
      <Icon className="h-5 w-5" />
    </div>
    <div className="min-w-0">
      <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500">{label}</p>
      <p className="text-2xl font-bold text-white mt-0.5">{value}</p>
      {sub && <p className="text-xs text-zinc-600 mt-0.5">{sub}</p>}
    </div>
  </div>
);

// ─── Section heading ─────────────────────────────────────────────────────────
const SectionHeading = ({ title, subtitle }: { title: string; subtitle?: string }) => (
  <div>
    <h2 className="text-lg font-bold text-white">{title}</h2>
    {subtitle && <p className="text-sm text-zinc-500 mt-0.5">{subtitle}</p>}
  </div>
);

// ─── Table ────────────────────────────────────────────────────────────────────
const Table = ({ headers, children, empty }: { headers: string[]; children: React.ReactNode; empty: React.ReactNode }) => (
  <div className="overflow-hidden rounded-xl border border-white/5">
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b border-white/5 bg-white/[0.02]">
          {headers.map(h => (
            <th key={h} className="px-5 py-3.5 text-left text-[11px] font-semibold uppercase tracking-widest text-zinc-500">{h}</th>
          ))}
        </tr>
      </thead>
      <tbody className="divide-y divide-white/[0.04]">{children}</tbody>
    </table>
    {!children || (Array.isArray(children) && children.length === 0) ? (
      <div className="py-16 text-center text-zinc-600">{empty}</div>
    ) : null}
  </div>
);

// ─── Status badge ─────────────────────────────────────────────────────────────
const StatusBadge = ({ status }: { status: string }) => {
  const map: Record<string, string> = {
    upcoming: 'bg-blue-500/10 text-blue-400',
    ongoing: 'bg-amber-500/10 text-amber-400',
    finished: 'bg-zinc-700/40 text-zinc-400',
  };
  const label: Record<string, string> = { upcoming: 'À venir', ongoing: 'En cours', finished: 'Terminé' };
  return (
    <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold', map[status] || 'bg-zinc-800 text-zinc-400')}>
      {label[status] || status}
    </span>
  );
};

// ─── SUB-COMPONENTS (Defined outside to prevent re-mounting) ──────────────────

const DashboardTab = ({ players, matches, games, setActiveTab }: any) => {
  const finished = matches.filter((m: any) => m.status === 'finished').length;
  const ongoing = matches.filter((m: any) => m.status === 'ongoing').length;
  return (
    <div className="space-y-8">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-900/60 via-zinc-900 to-zinc-900 border border-violet-500/20 p-8">
        <div className="absolute inset-0 opacity-10">
          <Trophy className="absolute right-6 top-1/2 -translate-y-1/2 h-40 w-40 text-violet-300 rotate-12" />
        </div>
        <div className="relative space-y-3 max-w-xl">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-violet-500/15 border border-violet-500/20 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-violet-400">
            <Zap className="h-3 w-3 fill-current" />
            Console d'Administration
          </div>
          <h1 className="text-3xl font-black text-white leading-snug tracking-tight">Bienvenue,<br /><span className="text-violet-400">Commandant.</span></h1>
          <p className="text-sm text-zinc-400 leading-relaxed">
            Gérez les joueurs, configurez les matchs et pilotez le tournoi depuis ce tableau de bord centralisé.
          </p>
          <div className="flex gap-3 pt-2">
            <Btn onClick={() => setActiveTab('matches')}>
              <Network className="h-3.5 w-3.5" /> Gérer les Matchs
            </Btn>
            <Btn variant="outline" onClick={() => setActiveTab('players')}>
              <Users className="h-3.5 w-3.5" /> Voir les Joueurs
            </Btn>
          </div>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Joueurs inscrits" value={players.length} icon={Users} color="bg-violet-500/15 text-violet-400" sub="participants enregistrés" />
        <StatCard label="Matchs en cours" value={ongoing} icon={Swords} color="bg-amber-500/15 text-amber-400" sub="duels actifs" />
        <StatCard label="Matchs terminés" value={finished} icon={Shield} color="bg-emerald-500/15 text-emerald-400" sub="résultats enregistrés" />
        <StatCard label="Jeux disponibles" value={games.length} icon={Gamepad2} color="bg-fuchsia-500/15 text-fuchsia-400" sub="disciplines actives" />
      </div>
      <div className="space-y-4">
        <SectionHeading title="Derniers inscrits" subtitle="Les 5 joueurs les plus récemment enregistrés" />
        <Table headers={['Joueur', 'Filière', 'Niveau', 'Jeu']} empty={<span>Aucun joueur.</span>}>
          {players.slice(-5).reverse().map((player: any) => (
            <tr key={player.id} className="group hover:bg-white/[0.02] transition-colors">
              <td className="px-5 py-3.5">
                <div className="flex items-center gap-3">
                  <img src={player.avatarUrl} alt="" className="h-8 w-8 rounded-lg object-cover bg-zinc-800" />
                  <div>
                    <p className="font-semibold text-zinc-200 text-sm">{player.firstName} {player.lastName}</p>
                    {player.pseudo && <p className="text-[11px] text-violet-400">@{player.pseudo}</p>}
                  </div>
                </div>
              </td>
              <td className="px-5 py-3.5 text-sm text-zinc-400">{player.major}</td>
              <td className="px-5 py-3.5 text-sm text-zinc-500">{player.level}</td>
              <td className="px-5 py-3.5">
                <span className="rounded-md bg-zinc-800 px-2 py-1 text-[11px] font-medium text-zinc-300">
                  {games.find((g: any) => g.id === player.gameId)?.name || '—'}
                </span>
              </td>
            </tr>
          ))}
        </Table>
      </div>
    </div>
  );
};

const PlayersTab = ({ players, games, deletePlayer }: any) => {
  const [search, setSearch] = useState('');
  const filtered = players.filter((p: any) => {
    const q = search.toLowerCase();
    return !q || p.firstName.toLowerCase().includes(q) || p.lastName.toLowerCase().includes(q) || (p.pseudo || '').toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <SectionHeading title="Joueurs inscrits" subtitle={`${players.length} participant${players.length !== 1 ? 's' : ''}`} />
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher..."
            className="h-9 rounded-lg border border-zinc-800 bg-zinc-900 pl-9 pr-4 text-sm text-zinc-300 placeholder:text-zinc-600 outline-none focus:border-violet-500 transition-colors w-56"
          />
        </div>
      </div>
      <Table headers={['Joueur', 'Filière / Niveau', 'Jeu', '']} empty={
        <div className="text-center">
          <Users className="mx-auto h-10 w-10 text-zinc-800 mb-3" />
          <p className="text-zinc-600">Aucun joueur trouvé.</p>
        </div>
      }>
        {filtered.map((player: any) => (
          <tr key={player.id} className="group hover:bg-white/[0.02] transition-colors">
            <td className="px-5 py-4">
              <div className="flex items-center gap-3">
                <img src={player.avatarUrl} alt="" className="h-9 w-9 rounded-xl object-cover bg-zinc-800 shrink-0" />
                <div>
                  <p className="font-semibold text-zinc-200 text-sm">{player.firstName} {player.lastName}</p>
                  {player.pseudo && <p className="text-[11px] text-violet-400 font-medium">@{player.pseudo}</p>}
                </div>
              </div>
            </td>
            <td className="px-5 py-4">
              <p className="text-sm font-medium text-zinc-300">{player.major}</p>
              <p className="text-xs text-zinc-600">{player.level}</p>
            </td>
            <td className="px-5 py-4">
              <span className="inline-flex items-center rounded-md bg-zinc-800/80 border border-white/5 px-2.5 py-1 text-[11px] font-medium text-zinc-300">
                {games.find((g: any) => g.id === player.gameId)?.name || 'Inconnu'}
              </span>
            </td>
            <td className="px-5 py-4 text-right">
              <Btn variant="danger" size="icon" onClick={() => deletePlayer(player.id)}>
                <Trash2 className="h-3.5 w-3.5" />
              </Btn>
            </td>
          </tr>
        ))}
      </Table>
    </div>
  );
};

const MatchesTab = ({ matches, players, games, addMatch, updateMatch, deleteMatch, generateBracket }: any) => {
  const [filter, setFilter] = useState('all');
  const [bracketGame, setBracketGame] = useState('');
  const [newMatch, setNewMatch] = useState({ gameId: '', player1Id: '', player2Id: '', status: 'upcoming' as const });

  const filtered = filter === 'all' ? matches : matches.filter((m: any) => m.status === filter);

  return (
    <div className="space-y-8">
      <SectionHeading title="Gestion des Matchs" subtitle="Générez le bracket ou ajoutez des affrontements manuels" />
      <div className="grid gap-5 lg:grid-cols-2">
        <div className="rounded-xl border border-white/5 bg-white/[0.03] p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-500/15">
              <Network className="h-4.5 w-4.5 text-violet-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Génération du Bracket</h3>
              <p className="text-xs text-zinc-500">Mélange aléatoire des joueurs d'un jeu</p>
            </div>
          </div>
          <CustomSelect
            options={games.map((g: any) => ({ value: g.id, label: g.name }))}
            value={bracketGame}
            onChange={setBracketGame}
            placeholder="Sélectionner un jeu..."
          />
          <Btn className="w-full justify-center" disabled={!bracketGame} onClick={() => {
            generateBracket(bracketGame);
            useTournamentStore.getState().addToast('Bracket généré !', 'success');
          }}>
            <Network className="h-3.5 w-3.5" /> Générer les Matchs
          </Btn>
        </div>
        <div className="rounded-xl border border-white/5 bg-white/[0.03] p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-800">
              <Plus className="h-4 w-4 text-zinc-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Match Manuel</h3>
              <p className="text-xs text-zinc-500">Créer un affrontement personnalisé</p>
            </div>
          </div>
          <form onSubmit={(e) => { e.preventDefault(); addMatch(newMatch); setNewMatch({ gameId: '', player1Id: '', player2Id: '', status: 'upcoming' }); }} className="space-y-3">
            <CustomSelect
              options={games.map((g: any) => ({ value: g.id, label: g.name }))}
              value={newMatch.gameId}
              onChange={v => setNewMatch({ ...newMatch, gameId: v, player1Id: '', player2Id: '' })}
              placeholder="Choisir un jeu..."
            />
            <div className="grid grid-cols-2 gap-3">
              <CustomSelect
                options={players.filter((p: any) => !newMatch.gameId || p.gameId === newMatch.gameId).map((p: any) => ({ value: p.id, label: p.pseudo || p.firstName }))}
                value={newMatch.player1Id}
                onChange={v => setNewMatch({ ...newMatch, player1Id: v })}
                placeholder="Joueur 1..."
                disabled={!newMatch.gameId}
              />
              <CustomSelect
                options={players.filter((p: any) => (!newMatch.gameId || p.gameId === newMatch.gameId) && p.id !== newMatch.player1Id).map((p: any) => ({ value: p.id, label: p.pseudo || p.firstName }))}
                value={newMatch.player2Id}
                onChange={v => setNewMatch({ ...newMatch, player2Id: v })}
                placeholder="Joueur 2..."
                disabled={!newMatch.gameId}
              />
            </div>
            <Btn type="submit" className="w-full justify-center" disabled={!newMatch.gameId || !newMatch.player1Id || !newMatch.player2Id}>
              <Plus className="h-3.5 w-3.5" /> Créer le Match
            </Btn>
          </form>
        </div>
      </div>
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <h3 className="text-sm font-bold text-white">Liste des matchs <span className="text-zinc-600 font-normal ml-1">({matches.length})</span></h3>
          <div className="flex items-center rounded-lg border border-white/5 bg-white/[0.03] p-1 gap-0.5">
            {(['all', 'upcoming', 'ongoing', 'finished'] as const).map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={cn('rounded-md px-3 py-1.5 text-xs font-medium transition-all',
                  filter === f ? 'bg-zinc-700 text-zinc-200' : 'text-zinc-500 hover:text-zinc-300'
                )}>
                {f === 'all' ? 'Tous' : f === 'upcoming' ? 'À venir' : f === 'ongoing' ? 'En cours' : 'Terminés'}
              </button>
            ))}
          </div>
        </div>
        <div className="space-y-2">
          {filtered.length === 0 && (
            <div className="rounded-xl border border-dashed border-zinc-800 py-16 text-center">
              <Swords className="mx-auto h-10 w-10 text-zinc-800 mb-3" />
              <p className="text-sm text-zinc-600">Aucun match pour ce filtre.</p>
            </div>
          )}
          <AnimatePresence>
            {filtered.map((match: any) => {
              const p1 = players.find((p: any) => p.id === match.player1Id);
              const p2 = players.find((p: any) => p.id === match.player2Id);
              const game = games.find((g: any) => g.id === match.gameId);
              return (
                <motion.div key={match.id}
                  initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-white/5 bg-white/[0.02] px-5 py-4 hover:bg-white/[0.04] transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-lg overflow-hidden shrink-0 bg-zinc-900 border border-white/5">
                      {game?.imageUrl && <img src={game.imageUrl} alt="" className="h-full w-full object-cover opacity-70" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 text-sm font-semibold text-zinc-200">
                        <span className={cn(match.winnerId === p1?.id && 'text-emerald-400')}>
                          {p1 ? (p1.pseudo || p1.firstName) : <span className="italic text-zinc-600">TBD</span>}
                        </span>
                        <span className="text-zinc-700 font-bold text-xs">VS</span>
                        <span className={cn(match.winnerId === p2?.id && 'text-emerald-400')}>
                          {p2 ? (p2.pseudo || p2.firstName) : <span className="italic text-zinc-600">TBD</span>}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        {game && <span className="text-[11px] text-zinc-600">{game.name}</span>}
                        {match.round && <span className="text-[11px] text-violet-500">· Round {match.round}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <StatusBadge status={match.status} />
                    <CustomSelect
                      className="w-32"
                      options={[
                        { value: 'upcoming', label: 'À venir' },
                        { value: 'ongoing', label: 'En cours' },
                        { value: 'finished', label: 'Terminé' },
                      ]}
                      value={match.status}
                      onChange={v => updateMatch(match.id, { status: v as any, winnerId: v !== 'finished' ? undefined : match.winnerId })}
                    />
                    {match.status === 'finished' && (
                      <CustomSelect
                        className="w-40"
                        options={[
                          { value: '', label: 'Vainqueur...' },
                          ...(p1 ? [{ value: p1.id, label: p1.pseudo || p1.firstName }] : []),
                          ...(p2 ? [{ value: p2.id, label: p2.pseudo || p2.firstName }] : []),
                        ]}
                        value={match.winnerId || ''}
                        onChange={v => updateMatch(match.id, { winnerId: v })}
                      />
                    )}
                    <Btn variant="danger" size="icon" onClick={() => deleteMatch(match.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Btn>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

const GamesTab = ({ games, players, addGame, deleteGame }: any) => {
  const [newGame, setNewGame] = useState({ name: '', type: '', imageUrl: '', backgroundImageUrl: '' });
  const [uploading, setUploading] = useState<{ [key: string]: boolean }>({});
  const [isAdding, setIsAdding] = useState(false);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: 'imageUrl' | 'backgroundImageUrl') => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(prev => ({ ...prev, [field]: true }));
    try {
      const url = await uploadImage(file);
      setNewGame(p => ({ ...p, [field]: url }));
      useTournamentStore.getState().addToast("Image téléchargée !", "success");
    } catch (err: any) {
      useTournamentStore.getState().addToast("Erreur upload: " + err.message, "error");
    } finally {
      setUploading(prev => ({ ...prev, [field]: false }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGame.name || !newGame.type || !newGame.imageUrl || !newGame.backgroundImageUrl) return;

    setIsAdding(true);
    try {
      await addGame(newGame);
      setNewGame({ name: '', type: '', imageUrl: '', backgroundImageUrl: '' });
      useTournamentStore.getState().addToast("Jeu ajouté avec succès !", "success");
    } catch (err: any) {
      useTournamentStore.getState().addToast("Erreur lors de l'ajout du jeu : " + err.message, "error");
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div className="space-y-8">
      <SectionHeading title="Jeux disponibles" subtitle="Gérez les disciplines du tournoi" />
      <div className="rounded-xl border border-white/5 bg-white/[0.03] p-6">
        <h3 className="text-sm font-bold text-white mb-5 flex items-center gap-2"><Plus className="h-4 w-4 text-zinc-500" /> Ajouter un jeu</h3>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Field label="Nom">
              <input required value={newGame.name} onChange={e => setNewGame({ ...newGame, name: e.target.value })} placeholder="Ex: Tekken 8" className={inputCls} />
            </Field>
            <Field label="Type">
              <input required value={newGame.type} onChange={e => setNewGame({ ...newGame, type: e.target.value })} placeholder="Ex: Fighting" className={inputCls} />
            </Field>
            <Field label="Image (carte)">
              <div className="space-y-2">
                <div className="relative">
                  <input type="file" accept="image/*" onChange={e => handleUpload(e, 'imageUrl')} disabled={uploading.imageUrl}
                    className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-zinc-400 file:mr-3 file:rounded-md file:border-0 file:bg-zinc-700 file:px-3 file:py-1 file:text-xs file:text-zinc-300 cursor-pointer disabled:opacity-50" />
                  {uploading.imageUrl && <div className="absolute right-3 top-1/2 -translate-y-1/2"><Loader2 className="h-3.5 w-3.5 animate-spin text-violet-500" /></div>}
                </div>
                {newGame.imageUrl && (
                  <div className="relative h-20 w-full overflow-hidden rounded-lg border border-white/10">
                    <img src={newGame.imageUrl} alt="Preview" className="h-full w-full object-cover" />
                    <div className="absolute inset-0 bg-black/20" />
                  </div>
                )}
              </div>
            </Field>
            <Field label="Image (fond)">
              <div className="space-y-2">
                <div className="relative">
                  <input type="file" accept="image/*" onChange={e => handleUpload(e, 'backgroundImageUrl')} disabled={uploading.backgroundImageUrl}
                    className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-zinc-400 file:mr-3 file:rounded-md file:border-0 file:bg-zinc-700 file:px-3 file:py-1 file:text-xs file:text-zinc-300 cursor-pointer disabled:opacity-50" />
                  {uploading.backgroundImageUrl && <div className="absolute right-3 top-1/2 -translate-y-1/2"><Loader2 className="h-3.5 w-3.5 animate-spin text-violet-500" /></div>}
                </div>
                {newGame.backgroundImageUrl && (
                  <div className="relative h-20 w-full overflow-hidden rounded-lg border border-white/10">
                    <img src={newGame.backgroundImageUrl} alt="Preview" className="h-full w-full object-cover opacity-60" />
                    <div className="absolute inset-0 bg-black/20" />
                  </div>
                )}
              </div>
            </Field>
          </div>
          <Btn type="submit" disabled={isAdding || !newGame.name || !newGame.type || !newGame.imageUrl || !newGame.backgroundImageUrl || uploading.imageUrl || uploading.backgroundImageUrl} className="w-full sm:w-auto">
            {isAdding ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
            {isAdding ? "Ajout en cours..." : "Ajouter le jeu"}
          </Btn>
        </form>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {games.map((game: any) => (
          <div key={game.id} className="group relative overflow-hidden rounded-xl border border-white/5 bg-zinc-900 h-48">
            <img src={game.backgroundImageUrl} alt="" className="absolute inset-0 h-full w-full object-cover opacity-20 group-hover:opacity-35 transition-opacity duration-500" />
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/95 via-zinc-950/40 to-transparent" />
            <div className="absolute inset-0 flex flex-col justify-end p-5 gap-1">
              <div className="flex items-end justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">{game.type}</span>
                  <h3 className="text-lg font-bold text-white leading-tight">{game.name}</h3>
                  <p className="text-xs text-zinc-500 mt-0.5">{players.filter((p: any) => p.gameId === game.id).length} joueurs inscrits</p>
                </div>
                <Btn variant="danger" size="icon" onClick={() => deleteGame(game.id)} className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Trash2 className="h-3.5 w-3.5" />
                </Btn>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const SettingsTab = ({ majors, levels, addMajor, deleteMajor, addLevel, deleteLevel, cloudinaryConfig, setCloudinaryConfig }: any) => {
  const [newMajor, setNewMajor] = useState('');
  const [newLevel, setNewLevel] = useState('');
  const [clConfig, setClConfig] = useState(cloudinaryConfig);
  const [saving, setSaving] = useState(false);

  const handleSaveCloudinary = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await setCloudinaryConfig(clConfig);
      useTournamentStore.getState().addToast("Configuration Cloudinary enregistrée !", "success");
    } catch (err: any) {
      useTournamentStore.getState().addToast("Erreur lors de l'enregistrement : " + err.message, "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      <SectionHeading title="Filières & Niveaux" subtitle="Configurez les options disponibles lors de l'inscription" />
      <div className="grid gap-6 md:grid-cols-2">
        {/* ... (Keep existing majors/levels UI) ... */}
        <div className="rounded-xl border border-white/5 bg-white/[0.03] p-6 space-y-5">
          <h3 className="text-sm font-bold text-white flex items-center gap-2"><Medal className="h-4 w-4 text-zinc-500" /> Filières</h3>
          <div className="flex gap-2">
            <input value={newMajor} onChange={e => setNewMajor(e.target.value)} placeholder="Ex: RGL" className={cn(inputCls, 'flex-1')} />
            <Btn onClick={() => { if (newMajor.trim()) { addMajor(newMajor.trim()); setNewMajor(''); } }}>Ajouter</Btn>
          </div>
          <div className="space-y-2">
            {majors.map((m: any) => (
              <div key={m.id} className="flex items-center justify-between rounded-lg border border-white/5 bg-zinc-900/60 px-4 py-2.5">
                <span className="text-sm font-medium text-zinc-300">{m.name}</span>
                <Btn variant="danger" size="icon" onClick={() => deleteMajor(m.id)}><Trash2 className="h-3.5 w-3.5" /></Btn>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-xl border border-white/5 bg-white/[0.03] p-6 space-y-5">
          <h3 className="text-sm font-bold text-white flex items-center gap-2"><Star className="h-4 w-4 text-zinc-500" /> Niveaux</h3>
          <div className="flex gap-2">
            <input value={newLevel} onChange={e => setNewLevel(e.target.value)} placeholder="Ex: L1" className={cn(inputCls, 'flex-1')} />
            <Btn onClick={() => { if (newLevel.trim()) { addLevel(newLevel.trim()); setNewLevel(''); } }}>Ajouter</Btn>
          </div>
          <div className="space-y-2">
            {levels.map((l: any) => (
              <div key={l.id} className="flex items-center justify-between rounded-lg border border-white/5 bg-zinc-900/60 px-4 py-2.5">
                <span className="text-sm font-medium text-zinc-300">{l.name}</span>
                <Btn variant="danger" size="icon" onClick={() => deleteLevel(l.id)}><Trash2 className="h-3.5 w-3.5" /></Btn>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-white/5 bg-white/[0.03] p-6 space-y-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sky-500/15 text-sky-400">
            <Shield className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Configuration Cloudinary</h3>
            <p className="text-xs text-zinc-500">Nécessaire pour le téléversement des images</p>
          </div>
        </div>

        <form onSubmit={handleSaveCloudinary} className="grid gap-5 sm:grid-cols-3 items-end">
          <Field label="Cloud Name">
            <input required value={clConfig.cloudName} onChange={e => setClConfig({ ...clConfig, cloudName: e.target.value })} placeholder="Ex: dbaeu5rsy" className={inputCls} />
          </Field>
          <Field label="API Key">
            <input required value={clConfig.apiKey} onChange={e => setClConfig({ ...clConfig, apiKey: e.target.value })} placeholder="Ex: 625533472447459" className={inputCls} />
          </Field>
          <Field label="API Secret">
            <input required type="password" value={clConfig.apiSecret} onChange={e => setClConfig({ ...clConfig, apiSecret: e.target.value })} placeholder="••••••••••••" className={inputCls} />
          </Field>
          <div className="sm:col-span-3 lg:col-span-1">
            <Btn type="submit" disabled={saving} className="w-full sm:w-auto min-w-[140px]">
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Settings className="h-3.5 w-3.5" />}
              Enregistrer
            </Btn>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
export function AdminPage() {
  const {
    games, players, matches, majors, levels, registrationsOpen, adminCode, cloudinaryConfig,
    setRegistrationsOpen, addGame, deleteGame,
    addMatch, updateMatch, deleteMatch, generateBracket,
    addMajor, deleteMajor, addLevel, deleteLevel, deletePlayer, setCloudinaryConfig
  } = useTournamentStore();

  const [activeTab, setActiveTab] = useState<Tab>('dashboard');

  // Authorization state
  const [isAuthorized, setIsAuthorized] = useState(() => sessionStorage.getItem('admin_auth') === 'true');
  const [passcode, setPasscode] = useState('');
  const [error, setError] = useState(false);

  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    if (passcode.toLocaleUpperCase() === adminCode.toLocaleUpperCase()) {
      setIsAuthorized(true);
      sessionStorage.setItem('admin_auth', 'true');
      setError(false);
    } else {
      setError(true);
      setPasscode('');
      setTimeout(() => setError(false), 2000);
    }
  };

  if (!isAuthorized) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center px-4">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-md">
          <div className="relative rounded-3xl border border-zinc-800 bg-zinc-950 p-8 shadow-2xl overflow-hidden group">
            <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-violet-600/10 blur-[100px]" />
            <div className="absolute -left-20 -bottom-20 h-64 w-64 rounded-full bg-fuchsia-600/10 blur-[100px]" />
            <div className="relative flex flex-col items-center text-center">
              <motion.div animate={error ? { x: [-10, 10, -10, 10, 0] } : {}} className={cn("mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border", error ? "border-red-500/50 bg-red-500/10" : "border-violet-500/30 bg-violet-500/10")}>
                {error ? <X className="h-8 w-8 text-red-500" /> : <Lock className="h-8 w-8 text-violet-400" />}
              </motion.div>
              <h1 className="mb-2 text-2xl font-black text-white uppercase tracking-tight">Accès Restreint</h1>
              <p className="mb-8 text-sm text-zinc-500 leading-relaxed">Veuillez entrer votre code d'accès pour continuer.</p>
              <form onSubmit={handleAuth} className="w-full space-y-4">
                <div className="relative group">
                  <Key className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500 group-focus-within:text-violet-400" />
                  <input autoFocus type="password" value={passcode} onChange={e => setPasscode(e.target.value)} placeholder="CODE D'ACCÈS" className={cn("h-12 w-full rounded-xl border pl-11 pr-4 text-center text-sm font-bold tracking-[0.3em] outline-none", error ? "border-red-500/50 bg-red-500/5 text-red-400" : "border-zinc-800 bg-zinc-900/50 text-white focus:border-violet-500")} />
                </div>
                <Btn type="submit" className="h-12 w-full text-base tracking-widest uppercase">Déverrouiller</Btn>
              </form>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  const nav = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'players', label: 'Joueurs', icon: Users },
    { id: 'matches', label: 'Matchs', icon: Swords },
    { id: 'games', label: 'Jeux', icon: Gamepad2 },
    { id: 'settings', label: 'Paramètres', icon: ListFilter },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <DashboardTab players={players} matches={matches} games={games} setActiveTab={setActiveTab} />;
      case 'players': return <PlayersTab players={players} games={games} deletePlayer={deletePlayer} />;
      case 'matches': return <MatchesTab matches={matches} players={players} games={games} addMatch={addMatch} updateMatch={updateMatch} deleteMatch={deleteMatch} generateBracket={generateBracket} />;
      case 'games': return <GamesTab games={games} players={players} addGame={addGame} deleteGame={deleteGame} />;
      case 'settings': return <SettingsTab majors={majors} levels={levels} addMajor={addMajor} deleteMajor={deleteMajor} addLevel={addLevel} deleteLevel={deleteLevel} cloudinaryConfig={cloudinaryConfig} setCloudinaryConfig={setCloudinaryConfig} />;
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] -mt-8 -mx-4 sm:-mx-6 lg:-mx-8 bg-zinc-950/70">
      <div className="sticky top-16 z-30 border-b border-white/[0.06] bg-zinc-950/90 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex items-center justify-between h-14">
            <nav className="flex items-center gap-1 h-full">
              {nav.map(item => (
                <button key={item.id} onClick={() => setActiveTab(item.id as Tab)} className={cn('relative flex items-center gap-2 px-4 h-full text-sm font-medium transition-colors', activeTab === item.id ? 'text-white' : 'text-zinc-500 hover:text-zinc-300')}>
                  <item.icon className={cn('h-4 w-4 shrink-0', activeTab === item.id ? 'text-violet-400' : 'text-zinc-600')} />
                  {item.label}
                  {activeTab === item.id && <motion.div layoutId="admin-tab-underline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-violet-500 rounded-t-full" />}
                </button>
              ))}
            </nav>
            <button onClick={() => setRegistrationsOpen(!registrationsOpen)} className={cn('flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-semibold border transition-all', registrationsOpen ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-zinc-800/80 text-zinc-500 border-zinc-700/50')}>
              <div className={cn('h-1.5 w-1.5 rounded-full', registrationsOpen ? 'bg-emerald-500' : 'bg-zinc-600')} />
              {registrationsOpen ? 'Inscriptions ouvertes' : 'Inscriptions fermées'}
            </button>
          </div>
        </div>
      </div>
      <div className="mx-auto max-w-7xl px-6 py-10">
        <AnimatePresence mode="wait">
          <motion.div key={activeTab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
            {renderContent()}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
