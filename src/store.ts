import { create } from "zustand";

const GAS_URL = "https://script.google.com/macros/s/AKfycbzaFbtdSIWOaWk_xXAnp9YWBK-QdRiKQ9VbIl-MfPpjTkF538WEOt82wXgACVaULgFHGQ/exec";

export interface Game {
  id: string;
  name: string;
  type: string;
  imageUrl: string;
  backgroundImageUrl: string;
}

export interface Major {
  id: string;
  name: string;
}

export interface Level {
  id: string;
  name: string;
}

export interface Player {
  id: string;
  firstName: string;
  lastName: string;
  pseudo?: string;
  major: string;
  level: string;
  gameId: string;
  avatarUrl?: string;
  email: string;
}

export interface Match {
  id: string;
  gameId: string;
  player1Id: string | null;
  player2Id: string | null;
  status: "upcoming" | "ongoing" | "finished";
  winnerId?: string;
  round?: number;
  nextMatchId?: string;
}

export interface Toast {
  id: string;
  message: string;
  type: "success" | "error" | "info";
}

export interface Modal {
  id: string;
  title: string;
  description?: string;
  inputType?: "text" | "password" | "none";
  onConfirm: (value?: string) => void;
  confirmText?: string;
  cancelText?: string;
}

interface TournamentStore {
  games: Game[];
  players: Player[];
  matches: Match[];
  majors: Major[];
  levels: Level[];
  registrationsOpen: boolean;
  adminCode: string;
  cloudinaryConfig: {
    cloudName: string;
    apiKey: string;
    apiSecret: string;
  };
  currentBgImage: string | null;
  toasts: Toast[];
  modal: Modal | null;
  settings: Record<string, any>;

  // Actions
  sync: () => Promise<void>;
  setRegistrationsOpen: (open: boolean) => Promise<void>;
  setCloudinaryConfig: (config: { cloudName: string; apiKey: string; apiSecret: string }) => Promise<void>;
  setCurrentBgImage: (url: string | null) => void;

  // UI Actions
  addToast: (message: string, type?: Toast["type"]) => void;
  removeToast: (id: string) => void;
  openModal: (modal: Omit<Modal, "id">) => void;
  closeModal: () => void;

  // Games
  addGame: (game: Omit<Game, "id">) => Promise<void>;
  updateGame: (id: string, game: Partial<Game>) => Promise<void>;
  deleteGame: (id: string) => Promise<void>;

  // Majors & Levels
  addMajor: (name: string) => Promise<void>;
  deleteMajor: (id: string) => Promise<void>;
  addLevel: (name: string) => Promise<void>;
  deleteLevel: (id: string) => Promise<void>;

  // Players
  registerPlayer: (player: Omit<Player, "id">) => Promise<Player>;
  updatePlayer: (id: string, player: Partial<Player>) => Promise<void>;
  deletePlayer: (id: string) => Promise<void>;

  // Matches
  addMatch: (match: Omit<Match, "id">) => Promise<void>;
  updateMatch: (id: string, match: Partial<Match>) => Promise<void>;
  deleteMatch: (id: string) => Promise<void>;
  generateBracket: (gameId: string) => Promise<void>;
}

// Helper for GAS calls
async function callGAS(action: string, data?: any) {
  try {
    const response = await fetch(GAS_URL, {
      method: "POST",
      mode: "no-cors", // Required for GAS redirects, but prevents reading response body
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, data }),
    });
    return response;
  } catch (error) {
    console.error(`GAS Action ${action} failed:`, error);
    throw error;
  }
}

// Version of callGAS that handles the redirect and returns JSON (requires cors proxy or specific GAS headers)
// Since GAS 'no-cors' is limited, we'll optimistically update local state after sending.
async function sendAction(action: string, data: any) {
  const resp = await fetch(GAS_URL, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify({ action, data }),
  });
  const result = await resp.json();
  if (!result.success) {
    throw new Error(result.error || `Action ${action} échouée`);
  }
  return result;
}

