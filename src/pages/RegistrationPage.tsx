import { useState, useRef } from "react";
import { useTournamentStore } from "@/src/store";
import { cn } from "@/src/lib/utils";
import { CustomSelect } from "@/src/components/ui/custom-select";
import { Badge } from "@/src/components/ui/badge";
import {
  motion,
  AnimatePresence,
  useScroll,
  useTransform,
  useInView,
} from "motion/react";
import {
  Gamepad2,
  AlertCircle,
  CheckCircle2,
  User,
  Trophy,
  ArrowRight,
  ShieldAlert,
  Sword,
  Search,
  Zap,
  Clock,
  ChevronDown,
  Mail,
  Fingerprint,
  Camera,
  Upload,
  Loader2,
  Copy,
  LogOut,
  Edit3,
} from "lucide-react";
import { uploadImage } from "@/src/lib/cloudinary";

// ─── Isolated sub-components (defined outside main component to avoid remounting) ─────

function SectionTitle({
  children,
  subtitle,
}: {
  children: React.ReactNode;
  subtitle?: string;
}) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });
  return (
    <div ref={ref} className="mb-16 text-center">
      <motion.h2
        initial={{ opacity: 0, y: 24 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.5 }}
        className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl mb-4"
      >
        {children}
      </motion.h2>
      {subtitle && (
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="text-lg text-zinc-400 font-medium max-w-2xl mx-auto"
        >
          {subtitle}
        </motion.p>
      )}
    </div>
  );
}

function InstructionStep({
  icon: Icon,
  title,
  description,
  delay = 0,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  delay?: number;
}) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-40px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, x: -20 }}
      animate={isInView ? { opacity: 1, x: 0 } : {}}
      transition={{ duration: 0.4, delay }}
      className="flex gap-5 group"
    >
      <div className="flex-shrink-0">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-900 border border-zinc-800 text-violet-500 transition-all duration-300 group-hover:bg-violet-600 group-hover:text-white group-hover:border-violet-500 group-hover:shadow-[0_0_20px_rgba(139,92,246,0.3)]">
          <Icon className="h-6 w-6" />
        </div>
      </div>
      <div>
        <h3 className="text-lg font-bold text-white mb-1.5 group-hover:text-violet-400 transition-colors">
          {title}
        </h3>
        <p className="text-zinc-500 leading-relaxed text-sm">{description}</p>
      </div>
    </motion.div>
  );
}

function RuleItem({
  title,
  text,
  icon: Icon,
  delay = 0,
}: {
  title: string;
  text: string;
  icon: React.ComponentType<{ className?: string }>;
  delay?: number;
}) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-40px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.4, delay }}
      className="relative p-6 rounded-2xl border border-zinc-800/60 bg-zinc-900/30 backdrop-blur-sm overflow-hidden group hover:border-violet-500/40 transition-all duration-300"
    >
      <div className="absolute top-0 right-0 -mr-6 -mt-6 h-24 w-24 bg-violet-500/5 blur-2xl group-hover:bg-violet-500/10 transition-colors rounded-full" />
      <Icon className="h-8 w-8 text-violet-500 mb-4 relative z-10" />
      <h4 className="text-base font-bold text-white mb-2 relative z-10">{title}</h4>
      <p className="text-zinc-500 text-sm leading-relaxed relative z-10">{text}</p>
    </motion.div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────

