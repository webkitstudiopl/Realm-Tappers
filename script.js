/* ==========================================================================
   REALM TAPPERS - Polished Active Gameplay, Guaranteed Inventory Sync & Auto-Save
   ========================================================================== */

function formatNum(num) {
    if (num === undefined || isNaN(num)) return "0.00";
    if (num < 1000) return num.toFixed(2);
    if (num < 1000000) return (num / 1000).toFixed(2) + "K";
    if (num < 1000000000) return (num / 1000000).toFixed(2) + "M";
    return (num / 1000000000).toFixed(2) + "B";
}

// --- WEB AUDIO SYNTHESIZER ---
class SoundFX {
    constructor() {
        this.enabled = true;
        this.ctx = null;
    }
    init() {
        if (!this.ctx) {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            if (AudioCtx) this.ctx = new AudioCtx();
        }
    }
    playTone(freq, type = 'sine', duration = 0.08, vol = 0.12, slideTo = null) {
        if (!this.enabled) return;
        this.init();
        if (!this.ctx) return;
        if (this.ctx.state === 'suspended') this.ctx.resume();

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
        if (slideTo) {
            osc.frequency.exponentialRampToValueAtTime(slideTo, this.ctx.currentTime + duration);
        }
        gain.gain.setValueAtTime(vol, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + duration);
    }
    tap(combo) {
        const base = 250 + Math.min(combo * 18, 280);
        this.playTone(base, 'triangle', 0.06, 0.12, base * 1.25);
    }
    crit() {
        this.playTone(540, 'sawtooth', 0.12, 0.14, 920);
    }
    buy() {
        this.playTone(440, 'sine', 0.08, 0.12, 660);
        setTimeout(() => this.playTone(660, 'sine', 0.1, 0.12, 880), 50);
    }
    rouletteTick(pitch = 1) {
        this.playTone(360 * pitch, 'square', 0.035, 0.07);
    }
    hatch(rarity) {
        if (['legendary', 'celestial', 'divine', 'SECRET'].includes(rarity)) {
            [523, 659, 784, 1046, 1318, 1568].forEach((f, i) => {
                setTimeout(() => this.playTone(f, 'triangle', 0.25, 0.16), i * 70);
            });
        } else {
            this.playTone(480, 'triangle', 0.16, 0.14, 760);
        }
    }
}
const sfx = new SoundFX();

// --- SVG MODELS ---
function getIslandSVG(worldId) {
    const models = [
        `<svg viewBox="0 0 200 200">
            <path d="M30 115 L170 115 L140 178 L100 190 L60 178 Z" fill="#78350f" stroke="#1a1c2c" stroke-width="6" stroke-linejoin="round"/>
            <path d="M20 108 Q100 88 180 108 Q172 132 100 132 Q28 132 20 108 Z" fill="#4ade80" stroke="#1a1c2c" stroke-width="6"/>
            <circle cx="60" cy="80" r="18" fill="#facc15" stroke="#1a1c2c" stroke-width="5"/>
            <circle cx="60" cy="80" r="8" fill="#713f12"/>
            <rect x="57" y="94" width="6" height="16" fill="#16a34a" stroke="#1a1c2c" stroke-width="3"/>
            <path d="M115 108 L125 48 L145 48 L155 108 Z" fill="#f8fafc" stroke="#1a1c2c" stroke-width="5"/>
            <path d="M135 56 L108 30 M135 56 L162 30 M135 56 L108 82 M135 56 L162 82" stroke="#ef4444" stroke-width="6" stroke-linecap="round"/>
            <circle cx="135" cy="56" r="6" fill="#1a1c2c"/>
        </svg>`,
        `<svg viewBox="0 0 200 200">
            <path d="M35 118 L165 118 L130 182 L70 182 Z" fill="#2e1065" stroke="#1a1c2c" stroke-width="6"/>
            <ellipse cx="100" cy="115" rx="75" ry="18" fill="#059669" stroke="#1a1c2c" stroke-width="6"/>
            <path d="M85 115 Q92 78 75 55 L125 55 Q108 78 115 115 Z" fill="#581c87" stroke="#1a1c2c" stroke-width="5"/>
            <circle cx="100" cy="48" r="38" fill="#a855f7" stroke="#1a1c2c" stroke-width="5"/>
            <circle cx="70" cy="58" r="22" fill="#c084fc" stroke="#1a1c2c" stroke-width="4"/>
            <circle cx="130" cy="58" r="22" fill="#c084fc" stroke="#1a1c2c" stroke-width="4"/>
            <circle cx="100" cy="44" r="8" fill="#fde047"/>
            <circle cx="48" cy="98" r="7" fill="#34d399" stroke="#1a1c2c" stroke-width="3"/>
        </svg>`,
        `<svg viewBox="0 0 200 200">
            <path d="M30 120 L170 120 L135 182 L65 182 Z" fill="#475569" stroke="#1a1c2c" stroke-width="6"/>
            <rect x="50" y="62" width="100" height="60" fill="#cbd5e1" stroke="#1a1c2c" stroke-width="5"/>
            <rect x="40" y="40" width="28" height="82" fill="#94a3b8" stroke="#1a1c2c" stroke-width="5"/>
            <rect x="132" y="40" width="28" height="82" fill="#94a3b8" stroke="#1a1c2c" stroke-width="5"/>
            <polygon points="36,40 54,16 72,40" fill="#ef4444" stroke="#1a1c2c" stroke-width="4"/>
            <polygon points="128,40 146,16 164,40" fill="#ef4444" stroke="#1a1c2c" stroke-width="4"/>
            <path d="M88 120 L88 90 A12 12 0 0 1 112 90 L112 120 Z" fill="#78350f" stroke="#1a1c2c" stroke-width="4"/>
            <polygon points="80,52 90,34 100,44 110,34 120,52" fill="#facc15" stroke="#1a1c2c" stroke-width="4"/>
        </svg>`,
        `<svg viewBox="0 0 200 200">
            <path d="M30 120 L170 120 L140 178 L60 178 Z" fill="#0f172a" stroke="#1a1c2c" stroke-width="6"/>
            <rect x="25" y="108" width="150" height="16" rx="8" fill="#00f5d4" stroke="#1a1c2c" stroke-width="5"/>
            <rect x="75" y="40" width="50" height="70" rx="14" fill="#38bdf8" fill-opacity="0.45" stroke="#1a1c2c" stroke-width="5"/>
            <circle cx="100" cy="75" r="16" fill="#00f5d4" stroke="#1a1c2c" stroke-width="4"/>
            <path d="M58 108 L48 72 L68 72 Z" fill="#fee440" stroke="#1a1c2c" stroke-width="4"/>
            <circle cx="144" cy="86" r="18" fill="#f43f5e" stroke="#1a1c2c" stroke-width="4"/>
            <path d="M100 18 L100 40" stroke="#fee440" stroke-width="6" stroke-linecap="round"/>
        </svg>`,
        `<svg viewBox="0 0 200 200">
            <circle cx="100" cy="105" r="50" fill="#2563eb" stroke="#1a1c2c" stroke-width="6"/>
            <ellipse cx="100" cy="105" rx="88" ry="22" fill="none" stroke="#facc15" stroke-width="8" transform="rotate(-18 100 105)"/>
            <ellipse cx="100" cy="105" rx="88" ry="22" fill="none" stroke="#1a1c2c" stroke-width="3" transform="rotate(-18 100 105)"/>
            <g transform="translate(138, 35) rotate(35)">
                <path d="M0 -22 C12 -8 12 12 12 22 L-12 22 C-12 12 -12 -8 0 -22 Z" fill="#f8fafc" stroke="#1a1c2c" stroke-width="4"/>
                <circle cx="0" cy="2" r="5" fill="#38bdf8"/>
                <polygon points="-12,18 -20,28 -8,22" fill="#ef4444" stroke="#1a1c2c" stroke-width="3"/>
                <polygon points="12,18 20,28 8,22" fill="#ef4444" stroke="#1a1c2c" stroke-width="3"/>
            </g>
        </svg>`,
        `<svg viewBox="0 0 200 200">
            <defs>
                <radialGradient id="bh" cx="50%" cy="50%" r="50%">
                    <stop offset="30%" stop-color="#000000"/>
                    <stop offset="70%" stop-color="#7e22ce"/>
                    <stop offset="100%" stop-color="#db2777"/>
                </radialGradient>
            </defs>
            <circle cx="100" cy="100" r="70" fill="url(#bh)" stroke="#1a1c2c" stroke-width="6"/>
            <ellipse cx="100" cy="100" rx="92" ry="25" fill="none" stroke="#00f5d4" stroke-width="6" transform="rotate(25 100 100)"/>
            <ellipse cx="100" cy="100" rx="92" ry="25" fill="none" stroke="#fde047" stroke-width="5" transform="rotate(-25 100 100)"/>
            <polygon points="100,42 128,100 100,158 72,100" fill="#ffffff" stroke="#1a1c2c" stroke-width="5"/>
            <circle cx="100" cy="100" r="12" fill="#db2777"/>
        </svg>`
    ];
    return models[worldId] || models[0];
}

