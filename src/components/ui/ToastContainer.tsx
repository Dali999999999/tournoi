import { motion, AnimatePresence } from "motion/react";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";
import { useTournamentStore } from "@/src/store";
import { cn } from "@/src/lib/utils";

export function ToastContainer() {
    const { toasts, removeToast } = useTournamentStore();

    return (
        <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3 w-full max-w-sm pointer-events-none">
            <AnimatePresence mode="popLayout">
                {toasts.map((toast) => (
                    <motion.div
                        key={toast.id}
                        layout
                        initial={{ opacity: 0, x: 50, scale: 0.9 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.85, transition: { duration: 0.2 } }}
                        className={cn(
                            "pointer-events-auto relative overflow-hidden rounded-2xl border p-4 shadow-2xl backdrop-blur-xl flex items-start gap-3",
                            toast.type === "success" && "border-emerald-500/20 bg-emerald-500/10 text-emerald-400",
                            toast.type === "error" && "border-red-500/20 bg-red-500/10 text-red-400",
                            toast.type === "info" && "border-violet-500/20 bg-violet-500/10 text-violet-400"
                        )}
                    >
                        <div className="flex-shrink-0 mt-0.5">
                            {toast.type === "success" && <CheckCircle2 className="h-5 w-5" />}
                            {toast.type === "error" && <AlertCircle className="h-5 w-5" />}
                            {toast.type === "info" && <Info className="h-5 w-5" />}
                        </div>

                        <div className="flex-1 text-sm font-medium leading-relaxed">
                            {toast.message}
                        </div>

                        <button
                            onClick={() => removeToast(toast.id)}
                            className="flex-shrink-0 p-1 rounded-lg hover:bg-white/10 transition-colors"
                        >
                            <X className="h-4 w-4" />
                        </button>

                        {/* Progress bar */}
                        <motion.div
                            initial={{ width: "100%" }}
                            animate={{ width: "0%" }}
                            transition={{ duration: 5, ease: "linear" }}
                            className={cn(
                                "absolute bottom-0 left-0 h-1",
                                toast.type === "success" && "bg-emerald-500/40",
                                toast.type === "error" && "bg-red-500/40",
                                toast.type === "info" && "bg-violet-500/40"
                            )}
                        />
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
}
