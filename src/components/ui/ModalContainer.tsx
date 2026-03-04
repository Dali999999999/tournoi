import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Send } from "lucide-react";
import { useTournamentStore } from "@/src/store";
import { cn } from "@/src/lib/utils";

export function ModalContainer() {
    const { modal, closeModal } = useTournamentStore();
    const [inputValue, setInputValue] = useState("");

    useEffect(() => {
        if (modal) {
            setInputValue("");
        }
    }, [modal]);

    if (!modal) return null;

    const handleConfirm = () => {
        modal.onConfirm(modal.inputType !== "none" ? inputValue : undefined);
        closeModal();
    };

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
                {/* Backdrop */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={closeModal}
                    className="absolute inset-0 bg-zinc-950/80 backdrop-blur-sm"
                />

                {/* Modal Card */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="relative w-full max-w-md overflow-hidden rounded-[2rem] border border-zinc-800 bg-zinc-900 shadow-2xl"
                >
                    {/* Accent bar */}
                    <div className="h-1.5 w-full bg-gradient-to-r from-violet-600 via-fuchsia-500 to-indigo-600" />

                    <div className="p-8">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-black tracking-tight text-white uppercase">
                                {modal.title}
                            </h2>
                            <button
                                onClick={closeModal}
                                className="p-2 rounded-xl border border-zinc-800 hover:bg-zinc-800 transition-colors"
                            >
                                <X className="h-5 w-5 text-zinc-400" />
                            </button>
                        </div>

                        {modal.description && (
                            <p className="text-zinc-400 text-sm leading-relaxed mb-8">
                                {modal.description}
                            </p>
                        )}

                        {modal.inputType !== "none" && (
                            <div className="relative mb-8">
                                <input
                                    autoFocus
                                    type={modal.inputType === "password" ? "password" : "text"}
                                    value={inputValue}
                                    onChange={(e) => setInputValue(e.target.value)}
                                    onKeyDown={(e) => e.key === "Enter" && handleConfirm()}
                                    placeholder="Tapez ici..."
                                    className="w-full rounded-2xl border border-zinc-800 bg-zinc-950/50 px-5 py-4 text-white placeholder:text-zinc-600 focus:border-violet-500 outline-none transition-all"
                                />
                            </div>
                        )}

                        <div className="flex gap-4">
                            <button
                                onClick={closeModal}
                                className="flex-1 h-12 rounded-xl border border-zinc-800 text-zinc-400 font-bold uppercase tracking-wider hover:bg-zinc-800 transition-colors"
                            >
                                {modal.cancelText || "Annuler"}
                            </button>
                            <button
                                onClick={handleConfirm}
                                className="flex-1 h-12 rounded-xl bg-violet-600 text-white font-black uppercase tracking-wider shadow-lg shadow-violet-600/30 hover:bg-violet-500 transition-all flex items-center justify-center gap-2"
                            >
                                {modal.confirmText || (modal.inputType !== "none" ? "Valider" : "Confirmer")}
                                <Send className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
