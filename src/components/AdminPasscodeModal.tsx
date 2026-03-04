import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Lock, Key, X, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTournamentStore } from "@/src/store";
import { cn } from "@/src/lib/utils";

interface AdminPasscodeModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function AdminPasscodeModal({ isOpen, onClose }: AdminPasscodeModalProps) {
    const [passcode, setPasscode] = useState("");
    const [error, setError] = useState(false);
    const [loading, setLoading] = useState(false);
    const { adminCode } = useTournamentStore();
    const navigate = useNavigate();
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    // Auto-close after 10 seconds of inactivity
    useEffect(() => {
        if (isOpen) {
            resetTimer();
        } else {
            clearTimer();
            setPasscode("");
            setError(false);
        }
        return () => clearTimer();
    }, [isOpen]);

    const clearTimer = () => {
        if (timerRef.current) clearTimeout(timerRef.current);
    };

    const resetTimer = () => {
        clearTimer();
        timerRef.current = setTimeout(() => {
            onClose();
        }, 10000); // 10 seconds
    };

    const handleAuth = (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        if (passcode.toUpperCase() === adminCode.toUpperCase()) {
            sessionStorage.setItem("admin_auth", "true");
            onClose();
            navigate("/admin");
        } else {
            setError(true);
            setPasscode("");
            setTimeout(() => setError(false), 1500);
        }
        setLoading(false);
        resetTimer(); // Reset timer after attempt
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setPasscode(e.target.value);
        resetTimer(); // Reset timer on every keystroke
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-sm">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="w-full max-w-sm relative"
                    >
                        <div className="relative rounded-3xl border border-zinc-800 bg-zinc-900 p-8 shadow-2xl overflow-hidden shadow-violet-500/10">
                            <div className="absolute -right-20 -top-20 h-48 w-48 rounded-full bg-violet-600/10 blur-[80px]" />

                            <button
                                onClick={onClose}
                                className="absolute top-4 right-4 p-2 text-zinc-500 hover:text-white transition-colors"
                            >
                                <X className="h-5 w-5" />
                            </button>

                            <div className="relative flex flex-col items-center text-center">
                                <motion.div
                                    animate={error ? { x: [-10, 10, -10, 10, 0] } : {}}
                                    className={cn(
                                        "mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border",
                                        error ? "border-red-500/50 bg-red-500/10" : "border-violet-500/30 bg-violet-500/10"
                                    )}
                                >
                                    {error ? <X className="h-8 w-8 text-red-500" /> : <Lock className="h-8 w-8 text-violet-400" />}
                                </motion.div>

                                <h2 className="text-xl font-black text-white uppercase tracking-tight mb-2">Accès Sécurisé</h2>
                                <p className="text-sm text-zinc-500 mb-8 px-4 leading-relaxed">Entrez le code pour accéder au panneau de commande.</p>

                                <form onSubmit={handleAuth} className="w-full space-y-4">
                                    <div className="relative group">
                                        <Key className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500 group-focus-within:text-violet-400" />
                                        <input
                                            autoFocus
                                            type="password"
                                            value={passcode}
                                            onChange={handleInputChange}
                                            placeholder="••••••"
                                            className={cn(
                                                "h-12 w-full rounded-xl border pl-11 pr-4 text-center text-lg font-bold tracking-[0.5em] outline-none transition-all",
                                                error
                                                    ? "border-red-500/50 bg-red-500/5 text-red-400"
                                                    : "border-zinc-800 bg-zinc-950/50 text-white focus:border-violet-500 focus:bg-zinc-950"
                                            )}
                                        />
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={loading || !passcode}
                                        className="h-12 w-full rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold tracking-widest uppercase text-sm shadow-lg shadow-violet-600/20 transition-all active:scale-[0.98] disabled:opacity-50"
                                    >
                                        {loading ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : "Déverrouiller"}
                                    </button>
                                </form>

                                <div className="mt-8 flex gap-1 items-center justify-center">
                                    <div className="h-1 w-12 rounded-full bg-zinc-800 overflow-hidden">
                                        <motion.div
                                            key={isOpen ? 'active' : 'inactive'}
                                            initial={{ width: "100%" }}
                                            animate={{ width: "0%" }}
                                            transition={{ duration: 10, ease: "linear" }}
                                            className="h-full bg-violet-500"
                                        />
                                    </div>
                                    <span className="text-[10px] uppercase font-bold text-zinc-600 tracking-tighter">Auto-fermeture</span>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