function getCrateSVG(worldId) {
    const palettes = [
        { main: "#d97706", trim: "#78350f", gem: "#4ade80" },
        { main: "#6d28d9", trim: "#3b0764", gem: "#34d399" },
        { main: "#e2e8f0", trim: "#f59e0b", gem: "#ef4444" },
        { main: "#0284c7", trim: "#0f172a", gem: "#00f5d4" },
        { main: "#1e1b4b", trim: "#6366f1", gem: "#fde047" },
        { main: "#be185d", trim: "#fdf4ff", gem: "#00f5d4" }
    ];
    const p = palettes[worldId] || palettes[0];
    return `<svg viewBox="0 0 160 160">
        <rect x="22" y="40" width="116" height="100" rx="16" fill="${p.main}" stroke="#1a1c2c" stroke-width="6"/>
        <line x1="22" y1="74" x2="138" y2="74" stroke="#1a1c2c" stroke-width="5"/>
        <line x1="22" y1="108" x2="138" y2="108" stroke="#1a1c2c" stroke-width="4" stroke-dasharray="12 6"/>
        <rect x="18" y="36" width="26" height="26" rx="6" fill="${p.trim}" stroke="#1a1c2c" stroke-width="5"/>
        <rect x="116" y="36" width="26" height="26" rx="6" fill="${p.trim}" stroke="#1a1c2c" stroke-width="5"/>
        <rect x="18" y="118" width="26" height="26" rx="6" fill="${p.trim}" stroke="#1a1c2c" stroke-width="5"/>
        <rect x="116" y="118" width="26" height="26" rx="6" fill="${p.trim}" stroke="#1a1c2c" stroke-width="5"/>
        <rect x="60" y="62" width="40" height="48" rx="10" fill="${p.trim}" stroke="#1a1c2c" stroke-width="5"/>
        <polygon points="80,70 92,86 80,102 68,86" fill="${p.gem}" stroke="#1a1c2c" stroke-width="3"/>
    </svg>`;
}

function getTotemSVG(shape, primaryColor, secondaryColor, rarity) {
    const isHigh = ['legendary', 'celestial', 'divine', 'SECRET'].includes(rarity);
    const aura = isHigh ? `<circle cx="50" cy="50" r="44" fill="none" stroke="${secondaryColor}" stroke-width="3.5" stroke-dasharray="6 4"/>` : '';
    const crown = (rarity === 'divine' || rarity === 'SECRET')
        ? `<polygon points="32,14 42,4 50,12 58,4 68,14" fill="#fde047" stroke="#1a1c2c" stroke-width="3"/>`
        : '';

    const shapes = {
        pillar: `<rect x="26" y="18" width="48" height="68" rx="12" fill="${primaryColor}" stroke="#1a1c2c" stroke-width="4"/>
                 <rect x="20" y="24" width="60" height="10" rx="4" fill="${secondaryColor}" stroke="#1a1c2c" stroke-width="3"/>
                 <rect x="20" y="70" width="60" height="10" rx="4" fill="${secondaryColor}" stroke="#1a1c2c" stroke-width="3"/>`,
        owl:    `<ellipse cx="50" cy="52" rx="28" ry="32" fill="${primaryColor}" stroke="#1a1c2c" stroke-width="4"/>
                 <polygon points="26,30 35,16 44,28" fill="${secondaryColor}" stroke="#1a1c2c" stroke-width="3"/>
                 <polygon points="74,30 65,16 56,28" fill="${secondaryColor}" stroke="#1a1c2c" stroke-width="3"/>`,
        golem:  `<polygon points="28,20 72,20 80,50 70,82 30,82 20,50" fill="${primaryColor}" stroke="#1a1c2c" stroke-width="4"/>
                 <rect x="32" y="62" width="36" height="10" rx="4" fill="${secondaryColor}" stroke="#1a1c2c" stroke-width="3"/>`,
        crystal:`<polygon points="50,12 78,48 50,88 22,48" fill="${primaryColor}" stroke="#1a1c2c" stroke-width="4"/>
                 <polygon points="50,22 66,48 50,76 34,48" fill="${secondaryColor}" opacity="0.8"/>`,
        spirit: `<path d="M24 80 L24 42 A26 26 0 0 1 76 42 L76 80 L64 72 L50 80 L36 72 Z" fill="${primaryColor}" stroke="#1a1c2c" stroke-width="4"/>`,
        dragon: `<polygon points="50,14 76,38 68,82 32,82 24,38" fill="${primaryColor}" stroke="#1a1c2c" stroke-width="4"/>
                 <polygon points="24,40 10,24 22,56" fill="${secondaryColor}" stroke="#1a1c2c" stroke-width="3"/>
                 <polygon points="76,40 90,24 78,56" fill="${secondaryColor}" stroke="#1a1c2c" stroke-width="3"/>`
    };

    const body = shapes[shape] || shapes.pillar;
    const eyeColor = rarity === 'SECRET' ? '#ff007f' : '#ffffff';

    return `<svg viewBox="0 0 100 100">
        ${aura}
        ${body}
        ${crown}
        <circle cx="38" cy="44" r="6" fill="${eyeColor}" stroke="#1a1c2c" stroke-width="2.5"/>
        <circle cx="62" cy="44" r="6" fill="${eyeColor}" stroke="#1a1c2c" stroke-width="2.5"/>
        <circle cx="39" cy="43" r="2.5" fill="#1a1c2c"/>
        <circle cx="63" cy="43" r="2.5" fill="#1a1c2c"/>
        <path d="M42 56 Q50 62 58 56" fill="none" stroke="#1a1c2c" stroke-width="3" stroke-linecap="round"/>
    </svg>`;
}