export const useTournamentStore = create<TournamentStore>((set, get) => ({
  games: [],
  players: [],
  matches: [],
  majors: [],
  levels: [],
  registrationsOpen: true,
  adminCode: "NEXUS2026", // Default fallback
  cloudinaryConfig: {
    cloudName: "",
    apiKey: "",
    apiSecret: "",
  },
  currentBgImage: null,
  toasts: [],
  modal: null,
  settings: {},

  // UI Actions
  addToast: (message, type = "info") => {
    const id = Math.random().toString(36).substring(2, 9);
    set((state) => ({ toasts: [...state.toasts, { id, message, type }] }));
    setTimeout(() => get().removeToast(id), 5000);
  },
  removeToast: (id) =>
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
  openModal: (modal) =>
    set({ modal: { ...modal, id: Math.random().toString(36).substring(2, 9) } }),
  closeModal: () => set({ modal: null }),

  sync: async () => {
    try {
      const resp = await fetch(GAS_URL);
      const data = await resp.json();
      set({
        games: data.games || [],
        players: data.players || [],
        matches: data.matches || [],
        majors: data.majors || [],
        levels: data.levels || [],
        settings: data.settings || {},
        registrationsOpen: data.settings?.registrationsOpen !== "false",
        adminCode: data.settings?.adminCode || "NEXUS2026",
        cloudinaryConfig: {
          cloudName: data.settings?.CLOUDINARY_CLOUD_NAME || "",
          apiKey: data.settings?.CLOUDINARY_API_KEY || "",
          apiSecret: data.settings?.CLOUDINARY_API_SECRET || "",
        },
      });
    } catch (e) {
      console.error("Sync failed:", e);
    }
  },

  setRegistrationsOpen: async (open) => {
    set({ registrationsOpen: open });
    await sendAction("updateSetting", { key: "registrationsOpen", value: String(open) });
  },

  setCloudinaryConfig: async (config) => {
    set({ cloudinaryConfig: config });
    // Update settings in GAS as a single batch to avoid race conditions
    await sendAction("updateSettings", {
      CLOUDINARY_CLOUD_NAME: config.cloudName,
      CLOUDINARY_API_KEY: config.apiKey,
      CLOUDINARY_API_SECRET: config.apiSecret,
    });
  },

  setCurrentBgImage: (url) => set({ currentBgImage: url }),

  addGame: async (game) => {
    const newGame = { ...game, id: `g${Date.now()}` };
    set((state) => ({ games: [...state.games, newGame] }));
    await sendAction("addGame", newGame);
  },

  updateGame: async (id, updatedGame) => {
    set((state) => ({
      games: state.games.map((g) => (g.id === id ? { ...g, ...updatedGame } : g)),
    }));
    await sendAction("updateGame", { id, ...updatedGame });
  },

  deleteGame: async (id) => {
    set((state) => ({ games: state.games.filter((g) => g.id !== id) }));
    await sendAction("deleteGame", { id });
  },

  addMajor: async (name) => {
    const major = { id: `maj${Date.now()}`, name };
    set((state) => ({ majors: [...state.majors, major] }));
    await sendAction("updateMajor", major);
  },

  deleteMajor: async (id) => {
    set((state) => ({ majors: state.majors.filter((m) => m.id !== id) }));
    await sendAction("deleteMajor", { id });
  },

  addLevel: async (name) => {
    const level = { id: `lvl${Date.now()}`, name };
    set((state) => ({ levels: [...state.levels, level] }));
    await sendAction("updateLevel", level);
  },

  deleteLevel: async (id) => {
    set((state) => ({ levels: state.levels.filter((l) => l.id !== id) }));
    await sendAction("deleteLevel", { id });
  },

  registerPlayer: async (player) => {
    const result = await sendAction("registerPlayer", player);
    set((state) => ({ players: [...state.players, result.result] }));
    return result.result;
  },

  updatePlayer: async (id, updatedPlayer) => {
    set((state) => ({
      players: state.players.map((p) => (p.id === id ? { ...p, ...updatedPlayer } : p)),
    }));
    await sendAction("updatePlayer", { id, ...updatedPlayer });
  },

  deletePlayer: async (id) => {
    set((state) => ({ players: state.players.filter((p) => p.id !== id) }));
    await sendAction("deletePlayer", { id });
  },

  addMatch: async (match) => {
    const newMatch = { ...match, id: `m${Date.now()}` };
    set((state) => ({ matches: [...state.matches, newMatch] }));
    await sendAction("addMatch", newMatch);
  },

  updateMatch: async (id, updatedMatch) => {
    set((state) => {
      const newMatches = state.matches.map((m) =>
        m.id === id ? { ...m, ...updatedMatch } : m,
      );

      const updated = newMatches.find((m) => m.id === id);
      if (updated && updated.status === "finished" && updated.winnerId && updated.nextMatchId) {
        const nextMatch = newMatches.find((m) => m.id === updated.nextMatchId);
        if (nextMatch) {
          if (!nextMatch.player1Id || nextMatch.player1Id === updated.player1Id || nextMatch.player1Id === updated.player2Id) {
            nextMatch.player1Id = updated.winnerId;
          } else {
            nextMatch.player2Id = updated.winnerId;
          }
          // We'll need to update the next match remotely too
          // This logic is getting complex, for now we let the user sync or we send the whole chunk
        }
      }
      return { matches: newMatches };
    });
    const match = get().matches.find(m => m.id === id);
    if (match) await sendAction("updateMatch", match);
    // If nextMatch was updated, we should send it too
    const updated = get().matches.find(m => m.id === id);
    if (updated?.nextMatchId) {
      const next = get().matches.find(m => m.id === updated.nextMatchId);
      if (next) await sendAction("updateMatch", next);
    }
  },

  deleteMatch: async (id) => {
    set((state) => ({ matches: state.matches.filter((m) => m.id !== id) }));
    await sendAction("deleteMatch", { id });
  },

  generateBracket: async (gameId) => {
    // Local calculation (reusing current logic)
    const state = get();
    const gamePlayers = state.players.filter((p) => p.gameId === gameId);
    if (gamePlayers.length < 2) return;

    const shuffled = [...gamePlayers].sort(() => Math.random() - 0.5);
    const numPlayers = shuffled.length;
    const bracketSize = Math.pow(2, Math.ceil(Math.log2(numPlayers)));

    const paddedPlayers = [...shuffled];
    while (paddedPlayers.length < bracketSize) {
      paddedPlayers.push(null as any);
    }

    const newMatches: Match[] = [];
    let currentRoundMatches: Match[] = [];
    let matchCounter = 1;

    for (let i = 0; i < bracketSize; i += 2) {
      const p1 = paddedPlayers[i];
      const p2 = paddedPlayers[i + 1];
      const isBye = !p1 || !p2;
      const winnerId = isBye ? (p1 ? p1.id : p2 ? p2.id : undefined) : undefined;
      const status = isBye ? "finished" : "upcoming";

      const match: Match = {
        id: `m_${gameId}_r1_${matchCounter++}`,
        gameId,
        player1Id: p1 ? p1.id : null,
        player2Id: p2 ? p2.id : null,
        status,
        winnerId,
        round: 1,
      };
      currentRoundMatches.push(match);
      newMatches.push(match);
    }

    let round = 2;
    let previousRoundMatches = [...currentRoundMatches];
    while (previousRoundMatches.length > 1) {
      currentRoundMatches = [];
      for (let i = 0; i < previousRoundMatches.length; i += 2) {
        const m1 = previousRoundMatches[i];
        const m2 = previousRoundMatches[i + 1];
        const match: Match = {
          id: `m_${gameId}_r${round}_${matchCounter++}`,
          gameId,
          player1Id: m1.winnerId || null,
          player2Id: m2.winnerId || null,
          status: "upcoming",
          round,
        };
        m1.nextMatchId = match.id;
        m2.nextMatchId = match.id;
        currentRoundMatches.push(match);
        newMatches.push(match);
      }
      previousRoundMatches = [...currentRoundMatches];
      round++;
    }

    const filteredMatches = state.matches.filter((m) => m.gameId !== gameId);
    const resultMatches = [...filteredMatches, ...newMatches];
    set({ matches: resultMatches });

    // Send all matches for this game to GAS
    await sendAction("setMatches", resultMatches.filter(m => m.gameId === gameId));
  },
}));