export function RegistrationPage() {
  const {
    games,
    majors,
    levels,
    matches,
    registerPlayer,
    updatePlayer,
    registrationsOpen,
    addToast,
    openModal,
  } = useTournamentStore();

  const [hoveredGame, setHoveredGame] = useState<(typeof games)[0] | null>(null);
  const [isRegistered, setIsRegistered] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [lookupId, setLookupId] = useState("");
  const [registeredPlayerId, setRegisteredPlayerId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    pseudo: "",
    email: "",
    major: majors[0]?.name || "",
    level: levels[0]?.name || "",
    gameId: "",
    avatarUrl: "",
  });

  const selectedGame = games.find(g => g.id === formData.gameId);
  const activeBgGame = hoveredGame || selectedGame;

  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const url = await uploadImage(file);
      setFormData((prev) => ({ ...prev, avatarUrl: url }));
      addToast("Image téléchargée !", "success");
    } catch (err: any) {
      addToast("Erreur lors de l'upload: " + err.message, "error");
    } finally {
      setIsUploading(false);
    }
  };

  const playerMatches = registeredPlayerId
    ? matches.filter(m => m.player1Id === registeredPlayerId || m.player2Id === registeredPlayerId)
    : [];

  const stats = {
    total: playerMatches.length,
    wins: playerMatches.filter(m => m.winnerId === registeredPlayerId).length,
    losses: playerMatches.filter(m => m.status === 'finished' && m.winnerId && m.winnerId !== registeredPlayerId).length
  };

  // Scroll-based parallax for hero
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const heroOpacity = useTransform(scrollYProgress, [0, 0.6], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 0.6], [1, 0.92]);
  const heroY = useTransform(scrollYProgress, [0, 0.6], [0, 80]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleLookup = () => {
    const p = useTournamentStore.getState().players.find(p => p.id === lookupId);
    if (p) {
      setFormData({
        firstName: p.firstName,
        lastName: p.lastName,
        pseudo: p.pseudo || "",
        email: p.email,
        major: p.major,
        level: p.level,
        gameId: p.gameId,
        avatarUrl: p.avatarUrl || "",
      });
      setRegisteredPlayerId(p.id);
      setIsEditing(true);
      setIsRegistered(true);
      addToast("Profil récupéré !", "success");
    } else {
      addToast("Identifiant non trouvé.", "error");
    }
  };

  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!registrationsOpen) return;

    setIsSubmitting(true);
    try {
      if (isEditing && registeredPlayerId) {
        await updatePlayer(registeredPlayerId, {
          gameId: formData.gameId,
          pseudo: formData.pseudo,
          avatarUrl: formData.avatarUrl,
        });
        addToast("Inscription modifiée avec succès !", "success");
        setIsEditing(false);
      } else {
        const result = await registerPlayer({
          ...formData,
          avatarUrl:
            formData.avatarUrl ||
            `https://api.dicebear.com/7.x/avataaars/svg?seed=${formData.pseudo || formData.firstName}`,
        } as any);
        setRegisteredPlayerId(result.id);
        setIsRegistered(true);
        setIsEditing(true);

        addToast("Inscription réussie ! Un email de confirmation a été envoyé.", "success");
      }
    } catch (err: any) {
      addToast("Erreur: " + err.message, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputCls =
    "w-full rounded-xl border border-zinc-800 bg-zinc-950/80 px-4 py-3 text-sm text-zinc-200 placeholder:text-zinc-600 outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/20 transition-all";

  const labelCls = "block text-[11px] font-bold uppercase tracking-widest text-zinc-500 mb-2";

  return (
    // No padding override — Layout's padding is handled, we use full-bleed sections
    <div className="-mx-4 sm:-mx-6 lg:-mx-8 -mt-8 overflow-x-hidden">

      {/* ── Game background overlay — full-screen, no content gaps ── */}
      <AnimatePresence mode="wait">
        {activeBgGame && (
          <motion.div
            key={activeBgGame.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="fixed inset-0 z-0 pointer-events-none"
          >
            <img
              src={activeBgGame.backgroundImageUrl}
              alt=""
              className="h-full w-full object-cover"
            />
            {/* Strong vignette so all text stays perfectly readable */}
            <div className="absolute inset-0 bg-gradient-to-b from-zinc-950/85 via-zinc-950/50 to-zinc-950/90" />
            <div className="absolute inset-0 bg-gradient-to-r from-zinc-950/40 to-zinc-950/40" />
            {/* Game watermark */}
            <div className="absolute inset-x-0 bottom-12 flex flex-col items-center gap-1 select-none">
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/20">
                {activeBgGame.type}
              </span>
              <span className="text-[clamp(3rem,8vw,7rem)] font-black uppercase tracking-tighter text-white/10 text-center leading-none px-4">
                {activeBgGame.name}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Hero section — full viewport height ── */}
      <section
        ref={heroRef}
        className="relative flex min-h-screen items-center justify-center overflow-hidden"
      >
        {/* Static ambient glows behind content */}
        <div className="absolute inset-0 z-0 pointer-events-none">
          <motion.div
            animate={{ scale: [1, 1.15, 1], opacity: [0.25, 0.4, 0.25] }}
            transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -top-1/4 -left-1/4 w-3/4 h-3/4 bg-violet-700/20 blur-[150px] rounded-full"
          />
          <motion.div
            animate={{ scale: [1, 1.2, 1], opacity: [0.15, 0.3, 0.15] }}
            transition={{ duration: 18, repeat: Infinity, ease: "easeInOut", delay: 3 }}
            className="absolute -bottom-1/4 -right-1/4 w-3/4 h-3/4 bg-fuchsia-700/20 blur-[150px] rounded-full"
          />
        </div>

        <motion.div
          style={{ opacity: heroOpacity, scale: heroScale, y: heroY }}
          className="relative z-10 mx-auto max-w-4xl px-6 text-center"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, type: "spring" }}
            className="inline-flex items-center gap-2 rounded-full border border-violet-500/25 bg-violet-500/10 px-4 py-1.5 text-sm font-semibold text-violet-400 mb-10 backdrop-blur-sm"
          >
            <Zap className="h-3.5 w-3.5 fill-current" />
            Championnat 2026
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="text-6xl font-black tracking-tighter text-white sm:text-8xl mb-6 leading-[1]"
          >
            L'ARÈNE
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 via-fuchsia-400 to-indigo-400">
              ATTEND SES
              <br />
              CHAMPIONS
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.25 }}
            className="text-lg text-zinc-400 max-w-xl mx-auto leading-relaxed mb-12"
          >
            Préparez-vous à l'affrontement ultime. Inscrivez-vous, relevez les défis et gravez votre nom au sommet de l'Olympe.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="flex flex-col sm:flex-row gap-4 items-center justify-center"
          >
            <button
              onClick={() =>
                document.getElementById("registration")?.scrollIntoView({ behavior: "smooth" })
              }
              className="h-14 px-10 text-base rounded-2xl bg-violet-600 hover:bg-violet-500 text-white font-black shadow-[0_0_40px_rgba(139,92,246,0.4)] hover:shadow-[0_0_60px_rgba(139,92,246,0.6)] transition-all hover:scale-105 flex items-center gap-2"
            >
              <Zap className="h-4 w-4 fill-current" />
              C'EST PARTI !
            </button>
            <button
              onClick={() =>
                document.getElementById("instructions")?.scrollIntoView({ behavior: "smooth" })
              }
              className="h-14 px-10 text-base rounded-2xl border border-zinc-700 bg-zinc-900/60 backdrop-blur-md text-white font-semibold hover:bg-zinc-800 hover:border-zinc-600 transition-all flex items-center gap-2"
            >
              Comment ça marche ?
            </button>
          </motion.div>
        </motion.div>
      </section>

      {/* ── Instructions Section ── */}
      <section id="instructions" className="relative z-10 py-28 px-6">
        <div className="mx-auto max-w-6xl">
          <SectionTitle subtitle="Le chemin vers la gloire commence ici. Suivez ces étapes.">
            Comment <span className="text-violet-500">Participer</span>
          </SectionTitle>

          <div className="grid gap-x-20 gap-y-16 md:grid-cols-2 items-center">
            <div className="space-y-10">
              <InstructionStep
                icon={User}
                title="Créez votre Profil"
                description="Remplissez le formulaire avec vos informations réelles et choisissez un pseudonyme marquant."
                delay={0}
              />
              <InstructionStep
                icon={Gamepad2}
                title="Choisissez votre Discipline"
                description="Sélectionnez le jeu dans lequel vous voulez exceller. Une seule catégorie par joueur."
                delay={0.1}
              />
              <InstructionStep
                icon={Sword}
                title="Rejoignez la Mêlée"
                description="Consultez l'onglet des matchs pour connaître votre premier adversaire et l'heure de votre duel."
                delay={0.2}
              />
              <InstructionStep
                icon={Trophy}
                title="Devenez une Légende"
                description="Remportez vos matchs, grimpez dans le bracket et décrochez le titre suprême."
                delay={0.3}
              />
            </div>

            {/* Visual panel */}
            <motion.div
              initial={{ opacity: 0, scale: 0.92 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="relative aspect-[4/3] rounded-3xl overflow-hidden border border-zinc-800/50 shadow-2xl"
            >
              <img
                src="https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=2070&auto=format&fit=crop"
                alt="Gaming setup"
                className="absolute inset-0 w-full h-full object-cover opacity-50"
              />
              <div className="absolute inset-0 bg-gradient-to-tr from-zinc-950/80 via-zinc-950/30 to-violet-900/30" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="h-20 w-20 rounded-2xl bg-violet-600/90 backdrop-blur-sm flex items-center justify-center shadow-[0_0_50px_rgba(139,92,246,0.7)]">
                  <Trophy className="h-10 w-10 text-white" />
                </div>
              </div>
              {/* Corner dots decoration */}
              <div className="absolute top-5 right-5 grid grid-cols-5 gap-1.5 opacity-30">
                {Array.from({ length: 25 }).map((_, i) => (
                  <div key={i} className="h-1.5 w-1.5 rounded-full bg-violet-400" />
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section >

      {/* ── Rules Section ── */}
      < section className="relative z-10 py-28 px-6" >
        {/* Subtle separator */}
        < div className="mx-auto max-w-6xl mb-16" >
          <div className="h-px bg-gradient-to-r from-transparent via-zinc-800 to-transparent" />
        </div >
        <div className="mx-auto max-w-6xl">
          <SectionTitle subtitle="Le respect et le fair-play sont le fondement de notre communauté.">
            Règles de <span className="text-fuchsia-400">L'Arène</span>
          </SectionTitle>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <RuleItem
              icon={ShieldAlert}
              title="Fair-Play"
              text="Toute triche ou comportement toxique entraîne une disqualification immédiate et définitive."
              delay={0}
            />
            <RuleItem
              icon={Clock}
              title="Ponctualité"
              text="Tout retard de plus de 10 minutes à un match est considéré comme un forfait (2-0)."
              delay={0.08}
            />
            <RuleItem
              icon={Search}
              title="Vérification"
              text="Votre identité réelle doit correspondre à celle de votre carte d'étudiant avant chaque match."
              delay={0.16}
            />
            <RuleItem
              icon={Gamepad2}
              title="Matériel"
              text="Vous pouvez apporter vos propres périphériques s'ils sont homologués par l'organisateur."
              delay={0.24}
            />
          </div>
        </div>
      </section >

      {/* ── Registration Section ── */}
      < section id="registration" className="relative z-10 py-28 px-6" >
        <div className="mx-auto max-w-6xl mb-16">
          <div className="h-px bg-gradient-to-r from-transparent via-zinc-800 to-transparent" />
        </div>
        <div className="mx-auto max-w-3xl">
          {!registrationsOpen && !isRegistered ? (
            // Closed state
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="flex flex-col items-center justify-center text-center py-20"
            >
              <div className="mb-8 rounded-2xl bg-red-500/10 border border-red-500/20 p-8">
                <AlertCircle className="h-14 w-14 text-red-500" />
              </div>
              <h2 className="mb-4 text-4xl font-black tracking-tight text-white">
                Inscriptions Fermées
              </h2>
              <p className="max-w-md text-zinc-400 text-base leading-relaxed">
                Les portes de l'arène sont actuellement closes. Restez à
                l'écoute pour l'annonce de la prochaine session.
              </p>
              <button
                className="mt-10 h-12 px-8 rounded-xl border border-zinc-700 text-zinc-300 hover:bg-zinc-800 transition-all text-sm font-semibold flex items-center gap-2"
                onClick={() => (window.location.href = "/matches")}
              >
                Consulter les Matchs
                <ArrowRight className="h-4 w-4" />
              </button>
            </motion.div>
          ) : (
            // Open state
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <SectionTitle subtitle="Saisissez votre chance maintenant. L'arène vous attend.">
                L'Heure de l'<span className="text-violet-400">Inscription</span>
              </SectionTitle>

              {/* Form card */}
              <div className="relative z-20 rounded-2xl border border-zinc-800/50 bg-zinc-950/70 backdrop-blur-xl shadow-2xl">
                {/* Top accent bar */}
                <div className="h-0.5 w-full bg-gradient-to-r from-violet-600 via-fuchsia-500 to-indigo-600" />

                <div className="p-8 sm:p-10">
                  {/* Header */}
                  <div className="flex items-center gap-3 mb-8">
                    <div className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-xl",
                      isRegistered ? "bg-emerald-500/15" : "bg-violet-500/15"
                    )}>
                      {isRegistered
                        ? <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                        : <User className="h-5 w-5 text-violet-400" />
                      }
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white">
                        {isRegistered && !isEditing ? "Profil Compétiteur" : isEditing ? "Modification du Profil" : "Profil du Joueur"}
                      </h3>
                      {!isRegistered && !isEditing && (
                        <button
                          type="button"
                          onClick={() => {
                            openModal({
                              title: "Modifier mon inscription",
                              description: "Entrez votre identifiant unique reçu par mail pour retrouver vos informations.",
                              inputType: "text",
                              confirmText: "Rechercher",
                              onConfirm: (id) => {
                                if (!id) return;
                                const p = useTournamentStore.getState().players.find(p => p.id === id);
                                if (p) {
                                  setFormData({
                                    firstName: p.firstName,
                                    lastName: p.lastName,
                                    pseudo: p.pseudo || "",
                                    email: p.email,
                                    major: p.major,
                                    level: p.level,
                                    gameId: p.gameId,
                                    avatarUrl: p.avatarUrl || "",
                                  });
                                  setRegisteredPlayerId(p.id);
                                  setIsEditing(true);
                                  setIsRegistered(true);
                                  addToast("Bon retour, " + (p.pseudo || p.firstName) + " !", "success");
                                } else {
                                  addToast("Identifiant incorrect.", "error");
                                }
                              }
                            });
                          }}
                          className="text-xs text-violet-400 hover:text-violet-300 transition-colors underline decoration-violet-500/30 underline-offset-4"
                        >
                          Déjà inscrit ? Modifier mon profil
                        </button>
                      )}
                    </div>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-8">
                    {/* 1. Registration Mode: Personal info */}
                    {!isEditing && !isRegistered && (
                      <div className="space-y-6">
                        <div className="grid gap-5 sm:grid-cols-2">
                          <div>
                            <label className={labelCls}>Prénom *</label>
                            <input
                              required
                              name="firstName"
                              value={formData.firstName}
                              onChange={handleChange}
                              placeholder="John"
                              className={inputCls}
                            />
                          </div>
                          <div>
                            <label className={labelCls}>Nom *</label>
                            <input
                              required
                              name="lastName"
                              value={formData.lastName}
                              onChange={handleChange}
                              placeholder="Doe"
                              className={inputCls}
                            />
                          </div>
                        </div>
                        <div className="grid gap-5 sm:grid-cols-2">
                          <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-zinc-800 rounded-2xl bg-zinc-900/40 hover:border-violet-500/50 transition-colors group relative overflow-hidden">
                            {formData.avatarUrl || isUploading ? (
                              <div className="relative h-24 w-24 rounded-full overflow-hidden ring-4 ring-violet-500/20">
                                {isUploading ? (
                                  <div className="absolute inset-0 bg-zinc-950/80 flex items-center justify-center">
                                    <Loader2 className="h-8 w-8 text-violet-500 animate-spin" />
                                  </div>
                                ) : (
                                  <img src={formData.avatarUrl} alt="Preview" className="h-full w-full object-cover" />
                                )}
                                <button
                                  type="button"
                                  onClick={() => fileInputRef.current?.click()}
                                  className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                                >
                                  <Camera className="h-6 w-6 text-white" />
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="flex flex-col items-center gap-3"
                              >
                                <div className="h-16 w-16 rounded-full bg-zinc-800 flex items-center justify-center group-hover:bg-violet-500/20 group-hover:text-violet-400 transition-all">
                                  <Upload className="h-6 w-6" />
                                </div>
                                <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Photo (Optionnel)</span>
                              </button>
                            )}
                            <input
                              type="file"
                              ref={fileInputRef}
                              onChange={handleImageUpload}
                              className="hidden"
                              accept="image/*"
                            />
                          </div>
                          <div className="space-y-6">
                            <div>
                              <label className={labelCls}>Adresse Mail *</label>
                              <div className="relative">
                                <input
                                  required
                                  type="email"
                                  name="email"
                                  value={formData.email}
                                  onChange={handleChange}
                                  placeholder="john@student.com"
                                  className={cn(inputCls, "pl-11")}
                                />
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-600" />
                              </div>
                            </div>
                            <div>
                              <label className={labelCls}>Pseudonyme (unique) *</label>
                              <div className="relative">
                                <input
                                  required
                                  name="pseudo"
                                  value={formData.pseudo}
                                  onChange={handleChange}
                                  placeholder="Xx_Sniper_xX"
                                  className={cn(inputCls, "pl-11")}
                                />
                                <Fingerprint className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-600" />
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="grid gap-5 sm:grid-cols-2">
                          <div>
                            <label className={labelCls}>Filière *</label>
                            <CustomSelect
                              required
                              options={majors.map(m => ({ value: m.name, label: m.name }))}
                              value={formData.major}
                              onChange={v => setFormData(prev => ({ ...prev, major: v }))}
                              placeholder="Choisir une filière..."
                            />
                          </div>
                          <div>
                            <label className={labelCls}>Niveau *</label>
                            <CustomSelect
                              required
                              options={levels.map(l => ({ value: l.name, label: l.name }))}
                              value={formData.level}
                              onChange={v => setFormData(prev => ({ ...prev, level: v }))}
                              placeholder="Choisir un niveau..."
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* 2. Edit Mode: Stats & Read-only info */}
                    {isEditing && (
                      <div className="space-y-6">
                        <div className="grid grid-cols-3 gap-4 mb-6">
                          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 text-center">
                            <p className="text-[10px] font-bold text-zinc-500 uppercase mb-1">Matchs</p>
                            <p className="text-xl font-black text-white">{stats.total}</p>
                          </div>
                          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 text-center">
                            <p className="text-[10px] font-bold text-emerald-500/60 uppercase mb-1">Gagnés</p>
                            <p className="text-xl font-black text-emerald-400">{stats.wins}</p>
                          </div>
                          <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4 text-center">
                            <p className="text-[10px] font-bold text-red-500/60 uppercase mb-1">Perdus</p>
                            <p className="text-xl font-black text-red-400">{stats.losses}</p>
                          </div>
                        </div>

                        <div className="grid gap-5 sm:grid-cols-2">
                          <div className="flex items-center justify-between p-4 rounded-xl bg-zinc-900/50 border border-zinc-800">
                            <div>
                              <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">Identifiant Unique</p>
                              <p className="font-mono text-violet-400 font-bold">{registeredPlayerId}</p>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText(registeredPlayerId || "");
                                addToast("ID copié !", "success");
                              }}
                              className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors"
                            >
                              <Copy className="h-4 w-4" />
                            </button>
                          </div>
                        </div>

                        <div className="grid gap-5 sm:grid-cols-2">
                          <div>
                            <label className={labelCls}>Joueur</label>
                            <div className={cn(inputCls, "bg-zinc-900/40 text-zinc-500")}>
                              {formData.firstName} {formData.lastName}
                            </div>
                          </div>
                          <div>
                            <label className={labelCls}>Pseudonyme</label>
                            <input
                              name="pseudo"
                              value={formData.pseudo}
                              onChange={handleChange}
                              className={inputCls}
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* 3. Common: Game Picker */}
                    <div className="space-y-5">
                      <div className="flex items-center gap-2 pb-4 border-b border-zinc-800/60">
                        <Gamepad2 className="h-5 w-5 text-violet-500" />
                        <span className="text-base font-bold text-white">Choisissez votre Jeu *</span>
                      </div>
                      <div className="grid gap-4 sm:grid-cols-2">
                        {games.map((game) => {
                          const selected = formData.gameId === game.id;
                          return (
                            <motion.label
                              key={game.id}
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              onMouseEnter={() => setHoveredGame(game)}
                              onMouseLeave={() => setHoveredGame(null)}
                              className={cn(
                                "relative flex cursor-pointer flex-col rounded-xl overflow-hidden group border-2 transition-all duration-300",
                                selected
                                  ? "border-violet-500 shadow-[0_0_24px_rgba(139,92,246,0.25)]"
                                  : "border-zinc-800/60 hover:border-zinc-600"
                              )}
                            >
                              <input
                                type="radio"
                                name="gameId"
                                value={game.id}
                                checked={selected}
                                onChange={handleChange}
                                className="sr-only"
                                required
                                disabled={!registrationsOpen}
                              />
                              <div className="relative h-28 w-full overflow-hidden">
                                <img src={game.imageUrl} alt={game.name} className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-110 opacity-75 group-hover:opacity-100" />
                                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/90 via-zinc-950/20 to-transparent" />
                                {selected && (
                                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute top-3 right-3 bg-violet-500 rounded-full p-1 shadow-lg">
                                    <CheckCircle2 className="h-4 w-4 text-white" />
                                  </motion.div>
                                )}
                              </div>
                              <div className={cn("px-4 py-3 transition-colors duration-300", selected ? "bg-violet-600/10" : "bg-zinc-900/80 group-hover:bg-zinc-800/60")}>
                                <p className="font-bold text-white text-sm">{game.name}</p>
                                <p className="text-xs text-violet-400 font-medium">{game.type}</p>
                              </div>
                            </motion.label>
                          );
                        })}
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={
                        isSubmitting ||
                        !registrationsOpen ||
                        !formData.gameId ||
                        !(formData.firstName || "").trim() ||
                        !(formData.lastName || "").trim() ||
                        !(formData.email || "").trim() ||
                        !(formData.pseudo || "").trim() ||
                        !formData.major ||
                        !formData.level
                      }
                      className="w-full h-13 py-3.5 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-black text-base shadow-lg shadow-violet-600/20 hover:shadow-violet-500/40 transition-all flex items-center justify-center gap-2"
                    >
                      {isSubmitting ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <>
                          {isEditing ? "Mettre à jour mon Inscription" : "S'inscrire au Tournoi"}
                          <ArrowRight className="h-4 w-4" />
                        </>
                      )}
                    </button>

                    {!registrationsOpen && isRegistered && (
                      <p className="text-center text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg py-2.5">
                        Les inscriptions sont fermées, vous ne pouvez plus modifier votre choix.
                      </p>
                    )}
                  </form>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </section >

      {/* ── Footer ── */}
      <div className="relative z-10 py-16 flex flex-col items-center gap-5">
        <div className="h-px w-full max-w-2xl mx-auto bg-gradient-to-r from-transparent via-zinc-800 to-transparent" />
        <div className="flex items-center gap-3 opacity-40">
          <Trophy className="h-5 w-5 text-zinc-600" />
          <span className="text-xs font-bold tracking-widest text-zinc-600 uppercase">
            NexusTourney 2026 · Built for Legends
          </span>
          <Trophy className="h-5 w-5 text-zinc-600" />
        </div>
      </div>

    </div>
  );
}