// --- WORLDS ---
const WORLDS = [
    {
        id: 0,
        name: "The Fields",
        icon: "🌻",
        unlockCost: 0,
        worldMult: 1.0,
        crateName: "Wooden Meadow Crate",
        crateCost: 15.00,
        machine: {
            name: "Złoty Traktor",
            icon: "🚜",
            desc: "Zbiera plony co 15s. Gdy pasek się zapełni, kliknij ODBIERZ!",
            interval: 15,
            baseCost: 35.00,
            costScale: 2.35
        },
        totems: [
            { name: "Sprout Totem", rarity: "basic", shape: "pillar", c1: "#86efac", c2: "#16a34a", abilityType: "tap_flat", abilityVal: 0.12, abilityDesc: "+0.12 Bazowego Tapa" },
            { name: "Clover Owl", rarity: "rare", shape: "owl", c1: "#4ade80", c2: "#facc15", abilityType: "crit_chance", abilityVal: 0.04, abilityDesc: "+4% Szansy na Krytyk (x2.5)" },
            { name: "Harvest Golem", rarity: "epic", shape: "golem", c1: "#f59e0b", c2: "#78350f", abilityType: "auto_boost", abilityVal: 0.25, abilityDesc: "+25% Szybkości Auto-Clicka" },
            { name: "Sunbeam Spirit", rarity: "legendary", shape: "spirit", c1: "#fde047", c2: "#fb923c", abilityType: "machine_cd", abilityVal: 0.12, abilityDesc: "-12% Czasu ładowania Maszyn" },
            { name: "Gaia Crystal", rarity: "celestial", shape: "crystal", c1: "#34d399", c2: "#a7f3d0", abilityType: "luck", abilityVal: 0.22, abilityDesc: "+22% Szczęścia ze skrzyń" },
            { name: "Solar Sovereign", rarity: "divine", shape: "dragon", c1: "#facc15", c2: "#ef4444", abilityType: "all_mult", abilityVal: 0.30, abilityDesc: "+30% Globalnego Mnożnika" },
            { name: "OVERGROWN ANCIENT", rarity: "SECRET", shape: "golem", c1: "#14532d", c2: "#4ade80", abilityType: "combo_cap", abilityVal: 1.0, abilityDesc: "Max Combo +1.0x oraz +60% Monet!" }
        ]
    },
    {
        id: 1,
        name: "Enchanted Woods",
        icon: "🍄",
        unlockCost: 450.00,
        worldMult: 1.5,
        crateName: "Mystic Elderwood Chest",
        crateCost: 110.00,
        machine: {
            name: "Altar Runiczny",
            icon: "🔮",
            desc: "Kumuluje magiczną energię co 18s. Odbierz ją zanim wygaśnie!",
            interval: 18,
            baseCost: 300.00,
            costScale: 2.45
        },
        totems: [
            { name: "Shroomling", rarity: "basic", shape: "spirit", c1: "#c084fc", c2: "#f472b6", abilityType: "auto_boost", abilityVal: 0.18, abilityDesc: "+18% Auto-Clicka" },
            { name: "Wisp Owl", rarity: "rare", shape: "owl", c1: "#2dd4bf", c2: "#a855f7", abilityType: "luck", abilityVal: 0.10, abilityDesc: "+10% Szczęścia" },
            { name: "Bramble Guardian", rarity: "epic", shape: "golem", c1: "#10b981", c2: "#064e3b", abilityType: "auto_boost", abilityVal: 0.35, abilityDesc: "+35% Auto-Clicka" },
            { name: "Fae Prism", rarity: "legendary", shape: "crystal", c1: "#e879f9", c2: "#38bdf8", abilityType: "all_mult", abilityVal: 0.22, abilityDesc: "+22% Wszystkich Monet" },
            { name: "Moonlight Wyvern", rarity: "celestial", shape: "dragon", c1: "#818cf8", c2: "#c084fc", abilityType: "machine_cd", abilityVal: 0.16, abilityDesc: "-16% Cooldownu Maszyn" },
            { name: "Archdruid Deity", rarity: "divine", shape: "pillar", c1: "#34d399", c2: "#fde047", abilityType: "luck", abilityVal: 0.45, abilityDesc: "+45% Szczęścia" },
            { name: "CURSED FOREST GOD", rarity: "SECRET", shape: "spirit", c1: "#3b0764", c2: "#e879f9", abilityType: "all_mult", abilityVal: 0.75, abilityDesc: "Potężny mnożnik x1.75 do wszystkiego!" }
        ]
    },
    {
        id: 2,
        name: "Castle",
        icon: "🏰",
        unlockCost: 4200.00,
        worldMult: 2.25,
        crateName: "Royal Knight Vault",
        crateCost: 750.00,
        machine: {
            name: "Królewska Mennica",
            icon: "👑",
            desc: "Wybija złote monety co 20s. Kliknij ODBIERZ, by zasilić skarbiec!",
            interval: 20,
            baseCost: 2400.00,
            costScale: 2.55
        },
        totems: [
            { name: "Squire Pillar", rarity: "basic", shape: "pillar", c1: "#94a3b8", c2: "#ef4444", abilityType: "tap_flat", abilityVal: 0.85, abilityDesc: "+0.85 Bazowego Tapa" },
            { name: "Royal Falcon", rarity: "rare", shape: "owl", c1: "#f59e0b", c2: "#fef08a", abilityType: "crit_chance", abilityVal: 0.08, abilityDesc: "+8% Szansy na Krytyk" },
            { name: "Iron Bastion", rarity: "epic", shape: "golem", c1: "#475569", c2: "#38bdf8", abilityType: "all_mult", abilityVal: 0.25, abilityDesc: "+25% Globalnego Mnożnika" },
            { name: "Crown Jewel", rarity: "legendary", shape: "crystal", c1: "#ef4444", c2: "#facc15", abilityType: "luck", abilityVal: 0.28, abilityDesc: "+28% Szczęścia" },
            { name: "Paladin Drake", rarity: "celestial", shape: "dragon", c1: "#f8fafc", c2: "#f59e0b", abilityType: "auto_boost", abilityVal: 0.50, abilityDesc: "+50% Auto-Clicka" },
            { name: "Emperor's Relic", rarity: "divine", shape: "pillar", c1: "#fde047", c2: "#dc2626", abilityType: "all_mult", abilityVal: 0.55, abilityDesc: "+55% Globalnego Mnożnika" },
            { name: "PHANTOM KING", rarity: "SECRET", shape: "dragon", c1: "#0f172a", c2: "#facc15", abilityType: "combo_cap", abilityVal: 1.5, abilityDesc: "Max Combo +1.5x i +100% Monet!" }
        ]
    },
    {
        id: 3,
        name: "Laboratory",
        icon: "🧪",
        unlockCost: 38000.00,
        worldMult: 3.37,
        crateName: "Bio-Hazard Capsule",
        crateCost: 5800.00,
        machine: {
            name: "Reaktor Plazmowy",
            icon: "⚛️",
            desc: "Ładuje ogniwa plazmowe co 16s. Odbierz ładunek ręcznie!",
            interval: 16,
            baseCost: 22000.00,
            costScale: 2.65
        },
        totems: [
            { name: "Slime Vat", rarity: "basic", shape: "spirit", c1: "#22c55e", c2: "#bef264", abilityType: "auto_boost", abilityVal: 0.30, abilityDesc: "+30% Auto-Clicka" },
            { name: "Cyber Owl", rarity: "rare", shape: "owl", c1: "#06b6d4", c2: "#f43f5e", abilityType: "machine_cd", abilityVal: 0.12, abilityDesc: "-12% Czasu Maszyn" },
            { name: "Mecha Titan", rarity: "epic", shape: "golem", c1: "#3b82f6", c2: "#fde047", abilityType: "crit_chance", abilityVal: 0.11, abilityDesc: "+11% Krytyka" },
            { name: "Isotope Core", rarity: "legendary", shape: "crystal", c1: "#00f5d4", c2: "#3b82f6", abilityType: "all_mult", abilityVal: 0.38, abilityDesc: "+38% Wszystkich Monet" },
            { name: "Tesla Hydra", rarity: "celestial", shape: "dragon", c1: "#38bdf8", c2: "#fde047", abilityType: "luck", abilityVal: 0.38, abilityDesc: "+38% Szczęścia" },
            { name: "Quantum Paradox", rarity: "divine", shape: "crystal", c1: "#f43f5e", c2: "#00f5d4", abilityType: "all_mult", abilityVal: 0.75, abilityDesc: "+75% Globalnego Mnożnika" },
            { name: "SUBJECT ZERO", rarity: "SECRET", shape: "golem", c1: "#090d16", c2: "#00f5d4", abilityType: "all_mult", abilityVal: 1.50, abilityDesc: "Niestabilna moc: x2.5 do wszystkiego!" }
        ]
    },
    {
        id: 4,
        name: "Space",
        icon: "🚀",
        unlockCost: 340000.00,
        worldMult: 5.06,
        crateName: "Orbital Meteor Pod",
        crateCost: 48000.00,
        machine: {
            name: "Górnik Asteroid",
            icon: "☄️",
            desc: "Wydobywa ciemną materię co 18s. Odbierz ładunek przed odlotem!",
            interval: 18,
            baseCost: 180000.00,
            costScale: 2.75
        },
        totems: [
            { name: "Moon Rock", rarity: "basic", shape: "golem", c1: "#94a3b8", c2: "#e2e8f0", abilityType: "all_mult", abilityVal: 0.18, abilityDesc: "+18% Monet" },
            { name: "Astro Owl", rarity: "rare", shape: "owl", c1: "#6366f1", c2: "#fde047", abilityType: "luck", abilityVal: 0.20, abilityDesc: "+20% Szczęścia" },
            { name: "Nebula Wraith", rarity: "epic", shape: "spirit", c1: "#ec4899", c2: "#8b5cf6", abilityType: "crit_chance", abilityVal: 0.14, abilityDesc: "+14% Krytyka" },
            { name: "Starlight Shard", rarity: "legendary", shape: "crystal", c1: "#fde047", c2: "#38bdf8", abilityType: "auto_boost", abilityVal: 0.60, abilityDesc: "+60% Auto-Clicka" },
            { name: "Void Leviathan", rarity: "celestial", shape: "dragon", c1: "#312e81", c2: "#60a5fa", abilityType: "all_mult", abilityVal: 0.65, abilityDesc: "+65% Globalnego Mnożnika" },
            { name: "Supernova Core", rarity: "divine", shape: "crystal", c1: "#fb923c", c2: "#f43f5e", abilityType: "machine_cd", abilityVal: 0.22, abilityDesc: "-22% Czasu Maszyn i +70% Monet" },
            { name: "ECLIPSE DESTROYER", rarity: "SECRET", shape: "dragon", c1: "#000000", c2: "#6366f1", abilityType: "all_mult", abilityVal: 2.10, abilityDesc: "Kosmiczna dominacja: x3.1 Mnożnik!" }
        ]
    },
    {
        id: 5,
        name: "INTERGALAXY",
        icon: "🌌",
        unlockCost: 2800000.00,
        worldMult: 7.59,
        crateName: "Omega Singularity Chest",
        crateCost: 380000.00,
        machine: {
            name: "Zderzacz Galaktyk",
            icon: "🌀",
            desc: "Tworzy osobliwość co 14s. Odbierz energię wszechświata!",
            interval: 14,
            baseCost: 1400000.00,
            costScale: 2.85
        },
        totems: [
            { name: "Stardust Pillar", rarity: "basic", shape: "pillar", c1: "#a855f7", c2: "#00f5d4", abilityType: "all_mult", abilityVal: 0.30, abilityDesc: "+30% Monet" },
            { name: "Dimension Owl", rarity: "rare", shape: "owl", c1: "#f43f5e", c2: "#fde047", abilityType: "crit_chance", abilityVal: 0.16, abilityDesc: "+16% Krytyka" },
            { name: "Chronos Golem", rarity: "epic", shape: "golem", c1: "#06b6d4", c2: "#a855f7", abilityType: "machine_cd", abilityVal: 0.18, abilityDesc: "-18% Czasu Maszyn" },
            { name: "Infinity Prism", rarity: "legendary", shape: "crystal", c1: "#ff007f", c2: "#00f5d4", abilityType: "luck", abilityVal: 0.45, abilityDesc: "+45% Szczęścia" },
            { name: "Celestial Seraph", rarity: "celestial", shape: "spirit", c1: "#fef08a", c2: "#f472b6", abilityType: "all_mult", abilityVal: 1.00, abilityDesc: "+100% Globalnego Mnożnika" },
            { name: "GALACTIC CREATOR", rarity: "divine", shape: "dragon", c1: "#ff007f", c2: "#fde047", abilityType: "all_mult", abilityVal: 1.75, abilityDesc: "+175% Globalnego Mnożnika" },
            { name: "THE ARCHITECT", rarity: "SECRET", shape: "crystal", c1: "#090d16", c2: "#ff007f", abilityType: "all_mult", abilityVal: 3.50, abilityDesc: "ABSOLUTNY TOTEM: x4.5 Mnożnik Wszystkiego!" }
        ]
    }
];

