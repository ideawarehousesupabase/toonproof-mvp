import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  Menu,
  X,
  Check,
  ChevronDown,
  ArrowRight,
  ShieldCheck,
  Dna,
  Layers,
  FileCheck2,
  Fingerprint,
  Share2,
  Coins,
  Bot,
  Activity,
  Palette,
  Eye,
  CheckCircle2,
  Building2,
  UserCheck,
  Sparkles,
} from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ToonProof — IP & Royalty Vault for Animation" },
      {
        name: "description",
        content:
          "Register, prove, control, license and monetize digital animation assets. Provenance, permissions and royalties built for animators and studios in the AI era.",
      },
      { property: "og:title", content: "ToonProof — IP & Royalty Vault for Animation" },
      {
        property: "og:description",
        content:
          "Register, prove, control, license and monetize digital animation assets. Provenance, permissions and royalties built for animators and studios in the AI era.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

const NAV = [
  { id: "home", label: "Home" },
  { id: "about", label: "About" },
  { id: "platform", label: "Platform" },
  { id: "how-it-works", label: "How It Works" },
  { id: "pricing", label: "Market Pricing" },
  { id: "faq", label: "FAQ" },
];

const DNA_SEQUENCE = [
  { title: "Animation Asset", desc: "Original 2D/3D work", badge: "Source File" },
  { title: "Fingerprint", desc: "Cryptographic & perceptual hash", badge: "Immutable ID" },
  { title: "Provenance", desc: "Timestamped creator authorship", badge: "Verified Log" },
  { title: "Permissions", desc: "Granular AI & reuse rules", badge: "Smart Policy" },
  { title: "Certificate", desc: "Exportable verifiable proof", badge: "Tamper-Evident" },
  { title: "Licensing", desc: "Commercial & derivative rights", badge: "Clearance" },
  { title: "Royalty", desc: "Usage-linked compensation tracking", badge: "Monetization" },
];

const ASSET_KINDS = [
  "Characters",
  "Rigs",
  "Expression sheets",
  "Walk cycles",
  "Animation sequences",
  "Backgrounds",
  "Style guides",
  "Other digital animation assets",
];

const NOT_PROVEN = [
  "When an asset was created",
  "Who created it",
  "What the asset contains",
  "How it can be used",
  "Whether parts of it have been reused",
  "Whether it has been used in derivative work",
  "Whether AI systems have permission to use it",
  "How usage can connect to licensing and compensation",
];

const LIFECYCLE = [
  "Creation",
  "Provenance",
  "Rights",
  "Permissions",
  "Usage",
  "Licensing",
  "Compensation",
];

const TEAM = [
  {
    role: "Founder",
    name: "Surya Sai Srujan Thota",
    points: [
      "Working 2D animator, 10 years of experience",
      "Experience across Green Gold, including Chhota Bheem",
      "Experience with ChuChu TV",
      "Experience with Byju's",
      "Master's degree in Animation",
      "Computer Science Engineering degree",
    ],
    body: "Surya provides the animation-domain expertise behind the product and acts as the bridge between animation workflows and technology.",
    tags: "Product vision · Animation-domain logic · Innovation direction",
  },
  {
    role: "CTO",
    name: "Santosh Kumar Chintakindi",
    points: [
      "UK-based principal full-stack engineer",
      "12+ years of experience",
      "Experience in fintech, healthcare and payments",
      "Experience associated with Lloyds/Scottish Widows, Conjure/NHS and Orbital",
      "UK Master's in Computer Science",
    ],
    body: "Santosh leads how ToonProof is built, from architecture through to the security of the platform.",
    tags: "Technical architecture · MVP development · Cloud · Security · Engineering",
  },
];

const ENGINES = [
  {
    no: "01",
    stage: "MVP",
    title: "Animation Asset DNA Engine",
    icon: Dna,
    body: "Multiple signals are combined into a unified Animation Asset DNA, establishing a single technical identity for an animation asset.",
    items: [
      "Exact SHA-256 cryptographic hash",
      "Perceptual visual fingerprint",
      "AI permission token",
      "Timestamped provenance record",
    ],
  },
  {
    no: "02",
    stage: "Research-led",
    title: "Rig Graph Similarity Engine",
    icon: Layers,
    body: "Structural rig information can be analysed to help identify potential structural reuse, even when the visual artwork has changed.",
    items: [
      "Bone hierarchy",
      "Controllers",
      "Deformation networks",
      "Mouth and eye controls",
      "Parent-child relationships",
      "Symmetry",
    ],
    note: "Not perfect detection.",
  },
  {
    no: "03",
    stage: "Research-led",
    title: "Motion DNA Engine",
    icon: Activity,
    body: "Animation behaviour is analysed to help identify potentially reused animation movement.",
    items: [
      "Key poses",
      "Transitions",
      "Trajectories",
      "Timing",
      "Acceleration",
      "Bounce",
      "Gestures",
      "Loop periodicity",
    ],
  },
  {
    no: "04",
    stage: "Research-led",
    title: "Style-Imitation Risk Engine",
    icon: Palette,
    body: "Visual characteristics are evaluated to produce a similarity and risk assessment intended to identify potential style imitation.",
    items: [
      "Line quality",
      "Stroke character",
      "Colour palette",
      "Shading",
      "Shape language",
      "Facial proportions",
      "Texture",
      "Composition",
    ],
    note: "This does not legally determine copyright infringement.",
  },
  {
    no: "05",
    stage: "MVP",
    title: "AI Permission & Licensing Engine",
    icon: Bot,
    body: "Creator consent can be represented through machine-readable policies. Structured permission information is designed to travel with the asset.",
    items: [
      "Commercial production",
      "Internal reuse",
      "Education",
      "Derivatives",
      "Marketplace distribution",
      "AI training",
      "Royalty-based AI output",
    ],
    note: "Not universal enforcement across every AI system.",
  },
  {
    no: "06",
    stage: "Research-led",
    title: "Provenance-to-Royalty Engine",
    icon: Coins,
    body: "Designed to connect originals, derivatives, rigs, motion assets, licensed productions, AI datasets, generated outputs and transactions.",
    items: [
      "Originals",
      "Derivatives",
      "Rigs",
      "Motion assets",
      "Licensed productions",
      "AI datasets",
      "Generated outputs",
      "Transactions",
    ],
    note: "Royalties are not guaranteed.",
  },
];

const STEPS = [
  {
    no: "01",
    icon: Fingerprint,
    title: "Upload & Classify",
    text: "Creators upload their digital animation assets and classify what they are protecting (character, rig, walk cycle, sequence).",
  },
  {
    no: "02",
    icon: ShieldCheck,
    title: "Verify & Timestamp",
    text: "The asset receives technical fingerprinting and an immutable, timestamped provenance record.",
  },
  {
    no: "03",
    icon: Bot,
    title: "Set Usage & AI Permissions",
    text: "Creators define machine-readable rules for commercial use, team sharing, and explicit AI training consent.",
  },
  {
    no: "04",
    icon: Share2,
    title: "Share With Control",
    text: "Creators can distribute assets with team members and clients while maintaining auditable logs of sharing.",
  },
  {
    no: "05",
    icon: FileCheck2,
    title: "Certify",
    text: "Generate and export verifiable PDF/JSON provenance certificates associated with the registered asset.",
  },
  {
    no: "06",
    icon: Coins,
    title: "License & Earn",
    text: "Usage and licensing connect toward a transparent pathway for creator compensation. Income is not guaranteed.",
  },
];

const AUDIENCE = [
  {
    title: "Freelance Animators",
    text: "Protect characters, animation assets, motion and creative work from unauthorized reuse.",
    tag: "Individual Creators",
  },
  {
    title: "2D Rig Artists",
    text: "Create stronger technical records around custom bone hierarchies, deformation networks, and rig reuse.",
    tag: "Technical Artists",
  },
  {
    title: "Illustrators & Concept Artists",
    text: "Establish clear provenance and style protection around original digital artwork before client handover.",
    tag: "Visual Design",
  },
  {
    title: "Small Animation Studios",
    text: "Manage team-level rights, contributor assignments, internal asset tracking and client certification.",
    tag: "Studios & Teams",
  },
  {
    title: "Students & Emerging Creators",
    text: "Build strong IP and provenance habits early to defend portfolio work and festival entries.",
    tag: "Education",
  },
  {
    title: "Studios & Production Agencies",
    text: "Support rights-cleared asset repositories and contributor audit trails for broadcast & commercial delivery.",
    tag: "Enterprise Production",
  },
  {
    title: "AI Platforms & Dataset Buyers",
    text: "Support documented creator permissions, audit trails, and licensed provenance for ethical AI use cases.",
    tag: "AI & ML Platforms",
  },
];

const PLANS = [
  {
    name: "Creator / Starter",
    price: "£12",
    unit: "/month",
    description: "Ideal for solo animators and freelance illustrators.",
    badge: null,
    features: [
      "Unlimited asset hashing & registration",
      "Standard provenance certificates",
      "AI permission token generation",
      "Direct asset sharing controls",
      "Creator dashboard access",
    ],
  },
  {
    name: "Studio",
    price: "£39",
    unit: "/month",
    description: "Built for boutique animation studios and creative teams.",
    badge: "Most Popular",
    features: [
      "Everything in Creator",
      "Team contributor management",
      "Rig-graph & sequence tagging",
      "Batch certificate export",
      "Priority verification queuing",
      "Custom studio watermarking",
    ],
  },
  {
    name: "Pro / Team",
    price: "£99",
    unit: "/month",
    description: "For high-volume production houses and game studios.",
    badge: null,
    features: [
      "Everything in Studio",
      "Multi-project pipeline vault",
      "Advanced motion DNA tracking",
      "Commercial licensing agreements",
      "Dedicated account manager",
    ],
  },
  {
    name: "Agency / Education",
    price: "£249",
    unit: "/month",
    description: "Full-scale solution for institutions, agencies and schools.",
    badge: null,
    features: [
      "Everything in Pro / Team",
      "Enterprise student/roster seats",
      "Custom API integration",
      "Institutional provenance audits",
      "Tailored SLA & onboarding",
    ],
  },
];

const PROJECTIONS: Array<[string, string, string, string]> = [
  ["Creator/Starter subscriptions", "£5,118", "£50,014", "£108,467"],
  ["Studio", "£5,629", "£61,922", "£145,268"],
  ["Pro/Team", "£6,495", "£65,494", "£154,824"],
  ["Agency/Education", "£4,901", "£49,418", "£138,941"],
  ["Provenance certificates", "£5,905", "£80,049", "£193,691"],
  ["Projected total revenue", "£28,048", "£306,897", "£741,191"],
];

const FAQ = [
  {
    q: "What exactly does ToonProof protect?",
    a: "Digital animation assets — rigs, character models, motion files, storyboards, sequences and renders. Each asset gets a unique cryptographic and perceptual fingerprint plus a provenance record showing who made it, when, and how it may be used.",
  },
  {
    q: "Is this a blockchain product?",
    a: "No. ToonProof is provenance and rights infrastructure built on verifiable cryptographic hashing and tamper-evident audit logs. You do not need crypto wallets, gas fees, or tokens to use the vault.",
  },
  {
    q: "How does it help against AI training misuse?",
    a: "Every asset carries machine-readable permissions stating whether AI training is allowed, forbidden, or royalty-backed. Combined with fingerprinting and provenance certificates, you have both an explicit declared stance and verifiable evidence of authorship if your work is scraped.",
  },
  {
    q: "Do I have to change my production pipeline?",
    a: "No. Assets are registered as you export them, and the vault sits smoothly alongside your existing tools (Toon Boom, Spine, Blender, Maya, After Effects). Studios can register in bulk; individual creators can register asset by asset.",
  },
  {
    q: "Who owns the assets I register?",
    a: "You do. 100%. ToonProof never claims rights, copyright, or ownership over registered work. The vault records and proves your ownership — it does not take a share of your IP.",
  },
  {
    q: "How do royalties and licensing work?",
    a: "Each asset can carry licence terms and royalty rules. When an asset is shared or licensed through the vault, the terms travel with it and usage is logged so payments can be reconciled accurately.",
  },
  {
    q: "Can I join the pilot programme?",
    a: "Yes! We are onboarding a selected group of animators, illustrators and studios. Create a free account or sign up below and our team will get in touch with priority onboarding.",
  },
];

const PILOT_BENEFITS = [
  "Early access to the vault and provenance certificates",
  "Direct input into permissions and licensing architecture",
  "Founding pilot pricing locked in when we launch publicly",
  "Hands-on white-glove onboarding for your pipeline",
];

function Flow({ items }: { items: string[] }) {
  return (
    <ol className="flex flex-wrap items-center gap-2 font-mono text-xs uppercase tracking-wider text-slate-500">
      {items.map((item, i) => (
        <li key={item} className="flex items-center gap-2">
          <span
            className={`rounded-md px-2.5 py-1 text-xs font-semibold transition-all ${
              i === items.length - 1
                ? "bg-indigo-600 text-white shadow-sm"
                : "bg-slate-100/90 text-slate-700 hover:bg-indigo-50 hover:text-indigo-700"
            }`}
          >
            {item}
          </span>
          {i < items.length - 1 ? (
            <span className="text-slate-300 font-bold" aria-hidden="true">
              →
            </span>
          ) : null}
        </li>
      ))}
    </ol>
  );
}

function SectionHead({
  eyebrow,
  title,
  text,
  centered = false,
}: {
  eyebrow: string;
  title: string;
  text?: string;
  centered?: boolean;
}) {
  return (
    <div className={`max-w-3xl ${centered ? "mx-auto text-center" : ""}`}>
      <span className="inline-flex items-center gap-1.5 rounded-full border border-indigo-200/80 bg-indigo-50/80 px-3 py-1 font-mono text-[0.72rem] font-semibold uppercase tracking-wider text-indigo-700 shadow-xs">
        <span className="size-1.5 rounded-full bg-indigo-600" />
        {eyebrow}
      </span>
      <h2 className="mt-3 font-display text-2xl font-bold tracking-tight text-slate-900 sm:text-4xl">
        {title}
      </h2>
      {text ? (
        <p className="mt-3.5 text-base leading-relaxed text-slate-600 sm:text-lg">{text}</p>
      ) : null}
    </div>
  );
}

function Landing() {
  const [menu, setMenu] = useState(false);
  const [open, setOpen] = useState<number | null>(0);
  const [activeStepIndex, setActiveStepIndex] = useState(0);

  return (
    <div className="landing-light min-h-screen bg-[#fafbfc] text-slate-900 antialiased selection:bg-indigo-100 selection:text-indigo-900">
      {/* BACKGROUND AMBIENT GLOW */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-gradient-to-b from-indigo-100/50 via-sky-100/30 to-transparent blur-3xl opacity-70" />
        <div className="absolute top-96 -left-32 w-96 h-96 bg-purple-100/40 rounded-full blur-3xl" />
        <div className="absolute top-[60rem] -right-32 w-96 h-96 bg-cyan-100/40 rounded-full blur-3xl" />
      </div>

      {/* STICKY HEADER */}
      <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/85 backdrop-blur-md transition-all">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-5">
          <a href="#home" className="group flex items-center gap-2.5">
            <div className="flex size-8 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-md shadow-indigo-200 transition-transform group-hover:scale-105">
              <ShieldCheck className="size-4.5" />
            </div>
            <div className="flex flex-col">
              <span className="font-display text-[1rem] font-bold tracking-tight text-slate-900">
                ToonProof
              </span>
              <span className="font-mono text-[0.6rem] uppercase tracking-wider text-slate-500">
                IP &amp; Royalty Vault
              </span>
            </div>
          </a>

          <nav className="hidden items-center gap-1 rounded-full border border-slate-200/80 bg-white/70 px-3 py-1 shadow-xs lg:flex" aria-label="Main">
            {NAV.map((item) => (
              <a
                key={item.id}
                href={`#${item.id}`}
                className="rounded-full px-3 py-1 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
              >
                {item.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2.5">
            <Link
              to="/login"
              className="inline-flex items-center justify-center rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-100 hover:text-slate-900"
            >
              Sign In
            </Link>
            <Link
              to="/signup"
              className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm shadow-indigo-200 transition-all hover:bg-indigo-700 hover:shadow-md"
            >
              Get Started
              <ArrowRight className="size-3" />
            </Link>
            <button
              onClick={() => setMenu((v) => !v)}
              aria-expanded={menu}
              aria-label="Open menu"
              className="grid size-8 place-items-center rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 lg:hidden"
            >
              {menu ? <X className="size-4" /> : <Menu className="size-4" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {menu ? (
          <div className="border-t border-slate-200 bg-white px-5 py-3 shadow-lg lg:hidden">
            <nav className="flex flex-col gap-1 py-1" aria-label="Mobile">
              {NAV.map((item) => (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  onClick={() => setMenu(false)}
                  className="rounded-md px-3 py-2 text-sm font-medium text-slate-700 hover:bg-indigo-50 hover:text-indigo-600"
                >
                  {item.label}
                </a>
              ))}
            </nav>
            <div className="mt-2 flex flex-col gap-2 border-t border-slate-100 pt-2">
              <Link
                to="/login"
                className="flex w-full items-center justify-center rounded-lg border border-slate-200 bg-white py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Sign In
              </Link>
              <Link
                to="/signup"
                className="flex w-full items-center justify-center rounded-lg bg-indigo-600 py-2 text-sm font-semibold text-white hover:bg-indigo-700 shadow-sm shadow-indigo-200"
              >
                Get Started
              </Link>
            </div>
          </div>
        ) : null}
      </header>

      <main className="relative">
        {/* HERO SECTION */}
        <section id="home" className="relative overflow-hidden pb-10 pt-1 sm:pb-14 sm:pt-2">
          <div
            className="pointer-events-none absolute inset-x-0 top-0 h-[480px] grid-backdrop opacity-70 [mask-image:radial-gradient(75%_60%_at_50%_0%,black,transparent)]"
            aria-hidden="true"
          />

          <div className="relative mx-auto grid max-w-6xl gap-12 px-5 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            {/* Left Hero Column */}
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200/90 bg-indigo-50/90 px-3.5 py-1 text-xs font-semibold text-indigo-700 shadow-xs">
                <Sparkles className="size-3.5 text-indigo-600" />
                <span>Animation IP &amp; Provenance Infrastructure</span>
              </div>

              <h1 className="mt-4 font-display text-3xl font-extrabold tracking-tight text-slate-900 sm:text-5xl sm:leading-[1.12]">
                Your animation is more than a file.{" "}
                <span className="bg-gradient-to-r from-indigo-600 via-indigo-700 to-violet-600 bg-clip-text text-transparent">
                  It&apos;s your intellectual property.
                </span>
              </h1>

              <p className="mt-5 max-w-xl text-base leading-relaxed text-slate-600 sm:text-lg">
                ToonProof IP &amp; Royalty Vault helps animators, illustrators and studios register,
                prove, control, share, license and monetize digital animation assets in the AI era.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-3.5">
                <Link
                  to="/signup"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-md shadow-indigo-200 transition-all hover:bg-indigo-700 hover:shadow-lg hover:-translate-y-0.5"
                >
                  Get Started Free
                  <ArrowRight className="size-4" />
                </Link>
                <a
                  href="#platform"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200/90 bg-white px-5 py-3 text-sm font-semibold text-slate-700 shadow-xs transition-all hover:bg-slate-50 hover:text-slate-900 hover:border-slate-300"
                >
                  Explore the Platform
                </a>
              </div>

              {/* Trust chips */}
              <div className="mt-10 grid grid-cols-2 gap-3 border-t border-slate-200/80 pt-6 sm:grid-cols-3">
                <div className="flex items-center gap-2 text-xs font-medium text-slate-600">
                  <CheckCircle2 className="size-4 text-emerald-600" />
                  <span>Tamper-Proof DNA</span>
                </div>
                <div className="flex items-center gap-2 text-xs font-medium text-slate-600">
                  <CheckCircle2 className="size-4 text-indigo-600" />
                  <span>AI Consent Tokens</span>
                </div>
                <div className="flex items-center gap-2 text-xs font-medium text-slate-600">
                  <CheckCircle2 className="size-4 text-sky-600" />
                  <span>Zero Crypto Friction</span>
                </div>
              </div>
            </div>

            {/* Right Hero Card: Live Pipeline Mockup */}
            <div className="relative rounded-2xl border border-slate-200/80 bg-white p-6 shadow-[0_8px_30px_rgb(0,0,0,0.06)] backdrop-blur-md sm:p-7">
              {/* Card Header */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-2.5">
                  <span className="relative flex size-2.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex size-2.5 rounded-full bg-emerald-500" />
                  </span>
                  <span className="font-mono text-xs font-semibold uppercase tracking-wider text-slate-700">
                    Vault Verification Pipeline
                  </span>
                </div>
                <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 font-mono text-[0.68rem] font-semibold text-emerald-700 border border-emerald-200">
                  LIVE ENGINE
                </span>
              </div>

              {/* Animated Wave SVG */}
              <div className="relative mt-4 overflow-hidden rounded-xl bg-slate-50 p-3 border border-slate-100">
                <div className="flex items-center justify-between font-mono text-[0.68rem] text-slate-500">
                  <span>asset_dna // trace</span>
                  <span className="text-indigo-600 font-semibold">24 FPS • 1080p Rig</span>
                </div>
                <svg
                  viewBox="0 0 320 70"
                  className="mt-2 w-full"
                  role="img"
                  aria-label="Motion path of an animation asset through the rights process"
                >
                  <path
                    d="M6 55 C 60 10, 110 65, 160 35 S 262 10, 314 42"
                    fill="none"
                    stroke="#4f46e5"
                    strokeWidth="2"
                    strokeDasharray="220"
                    opacity="0.9"
                    style={{ animation: "trace 3.4s ease-in-out infinite alternate" }}
                  />
                  {[
                    [6, 55],
                    [60, 25],
                    [114, 48],
                    [160, 35],
                    [214, 25],
                    [268, 18],
                    [314, 42],
                  ].map(([cx, cy], i) => (
                    <circle
                      key={i}
                      cx={cx}
                      cy={cy}
                      r="4"
                      fill="#4f46e5"
                      stroke="#ffffff"
                      strokeWidth="1.5"
                      style={{ animation: `pulse-node 2.4s ease-in-out ${i * 0.22}s infinite` }}
                    />
                  ))}
                </svg>
              </div>

              {/* Interactive DNA Sequence List */}
              <div className="mt-4 space-y-1.5">
                {DNA_SEQUENCE.map((item, i) => (
                  <div
                    key={item.title}
                    onMouseEnter={() => setActiveStepIndex(i)}
                    className={`group flex items-center justify-between rounded-lg px-3 py-2 transition-all cursor-pointer ${
                      activeStepIndex === i
                        ? "bg-indigo-50/90 border border-indigo-100 text-indigo-900 shadow-xs"
                        : "hover:bg-slate-50 border border-transparent text-slate-700"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-xs font-semibold text-slate-400 group-hover:text-indigo-600">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <div>
                        <p className="text-xs font-semibold text-slate-900">{item.title}</p>
                        <p className="text-[0.7rem] text-slate-500">{item.desc}</p>
                      </div>
                    </div>
                    <span
                      className={`rounded px-2 py-0.5 font-mono text-[0.65rem] font-medium transition-colors ${
                        activeStepIndex === i
                          ? "bg-indigo-600 text-white"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {item.badge}
                    </span>
                  </div>
                ))}
              </div>

              {/* Active Asset Badge */}
              <div className="mt-4 flex items-center justify-between rounded-lg bg-slate-900 px-3.5 py-2.5 text-white">
                <div className="flex items-center gap-2">
                  <Fingerprint className="size-4 text-indigo-400" />
                  <span className="font-mono text-[0.72rem]">SHA-256 // 7f4a...92b1</span>
                </div>
                <span className="flex items-center gap-1 font-mono text-[0.7rem] text-emerald-400">
                  <ShieldCheck className="size-3.5" />
                  Protected
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* ABOUT SECTION */}
        <section id="about" className="border-t border-slate-200/80 bg-slate-50/50 py-16 sm:py-24">
          <div className="mx-auto max-w-6xl px-5">
            <SectionHead
              eyebrow="About"
              title="Built for the people who create animation"
              text="Traditional file storage treats creative work as dumb bytes. ToonProof establishes technical authorship, permission contracts, and economic attribution."
            />

            <div className="mt-12 grid gap-6 lg:grid-cols-2">
              {/* Card 1: Asset Kinds */}
              <div className="rounded-2xl border border-slate-200/80 bg-white p-7 shadow-xs">
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100">
                    <Palette className="size-5" />
                  </div>
                  <div>
                    <h3 className="font-display text-lg font-bold text-slate-900">
                      Animation creators produce real IP
                    </h3>
                    <p className="text-xs text-slate-500">Every production leaves behind valuable assets</p>
                  </div>
                </div>

                <p className="mt-4 text-sm leading-relaxed text-slate-600">
                  From early character sketches to intricate rigs and final motion sequences, every
                  layer represents proprietary craft that deserves technical protection.
                </p>

                <div className="mt-6 flex flex-wrap gap-2">
                  {ASSET_KINDS.map((k) => (
                    <span
                      key={k}
                      className="rounded-lg border border-slate-200 bg-slate-50/80 px-3 py-1.5 font-mono text-xs font-medium text-slate-700 hover:border-indigo-200 hover:bg-indigo-50/50 hover:text-indigo-700 transition-colors"
                    >
                      {k}
                    </span>
                  ))}
                </div>
              </div>

              {/* Card 2: What legacy systems fail to prove */}
              <div className="rounded-2xl border border-slate-200/80 bg-white p-7 shadow-xs">
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-xl bg-rose-50 text-rose-600 border border-rose-100">
                    <Eye className="size-5" />
                  </div>
                  <div>
                    <h3 className="font-display text-lg font-bold text-slate-900">
                      What today&apos;s systems do not prove
                    </h3>
                    <p className="text-xs text-slate-500">Fragmented cloud drives lack IP awareness</p>
                  </div>
                </div>

                <p className="mt-4 text-sm leading-relaxed text-slate-600">
                  Existing generic cloud storage and file transfer tools fail to establish verifiable proof when disputes arise:
                </p>

                <ul className="mt-4 space-y-2.5">
                  {NOT_PROVEN.map((n) => (
                    <li key={n} className="flex items-start gap-2.5 text-xs text-slate-600">
                      <span className="mt-1 size-1.5 shrink-0 rounded-full bg-rose-500" aria-hidden="true" />
                      <span>{n}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Clear Technical Record Pipeline */}
            <div className="mt-6 rounded-2xl border border-slate-200/80 bg-white p-7 shadow-xs">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="font-display text-lg font-bold text-slate-900">
                    The ToonProof End-to-End Technical Record
                  </h3>
                  <p className="mt-1 max-w-2xl text-sm leading-relaxed text-slate-600">
                    ToonProof establishes an auditable chain of custody across the full lifecycle of an
                    animation asset.
                  </p>
                </div>
                <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 font-mono text-[0.7rem] font-semibold text-slate-600">
                  Non-blockchain • Fast • Verifiable
                </span>
              </div>

              <div className="mt-6 border-t border-slate-100 pt-6">
                <Flow items={LIFECYCLE} />
              </div>
            </div>
          </div>
        </section>

        {/* TEAM SECTION */}
        <section className="border-t border-slate-200/80 bg-white py-16 sm:py-24">
          <div className="mx-auto max-w-6xl px-5">
            <SectionHead eyebrow="Leadership" title="The people behind ToonProof" />

            <div className="mt-12 grid gap-6 lg:grid-cols-2">
              {TEAM.map((m) => (
                <div
                  key={m.name}
                  className="flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-gradient-to-b from-white to-slate-50/50 p-7 shadow-xs hover:border-indigo-200 hover:shadow-md transition-all"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="rounded-full bg-indigo-50 border border-indigo-200/70 px-3 py-1 font-mono text-xs font-semibold text-indigo-700">
                        {m.role}
                      </span>
                      <UserCheck className="size-5 text-slate-400" />
                    </div>

                    <h3 className="mt-4 font-display text-xl font-bold text-slate-900">{m.name}</h3>

                    <ul className="mt-5 space-y-2.5">
                      {m.points.map((p) => (
                        <li key={p} className="flex items-start gap-2.5 text-xs leading-relaxed text-slate-600">
                          <Check className="mt-0.5 size-4 shrink-0 text-emerald-600 font-bold" />
                          <span>{p}</span>
                        </li>
                      ))}
                    </ul>

                    <p className="mt-5 text-xs leading-relaxed text-slate-600 border-t border-slate-100 pt-4">
                      {m.body}
                    </p>
                  </div>

                  <div className="mt-6 rounded-lg bg-slate-100/80 px-3.5 py-2 font-mono text-[0.7rem] text-slate-600">
                    {m.tags}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* PLATFORM / 6 ENGINES SECTION */}
        <section id="platform" className="border-t border-slate-200/80 bg-slate-50/50 py-16 sm:py-24">
          <div className="mx-auto max-w-6xl px-5">
            <SectionHead
              eyebrow="Platform Architecture"
              title="Six intelligence engines. One rights-aware workflow."
              text="ToonProof combines 6 specialized intelligence modules into a unified vault pipeline, protecting animation assets across visual, structural, and motion dimensions."
            />

            <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {ENGINES.map((e) => {
                const IconComponent = e.icon;
                const isMVP = e.stage === "MVP";
                return (
                  <div
                    key={e.no}
                    className="group flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs hover:border-indigo-300 hover:shadow-lg transition-all"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <div className="flex size-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                          <IconComponent className="size-5" />
                        </div>
                        <span
                          className={`rounded-full px-2.5 py-0.5 font-mono text-[0.7rem] font-semibold ${
                            isMVP
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : "bg-indigo-50 text-indigo-700 border border-indigo-200"
                          }`}
                        >
                          {e.stage}
                        </span>
                      </div>

                      <div className="mt-4 flex items-baseline gap-2">
                        <span className="font-mono text-xs text-slate-400 font-bold">{e.no}</span>
                        <h3 className="font-display text-base font-bold text-slate-900">{e.title}</h3>
                      </div>

                      <p className="mt-2.5 text-xs leading-relaxed text-slate-600">{e.body}</p>

                      <div className="mt-4 flex flex-wrap gap-1.5">
                        {e.items.map((i) => (
                          <span
                            key={i}
                            className="rounded-md bg-slate-50 border border-slate-100 px-2 py-1 font-mono text-[0.68rem] text-slate-700"
                          >
                            {i}
                          </span>
                        ))}
                      </div>
                    </div>

                    {e.note ? (
                      <p className="mt-5 border-t border-slate-100 pt-3 font-mono text-[0.68rem] text-slate-400 italic">
                        * {e.note}
                      </p>
                    ) : null}
                  </div>
                );
              })}
            </div>

            {/* MVP Maturity Card */}
            <div className="mt-6 rounded-2xl border border-slate-200/80 bg-white p-6 sm:p-7 shadow-xs">
              <div className="flex items-start gap-4">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
                  <ShieldCheck className="size-5" />
                </div>
                <div>
                  <h3 className="font-display text-base font-bold text-slate-900">
                    MVP Product Maturity &amp; Roadmap
                  </h3>
                  <p className="mt-1.5 text-xs leading-relaxed text-slate-600">
                    The live MVP focuses on secure upload, asset classification, cryptographic and
                    perceptual fingerprinting, timestamped provenance records, sharing access controls,
                    certificate export, and the AI-permission layer. Advanced rig-graph, Motion DNA,
                    and style-imitation analysis are active research capabilities rolling out progressively.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* HOW IT WORKS SECTION */}
        <section id="how-it-works" className="border-t border-slate-200/80 bg-white py-16 sm:py-24">
          <div className="mx-auto max-w-6xl px-5">
            <SectionHead
              eyebrow="Step-by-step"
              title="From creation to proof, control and monetisation"
              text="A straightforward six-step pipeline that integrates with your current animation tools without disrupting your creative flow."
            />

            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {STEPS.map((s) => {
                const StepIcon = s.icon;
                return (
                  <div
                    key={s.no}
                    className="relative rounded-2xl border border-slate-200/80 bg-gradient-to-b from-slate-50/50 to-white p-6 shadow-xs hover:border-indigo-200 hover:shadow-md transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <span className="flex size-8 items-center justify-center rounded-lg bg-indigo-600 font-mono text-xs font-bold text-white shadow-xs">
                        {s.no}
                      </span>
                      <StepIcon className="size-5 text-indigo-500" />
                    </div>

                    <h3 className="mt-4 font-display text-base font-bold text-slate-900">{s.title}</h3>
                    <p className="mt-2 text-xs leading-relaxed text-slate-600">{s.text}</p>
                  </div>
                );
              })}
            </div>

            <div className="mt-10 rounded-xl border border-slate-200/80 bg-slate-50/80 p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <span className="font-mono text-xs font-semibold uppercase tracking-wider text-slate-600">
                  Lifecycle Summary:
                </span>
                <Flow items={["Create", "Protect", "Control", "Prove", "License", "Earn"]} />
              </div>
            </div>
          </div>
        </section>

        {/* AUDIENCE SECTION */}
        <section className="border-t border-slate-200/80 bg-slate-50/50 py-16 sm:py-24">
          <div className="mx-auto max-w-6xl px-5">
            <SectionHead eyebrow="Who It's For" title="Built for the entire animation ecosystem" />

            <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {AUDIENCE.map((a) => (
                <div
                  key={a.title}
                  className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs hover:border-indigo-200 hover:shadow-md transition-all"
                >
                  <span className="rounded-full bg-slate-100 px-2.5 py-0.5 font-mono text-[0.68rem] font-semibold text-slate-600">
                    {a.tag}
                  </span>
                  <h3 className="mt-3 font-display text-base font-bold text-slate-900">{a.title}</h3>
                  <p className="mt-2 text-xs leading-relaxed text-slate-600">{a.text}</p>
                </div>
              ))}
            </div>

            {/* UK Animation Ecosystem Panel */}
            <div className="mt-8 rounded-2xl border border-indigo-100 bg-gradient-to-r from-indigo-50/60 via-white to-sky-50/60 p-7 shadow-xs">
              <div className="flex items-center gap-2">
                <Building2 className="size-5 text-indigo-600" />
                <span className="font-mono text-xs font-bold uppercase tracking-wider text-indigo-700">
                  Initial Market Focus
                </span>
              </div>

              <h3 className="mt-3 font-display text-xl font-bold text-slate-900">
                The UK animation ecosystem first
              </h3>

              <p className="mt-2 max-w-3xl text-xs leading-relaxed text-slate-600 sm:text-sm">
                ToonProof&apos;s initial focus is the UK animation ecosystem. The reason for the UK
                beachhead is the founder&apos;s animation experience, direct network and studio credibility.
                Year 1 is a validation and soft-launch year focused on real pipeline pilot adoption.
              </p>

              <div className="mt-6 border-t border-indigo-100 pt-5">
                <Flow
                  items={[
                    "Animators",
                    "Illustrators",
                    "Motion Designers",
                    "Game Artists",
                    "Studios/Agencies",
                    "AI Platforms",
                  ]}
                />
              </div>
            </div>
          </div>
        </section>

        {/* PRICING SECTION */}
        <section id="pricing" className="border-t border-slate-200/80 bg-white py-16 sm:py-24">
          <div className="mx-auto max-w-6xl px-5">
            <SectionHead
              eyebrow="Market Pricing"
              title="Transparent pricing for every stage"
              text="Two initial revenue sources: recurring subscriptions across creator tiers, and usage-based provenance certificates."
            />

            {/* Pricing Cards Grid */}
            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {PLANS.map((p) => {
                const isFeatured = p.badge !== null;
                return (
                  <div
                    key={p.name}
                    className={`relative flex flex-col justify-between rounded-2xl p-6 transition-all ${
                      isFeatured
                        ? "border-2 border-indigo-600 bg-white shadow-xl ring-4 ring-indigo-50"
                        : "border border-slate-200/80 bg-white shadow-xs hover:border-slate-300 hover:shadow-md"
                    }`}
                  >
                    {p.badge ? (
                      <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-indigo-600 px-3 py-0.5 font-mono text-[0.68rem] font-bold uppercase tracking-wider text-white shadow-sm">
                        {p.badge}
                      </span>
                    ) : null}

                    <div>
                      <h3 className="font-display text-base font-bold text-slate-900">{p.name}</h3>
                      <p className="mt-1 text-xs text-slate-500">{p.description}</p>

                      <div className="mt-5 flex items-baseline">
                        <span className="font-display text-3xl font-extrabold text-slate-900">
                          {p.price}
                        </span>
                        <span className="ml-1 font-mono text-xs text-slate-500">{p.unit}</span>
                      </div>

                      <ul className="mt-6 space-y-2.5 border-t border-slate-100 pt-5">
                        {p.features.map((f) => (
                          <li key={f} className="flex items-start gap-2 text-xs text-slate-600">
                            <Check className="mt-0.5 size-3.5 shrink-0 text-emerald-600 font-bold" />
                            <span>{f}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="mt-8">
                      <Link
                        to="/signup"
                        className={`flex w-full items-center justify-center rounded-xl py-2.5 text-xs font-semibold transition-all ${
                          isFeatured
                            ? "bg-indigo-600 text-white shadow-md shadow-indigo-200 hover:bg-indigo-700"
                            : "border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 hover:text-slate-900"
                        }`}
                      >
                        Choose {p.name}
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Standalone Provenance Certificate Banner */}
            <div className="mt-6 flex flex-col gap-4 rounded-2xl border border-indigo-100 bg-indigo-50/50 p-6 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <span className="font-mono text-[0.7rem] font-bold uppercase tracking-wider text-indigo-700">
                  Usage-Based Add-on
                </span>
                <h3 className="mt-1 font-display text-lg font-bold text-slate-900">
                  Provenance Certificate Export
                </h3>
                <p className="text-xs text-slate-600">
                  Verifiable tamper-evident certificate for client handover, festivals, and legal disputes.
                </p>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-right">
                  <span className="font-display text-2xl font-extrabold text-indigo-600">£6</span>
                  <span className="ml-1 text-xs text-slate-500 font-mono">/ certificate</span>
                </div>
                <Link
                  to="/signup"
                  className="rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700"
                >
                  Request a Pilot
                </Link>
              </div>
            </div>

            {/* Financial Model Projections Table */}
            <div className="mt-10 overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs">
              <div className="border-b border-slate-100 bg-slate-50/60 p-6">
                <h3 className="font-display text-base font-bold text-slate-900">
                  Business-Plan Financial Projections
                </h3>
                <p className="mt-1 font-mono text-xs text-slate-500">
                  Model assumes go-live in Month 7 (Year 1 includes 6 months trading)
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[560px] text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-100/50 text-left font-mono uppercase tracking-wider text-slate-500">
                      <th className="px-6 py-3.5 font-semibold">Revenue Stream</th>
                      <th className="px-6 py-3.5 font-semibold">Year 1</th>
                      <th className="px-6 py-3.5 font-semibold">Year 2</th>
                      <th className="px-6 py-3.5 font-semibold">Year 3</th>
                    </tr>
                  </thead>
                  <tbody>
                    {PROJECTIONS.map((row, i) => {
                      const isTotal = i === PROJECTIONS.length - 1;
                      return (
                        <tr
                          key={row[0]}
                          className={`border-b border-slate-100 last:border-0 transition-colors ${
                            isTotal
                              ? "bg-indigo-50/70 font-bold text-indigo-950"
                              : "hover:bg-slate-50/80 text-slate-700"
                          }`}
                        >
                          <td className="px-6 py-3.5 font-medium">{row[0]}</td>
                          <td className="px-6 py-3.5 font-mono">{row[1]}</td>
                          <td className="px-6 py-3.5 font-mono">{row[2]}</td>
                          <td className="px-6 py-3.5 font-mono">{row[3]}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ SECTION */}
        <section id="faq" className="border-t border-slate-200/80 bg-slate-50/50 py-16 sm:py-24">
          <div className="mx-auto max-w-6xl px-5">
            <SectionHead
              eyebrow="FAQ"
              title="Frequently asked questions"
              text="Clear answers on provenance, rights, AI permissions, and pilot participation."
            />

            <div className="mt-12 grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
              {/* Left Side Info Card */}
              <div className="rounded-2xl border border-slate-200/80 bg-white p-7 shadow-xs h-fit">
                <span className="rounded-full bg-indigo-50 px-3 py-1 font-mono text-xs font-semibold text-indigo-700">
                  Need custom guidance?
                </span>
                <h3 className="mt-4 font-display text-lg font-bold text-slate-900">
                  Every pipeline is unique
                </h3>
                <p className="mt-2 text-xs leading-relaxed text-slate-600">
                  If you have bespoke pipeline requirements, custom engine requests, or bulk team
                  onboarding questions, our founding team is ready to assist.
                </p>

                <div className="mt-6 flex flex-wrap gap-2">
                  {["Provenance", "AI Permissions", "Rig Signatures", "Licensing", "Royalty Vault"].map((t) => (
                    <span
                      key={t}
                      className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 font-mono text-[0.7rem] text-slate-600"
                    >
                      {t}
                    </span>
                  ))}
                </div>

                <div className="mt-8 border-t border-slate-100 pt-6">
                  <Link
                    to="/signup"
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-indigo-600 transition-colors"
                  >
                    Join Pilot Group
                    <ArrowRight className="size-3.5" />
                  </Link>
                </div>
              </div>

              {/* Accordion FAQ Items */}
              <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs divide-y divide-slate-100">
                {FAQ.map((f, i) => {
                  const isOpen = open === i;
                  return (
                    <div key={f.q} className={isOpen ? "bg-indigo-50/30" : ""}>
                      <button
                        onClick={() => setOpen(isOpen ? null : i)}
                        aria-expanded={isOpen}
                        className="flex w-full items-center gap-3 px-6 py-4.5 text-left transition-colors hover:bg-slate-50"
                      >
                        <span className="font-mono text-xs font-bold text-indigo-600">
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        <span className="flex-1 text-sm font-semibold text-slate-900">{f.q}</span>
                        <ChevronDown
                          className={`size-4 shrink-0 text-slate-400 transition-transform duration-200 ${
                            isOpen ? "rotate-180 text-indigo-600" : ""
                          }`}
                        />
                      </button>
                      {isOpen ? (
                        <div className="px-6 pb-5 pl-[3.25rem] text-xs leading-relaxed text-slate-600">
                          {f.a}
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* PILOT CTA SECTION */}
        <section className="border-t border-slate-200/80 bg-white py-16 sm:py-24">
          <div className="mx-auto max-w-6xl px-5">
            <div className="relative overflow-hidden rounded-3xl border border-indigo-200/80 bg-gradient-to-br from-indigo-900 via-indigo-950 to-slate-900 p-8 sm:p-12 text-white shadow-xl">
              <div className="pointer-events-none absolute inset-0 grid-backdrop opacity-20" aria-hidden="true" />

              <div className="relative grid gap-8 lg:grid-cols-2 lg:items-center">
                <div>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-500/20 border border-indigo-400/30 px-3 py-1 font-mono text-xs font-semibold text-indigo-200">
                    <Sparkles className="size-3.5 text-indigo-300" />
                    Pilot Programme Now Open
                  </span>

                  <h2 className="mt-4 font-display text-2xl font-bold tracking-tight sm:text-4xl text-white">
                    Help shape the future of{" "}
                    <span className="bg-gradient-to-r from-indigo-300 to-sky-300 bg-clip-text text-transparent">
                      animation IP.
                    </span>
                  </h2>

                  <p className="mt-4 max-w-xl text-xs sm:text-sm leading-relaxed text-indigo-100/80">
                    We are onboarding a select group of animators, illustrators and studios to register
                    real production assets, test provenance certificates, and establish standard AI-permission tokens.
                  </p>

                  <ul className="mt-6 space-y-2.5">
                    {PILOT_BENEFITS.map((b) => (
                      <li key={b} className="flex items-center gap-2.5 text-xs text-indigo-100">
                        <Check className="size-4 shrink-0 text-emerald-400 font-bold" />
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/10 p-6 sm:p-7 backdrop-blur-md">
                  <div className="flex items-center justify-between font-mono text-xs text-indigo-200">
                    <span>vault_access // early_cohort</span>
                    <span className="text-emerald-400 font-bold">● ACTIVE</span>
                  </div>

                  <p className="mt-3 text-xs leading-relaxed text-indigo-100/90">
                    Create your creator account today to secure your founding pilot badge, upload your first
                    asset DNA, and generate provenance proof in seconds.
                  </p>

                  <div className="mt-6 flex flex-col gap-2.5 sm:flex-row">
                    <Link
                      to="/signup"
                      className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-white py-3 text-xs font-bold text-indigo-950 shadow-md hover:bg-indigo-50 transition-colors"
                    >
                      Get Started Free
                      <ArrowRight className="size-3.5" />
                    </Link>
                    <Link
                      to="/login"
                      className="flex-1 flex items-center justify-center rounded-xl border border-white/20 bg-white/5 py-3 text-xs font-semibold text-white hover:bg-white/10 transition-colors"
                    >
                      Sign In
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="border-t border-slate-200/80 bg-slate-50 py-12">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-5 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <div className="flex size-7 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-xs">
                <ShieldCheck className="size-4" />
              </div>
              <span className="font-display text-base font-bold text-slate-900">ToonProof</span>
            </div>
            <p className="mt-2.5 max-w-sm text-xs leading-relaxed text-slate-500">
              Animation-aware provenance, permissions and rights management for animators and studios in the AI era.
            </p>
          </div>

          <nav className="flex flex-wrap gap-x-6 gap-y-2 text-xs font-medium text-slate-600" aria-label="Footer">
            {NAV.map((item) => (
              <a key={item.id} href={`#${item.id}`} className="hover:text-indigo-600 transition-colors">
                {item.label}
              </a>
            ))}
          </nav>
        </div>

        <div className="mx-auto mt-8 flex max-w-6xl flex-col gap-3 px-5 pt-6 border-t border-slate-200/60 font-mono text-[0.7rem] text-slate-400 sm:flex-row sm:items-center sm:justify-between">
          <span>© {new Date().getFullYear()} ToonProof IP &amp; Royalty Vault. All rights reserved.</span>
          <div className="flex items-center gap-2 text-slate-500">
            <span className="size-1.5 rounded-full bg-emerald-500" />
            <span>Vault Security: Active • SHA-256 Verified</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
