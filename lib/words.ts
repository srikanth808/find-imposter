// ──────────────────────────────────────────────────────────────
// Word Bank — Relatable everyday categories with Easy/Medium/Hard
// ──────────────────────────────────────────────────────────────

export type Category =
    | "food_nature"
    | "everyday_objects"
    | "technology"
    | "tools_work"
    | "transport"
    | "lifestyle"
    | "mix";

export type Difficulty = "easy" | "medium" | "hard";

// Category display info (used in Create page)
export const CATEGORY_INFO: Record<
    Exclude<Category, "mix">,
    { label: string; icon: string; description: string }
> = {
    food_nature: {
        label: "Food & Nature",
        icon: "🍎",
        description: "Fruits, Vegetables, Animals, Birds, Snacks...",
    },
    everyday_objects: {
        label: "Everyday Objects",
        icon: "🏠",
        description: "Household, Kitchen, Furniture, Clothing...",
    },
    technology: {
        label: "Technology",
        icon: "💻",
        description: "Devices, Apps, Social Media, Electronics...",
    },
    tools_work: {
        label: "Tools & Work",
        icon: "🔧",
        description: "Tools, Construction, Office Items...",
    },
    transport: {
        label: "Transport",
        icon: "🚗",
        description: "Vehicles, Public Transport...",
    },
    lifestyle: {
        label: "Lifestyle",
        icon: "🏃",
        description: "Sports, Hobbies, Outdoor Activities...",
    },
};

// ──────────────────────────────────────────────────────────────
// Main word bank
// ──────────────────────────────────────────────────────────────

const wordBank: Record<
    Exclude<Category, "mix">,
    Record<Difficulty, string[]>
> = {
    // 🍎 Food & Nature
    food_nature: {
        easy: [
            "Banana", "Apple", "Mango", "Onion", "Potato", "Tomato",
            "Pizza", "Tiger", "Lion", "Parrot",
        ],
        medium: [
            "Broccoli", "Pineapple", "Watermelon", "Guava", "Spinach",
            "Mushroom", "Lemonade", "Flamingo", "Dolphin", "Crocodile",
        ],
        hard: [
            "Dragonfruit", "Asparagus", "Pomegranate", "Artichoke", "Durian",
            "Starfruit", "Jackfruit", "Rambutan", "Elk", "Platypus",
        ],
    },

    // 🏠 Everyday Objects
    everyday_objects: {
        easy: [
            "Chair", "Spoon", "Shirt", "Pencil", "Pillow", "Bucket",
            "Mirror", "Broom", "Blanket", "Plate",
        ],
        medium: [
            "Curtain", "Cupboard", "Dustbin", "Ladle", "Scissors",
            "Toothbrush", "Stapler", "Eraser", "Handbag", "Sandals",
        ],
        hard: [
            "Colander", "Whisk", "Ironing Board", "Mortar & Pestle",
            "Tweezers", "Flyswatter", "Percolator", "Tongs", "Sieve", "Spatula",
        ],
    },

    // 💻 Technology
    technology: {
        easy: [
            "Phone", "Laptop", "Charger", "WhatsApp", "Instagram",
            "Camera", "Earphones", "YouTube", "Wi-Fi", "Bluetooth",
        ],
        medium: [
            "Smartwatch", "Tablet", "Keyboard", "Powerbank", "Projector",
            "Hotspot", "Screenshot", "Notification", "Google Maps", "QR Code",
        ],
        hard: [
            "VPN", "RAM", "SSD", "Hard Drive", "Router",
            "Motherboard", "Firewall", "Bandwidth", "Algorithm", "API",
        ],
    },

    // 🔧 Tools & Work
    tools_work: {
        easy: [
            "Hammer", "Screwdriver", "Drill", "Saw", "Ladder",
            "Pen", "Stapler", "Notebook", "File", "Ruler",
        ],
        medium: [
            "Wrench", "Pliers", "Chisel", "Level", "Measuring Tape",
            "Sandpaper", "Clipboard", "Highlighter", "Printer", "Projector",
        ],
        hard: [
            "Soldering Iron", "Jigsaw", "Caliper", "Allen Key",
            "Rivet Gun", "Pneumatic Drill", "Oscilloscope", "Multimeter",
            "Bevel Gauge", "Wire Stripper",
        ],
    },

    // 🚗 Transport
    transport: {
        easy: [
            "Bus", "Car", "Bike", "Train", "Auto", "Cycle",
            "Boat", "Truck", "Scooter", "Van",
        ],
        medium: [
            "Metro", "Tractor", "Ferry", "Helicopter", "Ambulance",
            "Tram", "Rickshaw", "Cargo Ship", "Jet Ski", "Monorail",
        ],
        hard: [
            "Catamaran", "Hovercraft", "Gondola", "Zeppelin", "Snowmobile",
            "Cable Car", "Hyperloop", "Funicular", "Maglev", "Segway",
        ],
    },

    // 🏃 Lifestyle & Activities
    lifestyle: {
        easy: [
            "Cricket", "Swimming", "Cycling", "Dancing", "Cooking",
            "Drawing", "Football", "Running", "Reading", "Singing",
        ],
        medium: [
            "Badminton", "Photography", "Gardening", "Camping", "Skating",
            "Yoga", "Surfing", "Boxing", "Knitting", "Hiking",
        ],
        hard: [
            "Archery", "Fencing", "Polo", "Kayaking", "Paragliding",
            "Rock Climbing", "Skydiving", "Snorkeling", "Jai Alai", "Curling",
        ],
    },
};

// ──────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────

export function getWord(
    category: Category,
    difficulty: Difficulty
): { word: string; category: string } {
    let pool: string[];
    let resolvedCategory: string;

    if (category === "mix") {
        const cats = Object.keys(wordBank) as Exclude<Category, "mix">[];
        const picked = cats[Math.floor(Math.random() * cats.length)];
        pool = wordBank[picked][difficulty];
        resolvedCategory = CATEGORY_INFO[picked].label;
    } else {
        pool = wordBank[category][difficulty];
        resolvedCategory = CATEGORY_INFO[category].label;
    }

    return {
        word: pool[Math.floor(Math.random() * pool.length)],
        category: resolvedCategory,
    };
}

export function getImposterHint(category: string): string {
    const hints: Record<string, string[]> = {
        "Food & Nature": [
            "It's something found in nature or a kitchen",
            "You might eat, see, or pet it",
            "Think about the outdoors or a meal",
        ],
        "Everyday Objects": [
            "You'd find it at home",
            "It's something people use daily",
            "Look around any room — it's probably there",
        ],
        Technology: [
            "It's related to screens or gadgets",
            "Something digital or electronic",
            "People use this on their phone or computer",
        ],
        "Tools & Work": [
            "It's used to build or fix something",
            "You'd find this in an office or workshop",
            "Workers or builders use this",
        ],
        Transport: [
            "It's used to get from one place to another",
            "Something with wheels, wings, or sails",
            "People use this to travel",
        ],
        Lifestyle: [
            "It's an activity people do for fun or fitness",
            "Something sporty or creative",
            "Think of how people spend their free time",
        ],
    };

    const categoryHints = hints[category] ?? [
        "It's something well-known",
        "Think carefully...",
        "Use your instincts",
    ];
    return categoryHints[Math.floor(Math.random() * categoryHints.length)];
}