// --- RARITIES ---
const RARITIES = {
    basic:     { label: "Basic",     weight: 63000, multBase: 1.20, css: "rarity-basic" },
    rare:      { label: "Rare",      weight: 25500, multBase: 1.65, css: "rarity-rare" },
    epic:      { label: "Epic",      weight: 9000,  multBase: 2.35, css: "rarity-epic" },
    legendary: { label: "Legendary", weight: 2200,  multBase: 3.80, css: "rarity-legendary" },
    celestial: { label: "Celestial", weight: 280,   multBase: 7.50, css: "rarity-celestial" },
    divine:    { label: "Divine",    weight: 18,    multBase: 18.0, css: "rarity-divine" },
    SECRET:    { label: "SECRET",    weight: 2,     multBase: 50.0, css: "rarity-SECRET" }
};

// --- SKILL TREE ---
const SKILL_TREE_TIERS = [
    {
        tierId: 0,
        title: "Gałąź I: Podstawy Łąki (The Fields)",
        reqWorld: 0,
        nodes: [
            { id: "tap_1", icon: "👆", name: "Precyzyjny Dotyk", desc: "+0.08 Bazowej mocy kliknięcia na poziom", maxLvl: 25, baseCost: 8.00, scale: 1.48 },
            { id: "auto_1", icon: "🤖", name: "Mini Auto-Tapper", desc: "+0.35 Automatycznego kliku na sekundę", maxLvl: 15, baseCost: 35.00, scale: 1.58 },
            { id: "luck_1", icon: "🍀", name: "Czterolistna Koniczyna", desc: "+4% Szczęścia przy losowaniu skrzyń", maxLvl: 12, baseCost: 90.00, scale: 1.70 }
        ]
    },
    {
        tierId: 1,
        title: "Gałąź II: Magia Lasu (Enchanted Woods)",
        reqWorld: 1,
        nodes: [
            { id: "mult_1", icon: "✨", name: "Runiczne Wzmocnienie", desc: "+14% Globalnego mnożnika monet", maxLvl: 15, baseCost: 420.00, scale: 1.62 },
            { id: "crit_1", icon: "💥", name: "Krytyczne Uderzenie", desc: "+2.5% Szansy na krytyk (x2.5)", maxLvl: 12, baseCost: 750.00, scale: 1.72 },
            { id: "triple_hatch", icon: "📦", name: "Potrójne Losowanie", desc: "Odblokowuje przycisk OTWÓRZ x3 w skrzyniach!", maxLvl: 1, baseCost: 1800.00, scale: 1 }
        ]
    },
    {
        tierId: 2,
        title: "Gałąź III: Królewski Skarbiec (Castle)",
        reqWorld: 2,
        nodes: [
            { id: "tap_2", icon: "⚔️", name: "Rycerski Cios", desc: "+22% Mocy kliknięcia na poziom", maxLvl: 15, baseCost: 4800.00, scale: 1.70 },
            { id: "combo_1", icon: "🔥", name: "Królewska Seria", desc: "Zwiększa maksymalny mnożnik Combo o +0.35x", maxLvl: 8, baseCost: 7200.00, scale: 1.85 },
            { id: "auto_collect", icon: "🧲", name: "Magnes Maszyn", desc: "Maszyny automatycznie zbierają nagrody po naładowaniu!", maxLvl: 1, baseCost: 15000.00, scale: 1 }
        ]
    },
    {
        tierId: 3,
        title: "Gałąź IV: Technologia (Laboratory)",
        reqWorld: 3,
        nodes: [
            { id: "mult_2", icon: "🧬", name: "Mutacja Złota", desc: "+28% Globalnego mnożnika monet", maxLvl: 15, baseCost: 45000.00, scale: 1.78 },
            { id: "luck_2", icon: "🧪", name: "Eliksir Szczęścia", desc: "+10% Szczęścia do rzadkich totemów", maxLvl: 12, baseCost: 68000.00, scale: 1.85 }
        ]
    },
    {
        tierId: 4,
        title: "Gałąź V: Kosmiczna Moc (Space)",
        reqWorld: 4,
        nodes: [
            { id: "crit_dmg", icon: "☄️", name: "Uderzenie Meteorytu", desc: "Zwiększa mnożnik Krytyka aż do x5.5!", maxLvl: 8, baseCost: 380000.00, scale: 1.95 },
            { id: "mult_3", icon: "🛸", name: "Ciemna Energia", desc: "+40% Globalnego mnożnika monet", maxLvl: 15, baseCost: 550000.00, scale: 1.90 }
        ]
    },
    {
        tierId: 5,
        title: "Gałąź VI: Boskość (INTERGALAXY)",
        reqWorld: 5,
        nodes: [
            { id: "omega_core", icon: "🌌", name: "Rdzeń Wszechświata", desc: "Mnoży całą produkcję x1.25 na każdy poziom!", maxLvl: 10, baseCost: 3200000.00, scale: 2.15 }
        ]
    }
];

// --- GAME STATE ---
let state = {
    coins: 0,
    totalCoinsEarned: 0,
    totalTaps: 0,
    currentWorld: 0,
    unlockedWorlds: [0],
    skills: {},
    machineLevels: [1, 1, 1, 1, 1, 1],
    machineTimers: [0, 0, 0, 0, 0, 0],
    machineReady: [false, false, false, false, false, false],
    totems: [],
    equippedUids: [],
    combo: 0,
    isHatching: false
};

let rouletteTimeout = null;
let shakeTimer = null;
let tickSoundLoop = null;
let pendingHatchedList = [];

function loadGame() {
    try {
        const saved = localStorage.getItem("realmTappersSave_v4");
        if (saved) {
            const parsed = JSON.parse(saved);
            state = { ...state, ...parsed };
            state.isHatching = false;
            if (!Array.isArray(state.equippedUids)) state.equippedUids = [];
            state.equippedUids = state.equippedUids.slice(0, 2);
            if (!Array.isArray(state.machineReady)) state.machineReady = [false, false, false, false, false, false];
            if (!Array.isArray(state.totems)) state.totems = [];
            state.totems = state.totems.filter(Boolean).map((t, idx) => ({
                ...t,
                uid: t.uid || ("totem_" + Date.now() + "_" + idx + "_" + Math.random().toString(36).slice(2, 7)),
                mult: Number(t.mult) || 1.2
            }));
        }
    } catch (e) {
        console.warn("Save load failed:", e);
    }
}

function saveGame() {
    try {
        localStorage.setItem("realmTappersSave_v4", JSON.stringify(state));
    } catch (e) {
        console.warn("Save failed:", e);
    }
}

function showToast(msg) {
    const container = document.getElementById("toast-container");
    const el = document.createElement("div");
    el.className = "toast";
    el.textContent = msg;
    container.appendChild(el);
    setTimeout(() => {
        el.style.opacity = "0";
        el.style.transition = "opacity 0.25s";
        setTimeout(() => el.remove(), 250);
    }, 2200);
}

// --- STATS ---
function getSkillLvl(id) {
    return state.skills[id] || 0;
}

function getEquippedTotems() {
    return state.equippedUids
        .map(uid => state.totems.find(t => t.uid === uid))
        .filter(Boolean)
        .slice(0, 2);
}

function getStats() {
    const world = WORLDS[state.currentWorld];
    const eq = getEquippedTotems();

    let baseTap = 0.15 + getSkillLvl("tap_1") * 0.08;
    eq.forEach(t => {
        if (t.abilityType === "tap_flat") baseTap += t.abilityVal;
    });
    baseTap *= (1 + getSkillLvl("tap_2") * 0.22);

    let totemMult = 1.0;
    eq.forEach(t => {
        totemMult *= t.mult;
    });

    let globalBonus = 1.0
        + getSkillLvl("mult_1") * 0.14
        + getSkillLvl("mult_2") * 0.28
        + getSkillLvl("mult_3") * 0.40;

    eq.forEach(t => {
        if (t.abilityType === "all_mult") globalBonus += t.abilityVal;
    });

    const omegaMult = Math.pow(1.25, getSkillLvl("omega_core"));
    const worldMult = world.worldMult;

    let maxComboMult = 1.65 + getSkillLvl("combo_1") * 0.35;
    eq.forEach(t => {
        if (t.abilityType === "combo_cap") maxComboMult += t.abilityVal;
    });
    const currentComboMult = 1 + (state.combo / 100) * (maxComboMult - 1);

    const totalMultiplier = totemMult * globalBonus * omegaMult * worldMult;
    const tapPower = baseTap * totalMultiplier * currentComboMult;

    let autoTaps = getSkillLvl("auto_1") * 0.35;
    let autoSpeedMult = 1.0;
    eq.forEach(t => {
        if (t.abilityType === "auto_boost") autoSpeedMult += t.abilityVal;
    });
    const dps = autoTaps * autoSpeedMult * (baseTap * totalMultiplier);

    let critChance = 0.03 + getSkillLvl("crit_1") * 0.025;
    eq.forEach(t => {
        if (t.abilityType === "crit_chance") critChance += t.abilityVal;
    });
    critChance = Math.min(critChance, 0.65);
    const critMult = 2.5 + getSkillLvl("crit_dmg") * 0.375;

    let luck = 1.0 + getSkillLvl("luck_1") * 0.04 + getSkillLvl("luck_2") * 0.10;
    eq.forEach(t => {
        if (t.abilityType === "luck") luck += t.abilityVal;
    });

    let cdReduction = 0;
    eq.forEach(t => {
        if (t.abilityType === "machine_cd") cdReduction += t.abilityVal;
    });
    cdReduction = Math.min(cdReduction, 0.50);

    return {
        tapPower,
        baseTapWithMult: baseTap * totalMultiplier,
        dps,
        critChance,
        critMult,
        luck,
        currentComboMult,
        cdReduction
    };
}

// --- TAP ACTION ---
function handleTap(clientX, clientY) {
    const stats = getStats();
    state.totalTaps++;
    state.combo = Math.min(100, state.combo + 5.5);

    const isCrit = Math.random() < stats.critChance;
    const earned = stats.tapPower * (isCrit ? stats.critMult : 1);

    state.coins += earned;
    state.totalCoinsEarned += earned;

    if (isCrit) sfx.crit();
    else sfx.tap(state.combo / 10);

    const btn = document.getElementById("main-tapper");
    btn.classList.remove("tapped");
    void btn.offsetWidth;
    btn.classList.add("tapped");
    setTimeout(() => btn.classList.remove("tapped"), 75);

    spawnFloatingNumber(earned, isCrit, clientX, clientY);
    updateHUD();
}

function spawnFloatingNumber(amount, isCrit, x, y) {
    const el = document.createElement("div");
    el.className = "float-num" + (isCrit ? " crit" : "");
    el.textContent = (isCrit ? "💥 +" : "+") + formatNum(amount);

    if (!x || !y) {
        const rect = document.getElementById("main-tapper").getBoundingClientRect();
        x = rect.left + rect.width / 2 + (Math.random() * 60 - 30);
        y = rect.top + rect.height / 2 + (Math.random() * 40 - 20);
    } else {
        x += (Math.random() * 26 - 13);
        y -= 14;
    }

    el.style.left = x + "px";
    el.style.top = y + "px";
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 850);
}

// --- CRATES & GACHA (FIXED INVENTORY SYNC) ---
function rollTotemFromWorld(worldId) {
    const world = WORLDS[worldId];
    const stats = getStats();

    const entries = Object.entries(RARITIES).map(([key, cfg]) => {
        let w = cfg.weight;
        if (key !== "basic") {
            w = w * Math.pow(stats.luck, key === "SECRET" || key === "divine" ? 0.6 : 1.0);
        }
        return { key, w };
    });

    const totalWeight = entries.reduce((acc, e) => acc + e.w, 0);
    let rand = Math.random() * totalWeight;
    let chosenRarity = "basic";

    for (const entry of entries) {
        if (rand < entry.w) {
            chosenRarity = entry.key;
            break;
        }
        rand -= entry.w;
    }

    const template = world.totems.find(t => t.rarity === chosenRarity) || world.totems[0];
    const worldPowerScale = Math.pow(1.25, worldId);
    const finalMult = +(RARITIES[chosenRarity].multBase * worldPowerScale).toFixed(2);

    return {
        uid: "totem_" + Date.now() + "_" + Math.random().toString(36).slice(2, 9),
        worldId,
        name: template.name,
        rarity: chosenRarity,
        mult: finalMult,
        shape: template.shape,
        c1: template.c1,
        c2: template.c2,
        abilityType: template.abilityType,
        abilityVal: template.abilityVal,
        abilityDesc: template.abilityDesc
    };
}

function openCrates(count) {
    if (state.isHatching) return;
    const world = WORLDS[state.currentWorld];
    const totalCost = +(world.crateCost * count).toFixed(2);

    if (state.coins < totalCost) {
        showToast("❌ Za mało monet na tę skrzynię!");
        return;
    }

    state.coins -= totalCost;
    state.isHatching = true;

    // CRITICAL FIX: Generate items immediately so they are 100% saved in state.totems
    pendingHatchedList = [];
    for (let i = 0; i < count; i++) {
        const totem = rollTotemFromWorld(state.currentWorld);
        state.totems.push(totem);
        pendingHatchedList.push(totem);
    }
    saveGame();
    updateHUD();

    const modal = document.getElementById("hatch-modal");
    const titleBanner = document.getElementById("hatch-title-banner");
    const crateAnim = document.getElementById("hatch-crate-anim");
    const rouletteWrap = document.getElementById("roulette-wrapper");
    const resultsBox = document.getElementById("hatch-results");
    const closeBtn = document.getElementById("btn-close-hatch");
    const skipBtn = document.getElementById("btn-skip-anim");

    modal.classList.remove("hidden");
    titleBanner.textContent = "🔨 ROZBIJANIE SKRZYNI...";
    crateAnim.classList.remove("hidden");
    rouletteWrap.classList.add("hidden");
    resultsBox.classList.add("hidden");
    closeBtn.classList.add("hidden");
    skipBtn.classList.remove("hidden");
    crateAnim.innerHTML = getCrateSVG(state.currentWorld);

    renderAll();

    let shakeCount = 0;
    if (shakeTimer) clearInterval(shakeTimer);
    shakeTimer = setInterval(() => {
        if (!state.isHatching) { clearInterval(shakeTimer); return; }
        sfx.rouletteTick(1 + shakeCount * 0.12);
        shakeCount++;
        if (shakeCount >= 5) {
            clearInterval(shakeTimer);
            shakeTimer = null;
            startRoulettePhase();
        }
    }, 160);
}

function startRoulettePhase() {
    if (!state.isHatching) return;
    const crateAnim = document.getElementById("hatch-crate-anim");
    const rouletteWrap = document.getElementById("roulette-wrapper");
    const track = document.getElementById("roulette-track");
    const titleBanner = document.getElementById("hatch-title-banner");

    crateAnim.classList.add("hidden");
    rouletteWrap.classList.remove("hidden");
    titleBanner.textContent = "🎰 LOSOWANIE TOTEMU...";

    const order = ["basic", "rare", "epic", "legendary", "celestial", "divine", "SECRET"];
    const sortedWinners = [...pendingHatchedList].sort((a, b) => order.indexOf(b.rarity) - order.indexOf(a.rarity));
    const mainWinner = sortedWinners[0];

    const winnerIdx = 26;
    const totalSlots = 32;
    track.innerHTML = "";
    track.style.transition = "none";
    track.style.transform = "translateX(0px)";

    for (let i = 0; i < totalSlots; i++) {
        const item = (i === winnerIdx) ? mainWinner : rollTotemFromWorld(state.currentWorld);
        const rCfg = RARITIES[item.rarity];
        const slot = document.createElement("div");
        slot.className = `roulette-slot ${i === winnerIdx ? "winner-slot" : ""}`;
        slot.innerHTML = `
            <span class="totem-rarity-badge ${rCfg.css}" style="font-size:0.6rem;">${rCfg.label}</span>
            <div style="width:62px;height:62px;">${getTotemSVG(item.shape, item.c1, item.c2, item.rarity)}</div>
            <div style="font-family:var(--font-display);font-size:0.74rem;line-height:1.1;">${item.name}</div>
        `;
        track.appendChild(slot);
    }

    const slotWidth = 130;
    const targetOffset = (winnerIdx * slotWidth) + 60;

    requestAnimationFrame(() => {
        track.style.transition = "transform 2.4s cubic-bezier(0.12, 0.85, 0.22, 1)";
        track.style.transform = `translateX(-${targetOffset}px)`;
    });

    let tickSteps = 0;
    if (tickSoundLoop) clearInterval(tickSoundLoop);
    tickSoundLoop = setInterval(() => {
        if (!state.isHatching || tickSteps > 16) { clearInterval(tickSoundLoop); return; }
        sfx.rouletteTick(0.9 + (tickSteps % 3) * 0.15);
        tickSteps++;
    }, 130);

    rouletteTimeout = setTimeout(() => {
        finishHatchReveal();
    }, 2500);
}

function finishHatchReveal() {
    if (shakeTimer) { clearInterval(shakeTimer); shakeTimer = null; }
    if (tickSoundLoop) { clearInterval(tickSoundLoop); tickSoundLoop = null; }
    if (rouletteTimeout) { clearTimeout(rouletteTimeout); rouletteTimeout = null; }

    const flash = document.getElementById("screen-flash");
    flash.classList.add("active");
    setTimeout(() => flash.classList.remove("active"), 250);

    const titleBanner = document.getElementById("hatch-title-banner");
    const crateAnim = document.getElementById("hatch-crate-anim");
    const rouletteWrap = document.getElementById("roulette-wrapper");
    const resultsBox = document.getElementById("hatch-results");
    const closeBtn = document.getElementById("btn-close-hatch");
    const skipBtn = document.getElementById("btn-skip-anim");

    crateAnim.classList.add("hidden");
    rouletteWrap.classList.add("hidden");
    skipBtn.classList.add("hidden");
    resultsBox.innerHTML = "";
    resultsBox.classList.remove("hidden");
    closeBtn.classList.remove("hidden");

    const order = ["basic", "rare", "epic", "legendary", "celestial", "divine", "SECRET"];
    pendingHatchedList.sort((a, b) => order.indexOf(b.rarity) - order.indexOf(a.rarity));
    const best = pendingHatchedList[0];

    titleBanner.textContent = best.rarity === "SECRET"
        ? "🚨 NIEMOŻLIWE! WYLOSOWAŁEŚ SECRET! 🚨"
        : `🎉 ZDOBYTO: ${RARITIES[best.rarity].label.toUpperCase()}!`;

    sfx.hatch(best.rarity);
    spawnConfetti();

    pendingHatchedList.forEach(t => {
        const rCfg = RARITIES[t.rarity];
        const card = document.createElement("div");
        card.className = "hatched-item-card";
        card.innerHTML = `
            <span class="totem-rarity-badge ${rCfg.css}">${rCfg.label}</span>
            <div class="totem-svg-box" style="margin: 8px auto;">${getTotemSVG(t.shape, t.c1, t.c2, t.rarity)}</div>
            <h3 class="totem-name">${t.name}</h3>
            <div class="totem-stats">x${formatNum(t.mult)} Mnożnik</div>
            <div class="totem-ability">${t.abilityDesc}</div>
        `;
        resultsBox.appendChild(card);
    });

    document.getElementById("nav-totem-badge").classList.remove("hidden");
    renderAll();
}

function spawnConfetti() {
    const container = document.getElementById("confetti-container");
    container.innerHTML = "";
    const colors = ["#ffbe0b", "#ff006e", "#3a86ff", "#06d6a0", "#a855f7"];
    for (let i = 0; i < 45; i++) {
        const p = document.createElement("div");
        p.className = "confetti-piece";
        p.style.left = Math.random() * 100 + "vw";
        p.style.backgroundColor = colors[i % colors.length];
        p.style.animationDuration = (1.4 + Math.random() * 1.4) + "s";
        p.style.animationDelay = (Math.random() * 0.3) + "s";
        container.appendChild(p);
    }
}

// --- TOTEM INVENTORY ---
function toggleEquipTotem(uid) {
    const idx = state.equippedUids.indexOf(uid);
    if (idx !== -1) {
        state.equippedUids.splice(idx, 1);
        sfx.playTone(300, 'sine', 0.08);
    } else {
        if (state.equippedUids.length >= 2) {
            showToast("⚠️ Możesz założyć maksymalnie 2 totemy!");
            return;
        }
        state.equippedUids.push(uid);
        sfx.buy();
    }
    saveGame();
    renderAll();
}

function equipBestTotems() {
    if (state.totems.length === 0) return;
    const sorted = [...state.totems].sort((a, b) => b.mult - a.mult);
    state.equippedUids = sorted.slice(0, 2).map(t => t.uid);
    sfx.buy();
    showToast("⭐ Założono 2 najsilniejsze totemy!");
    saveGame();
    renderAll();
}

function salvageWeakTotems() {
    const toKeep = [];
    let salvagedCount = 0;
    let refund = 0;

    state.totems.forEach(t => {
        if (state.equippedUids.includes(t.uid) || ['legendary', 'celestial', 'divine', 'SECRET'].includes(t.rarity)) {
            toKeep.push(t);
        } else {
            salvagedCount++;
            refund += +(WORLDS[t.worldId].crateCost * 0.25).toFixed(2);
        }
    });

    if (salvagedCount === 0) {
        showToast("Brak niezałożonych słabych totemów do przetopienia.");
        return;
    }

    state.totems = toKeep;
    state.coins += refund;
    state.totalCoinsEarned += refund;
    sfx.buy();
    showToast(`♻️ Przetopiono ${salvagedCount} totemów za +${formatNum(refund)} 🪙!`);
    saveGame();
    renderAll();
}

function deleteSingleTotem(uid) {
    if (state.equippedUids.includes(uid)) {
        showToast("⚠️ Najpierw zdejmij ten totem!");
        return;
    }
    const idx = state.totems.findIndex(t => t.uid === uid);
    if (idx !== -1) {
        const t = state.totems[idx];
        const refund = +(WORLDS[t.worldId].crateCost * 0.25).toFixed(2);
        state.totems.splice(idx, 1);
        state.coins += refund;
        sfx.playTone(250, 'sawtooth', 0.08);
        showToast(`♻️ Przetopiono ${t.name} (+${formatNum(refund)} 🪙)`);
        saveGame();
        renderAll();
    }
}

// --- SKILL TREE ---
function buySkillNode(nodeId, tierReqWorld) {
    if (!state.unlockedWorlds.includes(tierReqWorld)) {
        showToast("🔒 Odblokuj najpierw wymagany świat!");
        return;
    }
    let foundNode = null;
    for (const tier of SKILL_TREE_TIERS) {
        const n = tier.nodes.find(x => x.id === nodeId);
        if (n) { foundNode = n; break; }
    }
    if (!foundNode) return;

    const curLvl = getSkillLvl(nodeId);
    if (curLvl >= foundNode.maxLvl) return;

    const cost = +(foundNode.baseCost * Math.pow(foundNode.scale, curLvl)).toFixed(2);
    if (state.coins < cost) {
        showToast("❌ Za mało monet!");
        return;
    }

    state.coins -= cost;
    state.skills[nodeId] = curLvl + 1;
    sfx.buy();
    showToast(`🌳 Ulepszono: ${foundNode.name} (Lv.${curLvl + 1})`);
    saveGame();
    renderAll();
}

// --- WORLDS & MACHINES ---
function unlockOrTravelWorld(worldId) {
    const world = WORLDS[worldId];
    if (state.unlockedWorlds.includes(worldId)) {
        state.currentWorld = worldId;
        applyWorldTheme();
        sfx.buy();
        showToast(`🏝️ Podróż do: ${world.name}!`);
        saveGame();
        renderAll();
        return;
    }

    if (worldId > 0 && !state.unlockedWorlds.includes(worldId - 1)) {
        showToast("🔒 Najpierw odblokuj poprzednią wyspę!");
        return;
    }

    if (state.coins < world.unlockCost) {
        showToast(`❌ Potrzebujesz ${formatNum(world.unlockCost)} 🪙 aby otworzyć bramę!`);
        return;
    }

    state.coins -= world.unlockCost;
    state.unlockedWorlds.push(worldId);
    state.currentWorld = worldId;
    applyWorldTheme();
    sfx.hatch("celestial");
    showToast(`🔓 ODBLOKOWANO NOWY ŚWIAT: ${world.name}!`);
    saveGame();
    renderAll();
}

function collectMachineReward(wId) {
    if (!state.machineReady[wId]) return;
    const stats = getStats();
    const mLvl = state.machineLevels[wId];
    const baseRewardMult = [14, 22, 34, 50, 75, 115][wId];
    const reward = stats.baseTapWithMult * baseRewardMult * (1 + (mLvl - 1) * 0.35);

    state.coins += reward;
    state.totalCoinsEarned += reward;
    state.machineReady[wId] = false;
    state.machineTimers[wId] = 0;

    sfx.buy();
    showToast(`⚙️ Odebrano z maszyny: +${formatNum(reward)} 🪙!`);
    spawnFloatingNumber(reward, true);
    saveGame();
    renderArena();
    updateHUD();
}

function upgradeCurrentMachine() {
    const wId = state.currentWorld;
    const m = WORLDS[wId].machine;
    const lvl = state.machineLevels[wId];
    const cost = +(m.baseCost * Math.pow(m.costScale, lvl - 1)).toFixed(2);

    if (state.coins < cost) {
        showToast("❌ Za mało monet na ulepszenie maszyny!");
        return;
    }

    state.coins -= cost;
    state.machineLevels[wId] = lvl + 1;
    sfx.buy();
    showToast(`⚙️ ${m.name} osiągnął poziom ${lvl + 1}!`);
    saveGame();
    renderAll();
}

function applyWorldTheme() {
    document.body.className = `world-${state.currentWorld}`;
}

// --- RENDERING ---
function updateHUD() {
    const stats = getStats();
    const world = WORLDS[state.currentWorld];

    document.getElementById("coins-display").textContent = formatNum(state.coins);
    document.getElementById("tap-power-display").textContent = formatNum(stats.tapPower);
    document.getElementById("dps-display").textContent = formatNum(stats.dps);

    document.getElementById("world-icon").textContent = world.icon;
    document.getElementById("world-name").textContent = world.name;
    document.querySelector(".world-subtitle").textContent = `KRAINA ${world.id + 1} / ${WORLDS.length}`;
    document.getElementById("world-mult-badge").textContent = `x${formatNum(world.worldMult)}`;

    document.getElementById("combo-mult").textContent = `x${stats.currentComboMult.toFixed(2)}`;
    document.getElementById("combo-fill").style.width = `${state.combo}%`;
}

function renderArena() {
    const wId = state.currentWorld;
    const world = WORLDS[wId];
    document.getElementById("tapper-visual").innerHTML = getIslandSVG(wId);

    const eq = getEquippedTotems();
    for (let i = 0; i < 2; i++) {
        const slotEl = document.getElementById(`orbit-slot-${i}`);
        const t = eq[i];
        if (t) {
            slotEl.innerHTML = `
                <div style="width:46px;height:46px;flex-shrink:0;">${getTotemSVG(t.shape, t.c1, t.c2, t.rarity)}</div>
                <div style="text-align:left;line-height:1.15;">
                    <div style="font-family:var(--font-display);font-size:0.84rem;">${t.name}</div>
                    <div style="font-size:0.74rem;font-weight:900;color:#16a34a;">x${formatNum(t.mult)}</div>
                </div>
            `;
        } else {
            slotEl.innerHTML = `<div class="slot-empty">Pusty Slot Totemu ${i + 1}</div>`;
        }
    }

    const m = world.machine;
    const lvl = state.machineLevels[wId];
    const cost = +(m.baseCost * Math.pow(m.costScale, lvl - 1)).toFixed(2);
    const isReady = state.machineReady[wId];

    document.getElementById("machine-icon").textContent = m.icon;
    document.getElementById("machine-name").textContent = m.name;
    document.getElementById("machine-desc").textContent = m.desc;
    document.getElementById("machine-lvl").textContent = `Lv.${lvl}`;
    document.getElementById("machine-cost").textContent = `${formatNum(cost)} 🪙`;

    const readyPill = document.getElementById("machine-ready-pill");
    const collectBtn = document.getElementById("btn-collect-machine");
    const bar = document.getElementById("machine-progress-bar");

    if (isReady) {
        readyPill.classList.remove("hidden");
        collectBtn.classList.remove("hidden");
        bar.classList.add("full-ready");
    } else {
        readyPill.classList.add("hidden");
        collectBtn.classList.add("hidden");
        bar.classList.remove("full-ready");
    }
}

function renderCrates() {
    const wId = state.currentWorld;
    const world = WORLDS[wId];
    const stats = getStats();

    document.getElementById("crate-visual").innerHTML = getCrateSVG(wId);
    document.getElementById("crate-name").textContent = world.crateName;
    document.getElementById("crate-cost").textContent = formatNum(world.crateCost);
    document.getElementById("open-1-cost").textContent = `${formatNum(world.crateCost)} 🪙`;
    document.getElementById("open-3-cost").textContent = `${formatNum(world.crateCost * 3)} 🪙`;
    document.getElementById("luck-stat").textContent = `${stats.luck.toFixed(2)}x`;

    const hasTriple = getSkillLvl("triple_hatch") > 0;
    const btn3 = document.getElementById("btn-open-3");
    btn3.disabled = !hasTriple;
    btn3.innerHTML = hasTriple
        ? `OTWÓRZ x3<br><small>${formatNum(world.crateCost * 3)} 🪙</small>`
        : `OTWÓRZ x3 (Wymaga Drzewa)<br><small>${formatNum(world.crateCost * 3)} 🪙</small>`;

    const entries = Object.entries(RARITIES).map(([key, cfg]) => {
        let w = cfg.weight;
        if (key !== "basic") {
            w = w * Math.pow(stats.luck, key === "SECRET" || key === "divine" ? 0.6 : 1.0);
        }
        return { key, cfg, w };
    });
    const totalW = entries.reduce((a, b) => a + b.w, 0);

    const grid = document.getElementById("drop-rates-grid");
    grid.innerHTML = "";
    entries.forEach(({ cfg, w }) => {
        const pct = (w / totalW) * 100;
        const pctText = pct >= 1 ? pct.toFixed(1) + "%" : pct >= 0.01 ? pct.toFixed(3) + "%" : `1 na ${Math.round(totalW / w).toLocaleString()}`;
        const pill = document.createElement("div");
        pill.className = `rate-pill ${cfg.css}`;
        pill.innerHTML = `<div>${cfg.label}</div><div>${pctText}</div>`;
        grid.appendChild(pill);
    });
}

function renderTotems() {
    const eq = getEquippedTotems();
    document.getElementById("equipped-count").textContent = eq.length;

    for (let i = 0; i < 2; i++) {
        const box = document.getElementById(`inv-eq-${i}`);
        const t = eq[i];
        if (t) {
            box.innerHTML = `
                <span class="eq-label">SLOT AKTYWNY ${i + 1}</span>
                <div style="width:56px;height:56px;margin:0 auto;">${getTotemSVG(t.shape, t.c1, t.c2, t.rarity)}</div>
                <div style="font-family:var(--font-display);font-size:0.92rem;">${t.name}</div>
                <div style="font-size:0.75rem;font-weight:900;color:#16a34a;">x${formatNum(t.mult)} • ${t.abilityDesc}</div>
            `;
        } else {
            box.innerHTML = `<span class="eq-label">SLOT AKTYWNY ${i + 1}</span><div class="eq-content" style="color:#64748b;font-weight:800;padding:16px 0;">Wolny Slot</div>`;
        }
    }

    const grid = document.getElementById("totem-grid");
    grid.innerHTML = "";

    if (!state.totems || state.totems.length === 0) {
        grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;background:var(--panel-bg);padding:24px;border-radius:18px;border:3px solid #1a1c2c;font-weight:800;">Brak totemów! Otwórz skrzynię w zakładce Skrzynie 📦</div>`;
        return;
    }

    const sorted = [...state.totems].sort((a, b) => b.mult - a.mult);
    sorted.forEach(t => {
        const isEq = state.equippedUids.includes(t.uid);
        const rCfg = RARITIES[t.rarity] || RARITIES.basic;
        const card = document.createElement("div");
        card.className = `totem-card ${isEq ? "is-equipped" : ""}`;
        card.innerHTML = `
            ${isEq ? `<div class="totem-equipped-tag">ZAŁOŻONY</div>` : ""}
            <span class="totem-rarity-badge ${rCfg.css}">${rCfg.label}</span>
            <div class="totem-svg-box">${getTotemSVG(t.shape || 'pillar', t.c1 || '#86efac', t.c2 || '#16a34a', t.rarity)}</div>
            <div class="totem-name">${t.name}</div>
            <div class="totem-stats">x${formatNum(t.mult)} Mnożnik</div>
            <div class="totem-ability">${t.abilityDesc}</div>
            <div class="totem-card-btns">
                <button class="cartoon-btn ${isEq ? 'btn-gold' : 'btn-green'}" data-eq="${t.uid}">
                    ${isEq ? 'Zdejmij' : 'Załóż'}
                </button>
                <button class="cartoon-btn btn-red" data-del="${t.uid}" title="Przetop">♻️</button>
            </div>
        `;
        grid.appendChild(card);
    });

    grid.querySelectorAll("[data-eq]").forEach(b => b.addEventListener("click", () => toggleEquipTotem(b.dataset.eq)));
    grid.querySelectorAll("[data-del]").forEach(b => b.addEventListener("click", () => deleteSingleTotem(b.dataset.del)));
}

function renderSkillTree() {
    const container = document.getElementById("skill-tree-container");
    container.innerHTML = "";

    SKILL_TREE_TIERS.forEach(tier => {
        const isUnlocked = state.unlockedWorlds.includes(tier.reqWorld);
        const reqWorldName = WORLDS[tier.reqWorld].name;

        const tierEl = document.createElement("div");
        tierEl.className = `tree-tier ${isUnlocked ? "" : "locked-tier"}`;

        let nodesHTML = "";
        tier.nodes.forEach(node => {
            const lvl = getSkillLvl(node.id);
            const isMax = lvl >= node.maxLvl;
            const cost = +(node.baseCost * Math.pow(node.scale, lvl)).toFixed(2);

            nodesHTML += `
                <div class="tree-node">
                    <div class="node-top">
                        <div class="node-icon">${node.icon}</div>
                        <div class="node-info">
                            <h4>${node.name}</h4>
                            <p>${node.desc}</p>
                            <span class="node-lvl">Poziom: ${lvl} / ${node.maxLvl}</span>
                        </div>
                    </div>
                    <button class="cartoon-btn ${isMax ? '' : 'btn-green'}"
                        data-node="${node.id}" data-req="${tier.reqWorld}"
                        ${(!isUnlocked || isMax) ? "disabled" : ""}>
                        ${isMax ? "MAKSYMALNY POZIOM" : `Ulepsz: ${formatNum(cost)} 🪙`}
                    </button>
                </div>
            `;
        });

        tierEl.innerHTML = `
            <div class="tier-header">
                <span class="tier-title">${tier.title}</span>
                ${isUnlocked
                    ? `<span class="tier-unlocked-badge">✅ Odblokowano</span>`
                    : `<span class="tier-lock-badge">🔒 Wymaga wyspy: ${reqWorldName}</span>`}
            </div>
            <div class="tree-nodes-grid">${nodesHTML}</div>
        `;
        container.appendChild(tierEl);
    });

    container.querySelectorAll("[data-node]").forEach(btn => {
        btn.addEventListener("click", () => buySkillNode(btn.dataset.node, Number(btn.dataset.req)));
    });
}

function renderWorlds() {
    const list = document.getElementById("worlds-list");
    list.innerHTML = "";

    WORLDS.forEach(w => {
        const unlocked = state.unlockedWorlds.includes(w.id);
        const isCurrent = state.currentWorld === w.id;
        const prevUnlocked = w.id === 0 || state.unlockedWorlds.includes(w.id - 1);

        const card = document.createElement("div");
        card.className = `world-card ${isCurrent ? "active-world" : ""} ${!unlocked ? "locked-world" : ""}`;

        let actionBtn = "";
        if (isCurrent) {
            actionBtn = `<button class="cartoon-btn btn-gold" disabled>📍 JESTEŚ TUTAJ</button>`;
        } else if (unlocked) {
            actionBtn = `<button class="cartoon-btn btn-blue" data-world="${w.id}">🚀 TELEPORTUJ SIĘ</button>`;
        } else if (prevUnlocked) {
            actionBtn = `<button class="cartoon-btn btn-green" data-world="${w.id}">🔓 ODBLOKUJ (${formatNum(w.unlockCost)} 🪙)</button>`;
        } else {
            actionBtn = `<button class="cartoon-btn" disabled>🔒 ZABLOKOWANA KŁÓDKĄ</button>`;
        }

        card.innerHTML = `
            <div class="world-card-top">
                <div class="world-card-emoji">${unlocked ? w.icon : "🔒"}</div>
                <div>
                    <span style="font-size:0.74rem;font-weight:900;opacity:0.75;">KRAINA #${w.id + 1}</span>
                    <h3 style="font-family:var(--font-display);font-size:1.3rem;">${w.name}</h3>
                </div>
            </div>
            ${!unlocked ? `<div class="padlock-overlay">🔐 Brama zamknięta kłódką! Koszt: ${formatNum(w.unlockCost)} 🪙</div>` : ""}
            <div class="world-card-details">
                <div>✨ Mnożnik Ekonomiczny: <strong>x${formatNum(w.worldMult)}</strong></div>
                <div>📦 Skrzynia: <strong>${w.crateName}</strong> (${formatNum(w.crateCost)} 🪙)</div>
                <div>⚙️ Maszyna: <strong>${w.machine.icon} ${w.machine.name}</strong></div>
            </div>
            ${actionBtn}
        `;
        list.appendChild(card);
    });

    list.querySelectorAll("[data-world]").forEach(btn => {
        btn.addEventListener("click", () => unlockOrTravelWorld(Number(btn.dataset.world)));
    });
}

function renderAll() {
    updateHUD();
    renderArena();
    renderCrates();
    renderTotems();
    renderSkillTree();
    renderWorlds();
}

// --- GAME LOOP ---
function gameTick() {
    const dt = 0.1;
    const stats = getStats();

    if (stats.dps > 0) {
        const gain = stats.dps * dt;
        state.coins += gain;
        state.totalCoinsEarned += gain;
    }

    if (state.combo > 0) {
        state.combo = Math.max(0, state.combo - 2.4);
    }

    const wId = state.currentWorld;
    const world = WORLDS[wId];
    const effectiveInterval = world.machine.interval * (1 - stats.cdReduction);

    if (!state.machineReady[wId]) {
        state.machineTimers[wId] += dt;
        if (state.machineTimers[wId] >= effectiveInterval) {
            state.machineTimers[wId] = effectiveInterval;
            state.machineReady[wId] = true;
            if (getSkillLvl("auto_collect") > 0) {
                collectMachineReward(wId);
            } else {
                sfx.playTone(620, 'sine', 0.12, 0.1);
                renderArena();
            }
        }
    }

    const pct = Math.min(100, (state.machineTimers[wId] / effectiveInterval) * 100);
    const bar = document.getElementById("machine-progress-bar");
    const statusText = document.getElementById("machine-status-text");
    if (bar && statusText) {
        bar.style.width = `${pct}%`;
        if (state.machineReady[wId]) {
            statusText.textContent = "💰 GOTOWE! KLIKNIJ ODBIERZ!";
        } else {
            const rem = Math.max(0, effectiveInterval - state.machineTimers[wId]).toFixed(1);
            statusText.textContent = `${world.machine.name}: ${rem}s`;
        }
    }

    updateHUD();
}

function initBackgroundBubbles() {
    const container = document.getElementById("bg-particles");
    for (let i = 0; i < 14; i++) {
        const b = document.createElement("div");
        b.className = "bg-bubble";
        const size = 25 + Math.random() * 65;
        b.style.width = size + "px";
        b.style.height = size + "px";
        b.style.left = Math.random() * 100 + "vw";
        b.style.animationDuration = (10 + Math.random() * 14) + "s";
        b.style.animationDelay = (-Math.random() * 15) + "s";
        container.appendChild(b);
    }
}

// --- INITIALIZATION ---
document.addEventListener("DOMContentLoaded", () => {
    loadGame();
    applyWorldTheme();
    initBackgroundBubbles();
    renderAll();

    const tapper = document.getElementById("main-tapper");
    tapper.addEventListener("pointerdown", (e) => {
        e.preventDefault();
        handleTap(e.clientX, e.clientY);
    });

    document.addEventListener("keydown", (e) => {
        if (e.code === "Space" && !state.isHatching) {
            e.preventDefault();
            handleTap();
        }
    });

    document.querySelectorAll(".nav-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            document.querySelectorAll(".nav-btn").forEach(b => b.classList.remove("active"));
            document.querySelectorAll(".tab-panel").forEach(p => p.classList.remove("active"));
            btn.classList.add("active");
            const target = btn.dataset.tab;
            document.getElementById(target).classList.add("active");
            if (target === "tab-totems") {
                document.getElementById("nav-totem-badge").classList.add("hidden");
                renderTotems();
            }
            sfx.playTone(380, 'sine', 0.05, 0.08);
        });
    });

    document.getElementById("btn-open-1").addEventListener("click", () => openCrates(1));
    document.getElementById("btn-open-3").addEventListener("click", () => openCrates(3));
    document.getElementById("btn-skip-anim").addEventListener("click", () => finishHatchReveal());
    document.getElementById("btn-close-hatch").addEventListener("click", () => {
        if (shakeTimer) { clearInterval(shakeTimer); shakeTimer = null; }
        if (tickSoundLoop) { clearInterval(tickSoundLoop); tickSoundLoop = null; }
        if (rouletteTimeout) { clearTimeout(rouletteTimeout); rouletteTimeout = null; }
        state.isHatching = false;
        document.getElementById("hatch-modal").classList.add("hidden");
        document.getElementById("confetti-container").innerHTML = "";
        saveGame();
        renderAll();
    });

    document.getElementById("btn-equip-best").addEventListener("click", equipBestTotems);
    document.getElementById("btn-delete-dupes").addEventListener("click", salvageWeakTotems);
    document.getElementById("btn-upgrade-machine").addEventListener("click", upgradeCurrentMachine);
    document.getElementById("btn-collect-machine").addEventListener("click", () => collectMachineReward(state.currentWorld));
    document.getElementById("machine-bar-clickable").addEventListener("click", () => collectMachineReward(state.currentWorld));

    document.getElementById("btn-sound").addEventListener("click", (e) => {
        sfx.enabled = !sfx.enabled;
        e.target.textContent = sfx.enabled ? "🔊" : "🔇";
        showToast(sfx.enabled ? "Dźwięk włączony" : "Dźwięk wyciszony");
    });

    document.getElementById("btn-reset").addEventListener("click", () => {
        if (confirm("Czy na pewno chcesz zresetować cały postęp w Realm Tappers?")) {
            localStorage.removeItem("realmTappersSave_v4");
            location.reload();
        }
    });

    setInterval(gameTick, 100);
    setInterval(saveGame, 3000);
    window.addEventListener("beforeunload", saveGame);
    document.addEventListener("visibilitychange", () => {
        if (document.hidden) saveGame();
    });
});