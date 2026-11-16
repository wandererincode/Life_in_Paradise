// ============================================================================
// LIFE IN PARADISE — Interactive Gallery Net Art (p5.js)
// Minimalist Intro ("Welcome to \"Life in Paradise\"" + Dancing PLAY button),
// Mouse-Only On-Screen Keypad with Profanity Filter, 2-Min Idle Reset,
// and Dual Restart Controls (RESTART vs. MAIN MENU)
// Base logical resolution: 1920 x 1080 (scales cleanly to 3840 x 2160 4K)
// ============================================================================

const BASE_W = 1920;
const BASE_H = 1080;

// Kept intact so additional countries can easily be re-enabled later
const COUNTRIES = [
  {
    id: "canada",
    name: "Canada",
    subtitle: "Urban Winter · 2.8% Inflation (Compounds Every 3 Days)",
    currency: "$",
    monthlyAllocation: 4000,
    rateValue: 2.8,
    baseCorpProfit: 15.0
  }
];

// App states: "INTRO" | "PERSPECTIVE" | "PLAY" | "GAMEOVER" | "SURVIVED"
let gameState = "INTRO";
let gameOverReason = "DEPLETED"; // "DEPLETED" | "IMPULSE_TRAP" | "NO_CLOTHING"
let currentCountry = COUNTRIES[0];

// Player Perspective & Mouse Keypad State
let playerProfileName = "ANONYMOUS";
let typedPlayerName = "";
let enteringNameMode = false;
let nameBlockedWarning = false;

// Profanity / Restricted Words Filter for Public Gallery Kiosk
const RESTRICTED_WORDS = [
  "ASS", "ASSHOLE", "BASTARD", "BITCH", "BLOWJOB", "BOOB", "BOOBS",
  "COCK", "CUM", "CUNT", "DICK", "DILDO", "DYKE", "FAG", "FAGGOT",
  "FUCK", "FUCKER", "FUCKING", "HANDJOB", "HORNY", "JERKOFF", "JIZZ",
  "KIKE", "MOTHERFUCKER", "NAZI", "NIGGA", "NIGGER", "ORGASM", "PENIS",
  "PORN", "PRICK", "PUSSY", "RAPE", "RAPIST", "RETARD", "SEX", "SHIT",
  "SLUT", "SPIC", "TITS", "TWAT", "VAGINA", "WHORE", "WANKER"
];

const KEYPAD_ROWS = [
  ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
  ["A", "S", "D", "F", "G", "H", "J", "K", "L"],
  ["Z", "X", "C", "V", "B", "N", "M"]
];

function containsRestrictedWord(rawName) {
  const upper = rawName.toUpperCase().trim();
  const collapsed = upper.replace(/[^A-Z0-9]/g, "");
  const normalized = collapsed
    .replace(/0/g, "O")
    .replace(/1/g, "I")
    .replace(/3/g, "E")
    .replace(/4/g, "A")
    .replace(/5/g, "S")
    .replace(/7/g, "T");

  const tokens = upper.split(/[^A-Z0-9]+/).filter(Boolean);

  for (let word of RESTRICTED_WORDS) {
    if (tokens.includes(word)) return true;
    if (word.length >= 4 && (collapsed.includes(word) || normalized.includes(word))) {
      return true;
    }
  }
  return false;
}

// Daily routine states:
// "LEAVING_HOUSE" -> "AT_SHOP" -> "GOING_HOME" -> "RESTING_NIGHT"
let routineState = "LEAVING_HOUSE";
let stateTimer = 0;
let dayCount = 1;
const MONTH_LENGTH = 30;

// Shop sub-menu state: "MAIN" | "FOOD" | "CLOTHING"
let shopMenuView = "MAIN";

// Financial & Core Survival tracking
let remainingBudget = 4000;
let survivalBarLevel = 0.78;
let clothingTier = 0;           // 0 = unclothed, 1 = regular clothes, 2 = winter gear
let boughtNonEssentialTrap = false;

// Corporate Tower & Carnival High-Striker Hammer Gauge state
let corpProfit = 15.0;
let displayedCorpProfit = 15.0;
let monolithGlowLevel = 0.14;
let strikerLevel = 0.0;
let strikerTarget = 0.0;
let strikerPeakHold = 0;
let bellRingTimer = 0;
let towerPulseRings = [];
let towerSparkles = [];
let towerFlashAlpha = 0;

// Narrative Speech Box System (One prompt per day)
let houseMessage = "";
let houseMessageTimer = 0;
let dailyPromptShown = false;

// 30 Unique Prompts — exact user-spaced formatting
const DAILY_THOUGHTS_30 = [
  "Oh, I made $4,000 this month... I hope I can make it through all 30 days.",
  "I don't really have food at home, but I am really craving a hot chocolate...",
  "My coat is way too thin for this wind, though that new iPhone drop looks tempting...",
  "Our heating system isn't working properly... the house feels like ice.",
  "Basic eggs, milk, and bread will keep me going — or should I grab that viral tumbler?",
  "Freezing drafts are pouring under the front door every single night...",
  "Everyone has noise-canceling headphones now... maybe I deserve a small upgrade.",
  "A warm winter coat would stop this shivering, even if it costs a chunk of my budget.",
  "The kitchen pantry is looking bare again... time to restock core groceries.",
  "That smart space heater at the market would make the bedroom feel so cozy.",
  "Ten days down. Prices keep creeping up every time I walk through those doors.",
  "I keep seeing ads for luxury parkas, though regular clothes do the job for way less.",
  "My stomach is growling — fresh meat or seasonal fruits would really boost my energy.",
  "Why does a simple cup of artisan hot chocolate cost almost as much as a week of bread?",
  "Halfway through the month... staying disciplined is harder when everything is on sale.",
  "The furnace rattled all night again — it's tempting to just buy a replacement pump.",
  "A titanium fitness watch looks sleek, but it won't keep my survival bar from dropping.",
  "Just sticking to essentials today: groceries first, ignore the flashing banners.",
  "Twenty days of winter wind... wearing proper layers makes walking out here bearable.",
  "Imported truffle boxes look amazing on display, yet basic staples go so much further.",
  "Every dollar I spend flows straight under the street into that golden tower.",
  "Two-thirds of the month behind me — if I don't fall for impulse traps, I can make it.",
  "The cold air bites harder each morning, yet my budget is holding steady.",
  "Flash sales everywhere I look... they really want me to empty my account today.",
  "Just six days left in the cycle — keep buying basic food and watch the survival meter.",
  "Another shiny tech drop at the storefront, another test of willpower.",
  "Almost at the finish line — milk, eggs, and bread are all I need to get through.",
  "Day 28... I can actually see the end of the month without going broke.",
  "One more trip after today — stay focused and don't touch the luxury items.",
  "Final day of the month! One last grocery run to finish all 30 days."
];

// Market-Only Corporate Marketing Pop-Up Banner
let marketingAd = {
  active: false,
  age: 0,
  headline: "",
  subline: "",
  item: null,
  curX: 0,
  curY: 0,
  curW: 0,
  curH: 0
};

// 15 Black Friday & Boxing Day Trending Banners (Repeats twice over 30 days)
const TRENDING_WANTS_POOL = [
  {
    id: "iphone_new",
    label: "New iPhone 18 Pro",
    tag: "BLACK FRIDAY TECH",
    headline: "UPGRADE NOW — 0% EXCUSES, PURE STATUS!",
    subline: "Limited winter drop! Everyone else already upgraded.",
    basePrice: 1490,
    isCore: false,
    strikerPeak: 1.0,
    towerBoost: 0.32,
    profitJump: 6.90,
    color: [130, 175, 245]
  },
  {
    id: "meta_glasses",
    label: "Ray-Ban Meta Smart Glasses",
    tag: "VIRAL AI DROP",
    headline: "CAPTURE WINTER HANDS-FREE — LIMITED DROP!",
    subline: "Black Friday doorbuster! Live-stream the snow in style.",
    basePrice: 420,
    isCore: false,
    strikerPeak: 0.86,
    towerBoost: 0.16,
    profitJump: 2.35,
    color: [115, 210, 245]
  },
  {
    id: "cruise_trip",
    label: "7-Day Caribbean Cruise",
    tag: "BOXING WEEK ESCAPE",
    headline: "ESCAPE THE FREEZE — BOXING DAY SAILAWAY!",
    subline: "All-inclusive sun & beaches! Why stay cold?",
    basePrice: 1850,
    isCore: false,
    strikerPeak: 1.0,
    towerBoost: 0.36,
    profitJump: 8.20,
    color: [85, 215, 185]
  },
  {
    id: "clothing_sale_70",
    label: "70% Off Designer Streetwear",
    tag: "70% OFF CLEARANCE",
    headline: "70% OFF DOORBUSTER — FINAL CLEARANCE RACK!",
    subline: "Unbeatable Boxing Day markdowns — buy more, save more!",
    basePrice: 340,
    isCore: false,
    strikerPeak: 0.82,
    towerBoost: 0.14,
    profitJump: 1.95,
    color: [245, 130, 165]
  },
  {
    id: "anc_headphones",
    label: "Pro Noise-Canceling Headphones",
    tag: "FLASH DEAL",
    headline: "BLOCK OUT THE COLD — 40% OFF TODAY ONLY!",
    subline: "Black Friday exclusive pricing expires in seconds.",
    basePrice: 580,
    isCore: false,
    strikerPeak: 0.88,
    towerBoost: 0.18,
    profitJump: 2.85,
    color: [185, 140, 245]
  },
  {
    id: "oled_tv",
    label: "65\" 4K QLED Smart TV",
    tag: "DOORBUSTER TV",
    headline: "CINEMA AT HOME — 60% OFF BOXING DAY STEAL!",
    subline: "Ultra-bright HDR screen while the snow piles up outside.",
    basePrice: 1190,
    isCore: false,
    strikerPeak: 0.96,
    towerBoost: 0.28,
    profitJump: 5.40,
    color: [120, 165, 245]
  },
  {
    id: "airwrap_styler",
    label: "Dyson Airwrap Multi-Styler",
    tag: "SELLING FAST",
    headline: "SALON HAIR EVERY MORNING — SELLING OUT FAST!",
    subline: "Limited holiday edition colorway — almost gone!",
    basePrice: 640,
    isCore: false,
    strikerPeak: 0.90,
    towerBoost: 0.20,
    profitJump: 3.15,
    color: [245, 155, 195]
  },
  {
    id: "robot_vacuum",
    label: "AI Self-Emptying Robot Vac",
    tag: "CYBER MONDAY",
    headline: "NEVER SWEEP AGAIN — CYBER MONDAY STEAL!",
    subline: "LiDAR mapping & auto-mop at lowest price of the year.",
    basePrice: 520,
    isCore: false,
    strikerPeak: 0.86,
    towerBoost: 0.17,
    profitJump: 2.60,
    color: [145, 220, 175]
  },
  {
    id: "espresso_machine",
    label: "Barista Espresso Machine",
    tag: "HOLIDAY LUXURY",
    headline: "CAFE LUXURY AT HOME — SAVE $400 TODAY!",
    subline: "Steamed microfoam lattes every winter morning.",
    basePrice: 490,
    isCore: false,
    strikerPeak: 0.85,
    towerBoost: 0.16,
    profitJump: 2.45,
    color: [225, 175, 110]
  },
  {
    id: "vr_headset",
    label: "Meta Quest 3S VR Headset",
    tag: "HOLIDAY BUNDLE",
    headline: "STEP INTO ANOTHER WORLD — HOLIDAY BUNDLE!",
    subline: "Includes 2 free blockbuster games — Black Friday only!",
    basePrice: 480,
    isCore: false,
    strikerPeak: 0.85,
    towerBoost: 0.16,
    profitJump: 2.40,
    color: [160, 145, 250]
  },
  {
    id: "smart_watch",
    label: "Titanium Fitness Watch",
    tag: "TRENDING",
    headline: "TRACK YOUR WINTER — SEASONAL FLASH SALE!",
    subline: "Why wait? Claim yours before stock hits zero.",
    basePrice: 720,
    isCore: false,
    strikerPeak: 0.92,
    towerBoost: 0.21,
    profitJump: 3.40,
    color: [245, 195, 85]
  },
  {
    id: "gaming_console",
    label: "Next-Gen Console Bundle",
    tag: "HOTTEST GIFT",
    headline: "NEXT-GEN WINTER NIGHTS — STOCK ALMOST GONE!",
    subline: "2 controllers + holiday pass included today only.",
    basePrice: 690,
    isCore: false,
    strikerPeak: 0.91,
    towerBoost: 0.20,
    profitJump: 3.25,
    color: [110, 185, 245]
  },
  {
    id: "ultrabook_laptop",
    label: "M5 Ultrabook Pro Laptop",
    tag: "24-HOUR FLASH",
    headline: "POWER UP YOUR WORKFLOW — 24-HOUR FLASH!",
    subline: "Zero-down financing & instant Boxing Week rebate.",
    basePrice: 1390,
    isCore: false,
    strikerPeak: 0.98,
    towerBoost: 0.30,
    profitJump: 6.20,
    color: [175, 195, 225]
  },
  {
    id: "luxury_parka_ad",
    label: "Status Crest Down Parka",
    tag: "VIP ACCESS",
    headline: "STATUS IN THE SNOW — VIP EARLY ACCESS!",
    subline: "Designer emblem warmth — stand out on every block.",
    basePrice: 1150,
    isCore: false,
    strikerPeak: 0.95,
    towerBoost: 0.26,
    profitJump: 4.95,
    color: [235, 115, 105]
  },
  {
    id: "trending_tumbler",
    label: "Viral Thermal Tumbler",
    tag: "LIMITED EDITION",
    headline: "SELLING OUT FAST — COLLECTOR WINTER EDITION!",
    subline: "Don't miss the drop! Instant warmth vibes.",
    basePrice: 240,
    isCore: false,
    strikerPeak: 0.80,
    towerBoost: 0.12,
    profitJump: 1.65,
    color: [245, 145, 175]
  }
];

// Zoomed-in Stage Landmarks
const GROUND_Y = 935;
const HOUSE_X = 250;
const SHOP_X = 910;
const MONOLITH_X = 1590;
const STRIKER_X = 1795;

// Protagonist state
let person = {
  x: HOUSE_X,
  y: GROUND_Y,
  facing: 1,
  walkCycle: 0,
  carryingItem: null
};

// Main Shop Categories
const BASE_MAIN_CATEGORIES = [
  {
    id: "food_category",
    label: "Food & Groceries",
    tag: "OPEN AISLE →",
    isSubMenu: true,
    subMenuType: "FOOD",
    repeatable: true,
    color: [110, 195, 125]
  },
  {
    id: "clothing_category",
    label: "Clothing & Winter Gear",
    tag: "OPEN AISLE →",
    isSubMenu: true,
    subMenuType: "CLOTHING",
    repeatable: true,
    color: [95, 165, 225]
  },
  {
    id: "heat_pump",
    label: "Heat Pump Replacement",
    tag: "HOME REPAIR",
    basePrice: 2450,
    isCore: false,
    repeatable: false,
    strikerPeak: 1.0,
    towerBoost: 0.34,
    profitJump: 7.80,
    color: [245, 165, 65]
  },
  {
    id: "electric_heater",
    label: "Smart Space Heater",
    tag: "HOME HEATING",
    basePrice: 780,
    isCore: false,
    repeatable: false,
    strikerPeak: 0.86,
    towerBoost: 0.16,
    profitJump: 2.40,
    color: [240, 195, 75]
  }
];

// Food Sub-Menu
const FOOD_SUB_ITEMS = [
  { id: "eggs",         label: "Eggs (1 Dozen)",        basePrice: 9,   barRestore: 0.25, isCore: true,  strikerPeak: 0.12, towerBoost: 0.02, profitJump: 0.18, color: [242, 224, 185] },
  { id: "milk",         label: "Milk (4L Jug)",         basePrice: 11,  barRestore: 0.23, isCore: true,  strikerPeak: 0.14, towerBoost: 0.02, profitJump: 0.20, color: [235, 242, 250] },
  { id: "bread",        label: "Whole Wheat Bread",     basePrice: 7,   barRestore: 0.21, isCore: true,  strikerPeak: 0.10, towerBoost: 0.015,profitJump: 0.15, color: [214, 168, 108] },
  { id: "fruits",       label: "Seasonal Fruits",       basePrice: 16,  barRestore: 0.27, isCore: true,  strikerPeak: 0.16, towerBoost: 0.025,profitJump: 0.25, color: [220, 78, 72] },
  { id: "meat",         label: "Fresh Meat Pack",       basePrice: 34,  barRestore: 0.38, isCore: true,  strikerPeak: 0.22, towerBoost: 0.04, profitJump: 0.42, color: [195, 82, 82] },
  { id: "hot_choc",     label: "Artisan Hot Chocolate", basePrice: 280, barRestore: 0.05, isCore: false, strikerPeak: 0.84, towerBoost: 0.14, profitJump: 1.85, color: [155, 95, 62] },
  { id: "gourmet_box",  label: "Imported Truffle Box",  basePrice: 540, barRestore: 0.07, isCore: false, strikerPeak: 0.95, towerBoost: 0.22, profitJump: 3.10, color: [245, 195, 75] },
  { id: "energy_crate", label: "Premium Elixir Crate",  basePrice: 410, barRestore: 0.04, isCore: false, strikerPeak: 0.88, towerBoost: 0.18, profitJump: 2.45, color: [95, 215, 185] }
];

// Clothing Sub-Menu
const CLOTHING_SUB_ITEMS = [
  { id: "reg_clothes",   label: "Regular Everyday Clothes", basePrice: 260, clothTier: 1, barRestore: 0.12, isCore: true,  strikerPeak: 0.18, towerBoost: 0.04, profitJump: 0.50, color: [95, 165, 225] },
  { id: "winter_coat",   label: "Warm Winter Coat & Boots", basePrice: 390, clothTier: 2, barRestore: 0.18, isCore: true,  strikerPeak: 0.24, towerBoost: 0.05, profitJump: 0.70, color: [68, 138, 118] },
  { id: "fancy_coat",    label: "Designer Luxury Parka",    basePrice: 1380,clothTier: 2, barRestore: 0.05, isCore: false, strikerPeak: 0.98, towerBoost: 0.26, profitJump: 5.20, color: [235, 105, 95] },
  { id: "fancy_shoes",   label: "Limited Edition Sneakers", basePrice: 980, clothTier: 1, barRestore: 0.03, isCore: false, strikerPeak: 0.90, towerBoost: 0.21, profitJump: 3.90, color: [245, 198, 78] }
];

let activeMainShopItems = [];
let pipeOrbs = [];
let snowflakes = [];
let chimneySmoke = [];

// 2-Minute Inactivity Timer (120,000 ms)
let lastInteractionMillis = 0;
const IDLE_RESET_MS = 120000;

function setup() {
  const cnv = createCanvas(windowWidth, windowHeight);
  cnv.parent("canvas-container");
  textFont("Helvetica Neue");

  for (let i = 0; i < 160; i++) {
    snowflakes.push({
      x: random(BASE_W),
      y: random(GROUND_Y),
      r: random(2, 5.5),
      speedY: random(0.8, 2.2),
      drift: random(TWO_PI)
    });
  }

  // Initialize continuous winter wind sound for the gallery space
  if (typeof initAudioEngine === "function") {
    initAudioEngine();
  }

  resetSimulation(COUNTRIES[0]);
  lastInteractionMillis = millis();
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

// ============================================================================
// COMPOUNDING 3-DAY INFLATION FORMULA
// ============================================================================
function getInflationStepCount(day) {
  return Math.floor((day - 1) / 3) + 1;
}

function getEffectiveInflationPercent(day) {
  const steps = getInflationStepCount(day);
  const multiplier = Math.pow(1 + currentCountry.rateValue / 100, steps);
  return ((multiplier - 1) * 100).toFixed(1);
}

function getInflatedPrice(basePrice, day) {
  const steps = getInflationStepCount(day);
  const multiplier = Math.pow(1 + currentCountry.rateValue / 100, steps);
  return Math.round(basePrice * multiplier);
}

function refreshDailyShopRotation(day) {
  if (day === 1) {
    activeMainShopItems = [];
    for (let i = 0; i < 3; i++) {
      let item = Object.assign({}, BASE_MAIN_CATEGORIES[i]);
      item.purchased = false;
      activeMainShopItems.push(item);
    }
  } else if (day === 2) {
    let heater = Object.assign({}, BASE_MAIN_CATEGORIES[3]);
    heater.purchased = false;
    activeMainShopItems.push(heater);
  }

  activeMainShopItems = activeMainShopItems.filter(it => !it.isDailyWant);
  const wantTemplate = TRENDING_WANTS_POOL[(day - 1) % TRENDING_WANTS_POOL.length];
  let dailyWant = Object.assign({}, wantTemplate);
  dailyWant.isDailyWant = true;
  dailyWant.repeatable = false;
  dailyWant.purchased = false;
  activeMainShopItems.push(dailyWant);
}

function triggerMarketFlashAd(day) {
  const wantTemplate = TRENDING_WANTS_POOL[(day - 1) % TRENDING_WANTS_POOL.length];
  marketingAd.active = true;
  marketingAd.age = 0;
  marketingAd.headline = wantTemplate.headline;
  marketingAd.subline = wantTemplate.subline;
  marketingAd.item = wantTemplate;

  // Starts at the large center box size, then smoothly docks to the small bottom-right box
  marketingAd.curW = 860;
  marketingAd.curH = 424;
  marketingAd.curX = (BASE_W - marketingAd.curW) / 2;
  marketingAd.curY = (BASE_H - marketingAd.curH) / 2 - 35;

  if (typeof triggerAdPopupSound === "function") {
    triggerAdPopupSound();
  }
}

function updateMarketingAdAnimation() {
  if (!marketingAd.active) return;

  marketingAd.age++;

  const dockW = 450;
  const dockH = 222;
  const dockX = BASE_W - dockW - 22;
  const dockY = BASE_H - dockH - 22;

  if (marketingAd.age > 75) {
    marketingAd.curX = lerp(marketingAd.curX, dockX, 0.14);
    marketingAd.curY = lerp(marketingAd.curY, dockY, 0.14);
    marketingAd.curW = lerp(marketingAd.curW, dockW, 0.14);
    marketingAd.curH = lerp(marketingAd.curH, dockH, 0.14);
  }
}

function resetSimulation(country) {
  currentCountry = country;
  dayCount = 1;
  remainingBudget = country.monthlyAllocation;
  survivalBarLevel = 0.78;
  clothingTier = 0;
  boughtNonEssentialTrap = false;
  gameOverReason = "DEPLETED";
  shopMenuView = "MAIN";

  corpProfit = country.baseCorpProfit;
  displayedCorpProfit = country.baseCorpProfit;
  monolithGlowLevel = 0.14;
  strikerLevel = 0;
  strikerTarget = 0;
  strikerPeakHold = 0;
  bellRingTimer = 0;
  towerPulseRings = [];
  towerSparkles = [];
  towerFlashAlpha = 0;
  pipeOrbs = [];
  chimneySmoke = [];

  houseMessage = DAILY_THOUGHTS_30[0];
  houseMessageTimer = 380;
  dailyPromptShown = true;
  marketingAd.active = false;

  person.x = HOUSE_X;
  person.facing = 1;
  person.carryingItem = null;
  routineState = "LEAVING_HOUSE";
  stateTimer = 0;

  refreshDailyShopRotation(1);
}

function returnToMainWelcomePage() {
  enteringNameMode = false;
  typedPlayerName = "";
  nameBlockedWarning = false;
  playerProfileName = "ANONYMOUS";
  gameState = "INTRO";
}

function restartFromFirstDayLoop() {
  resetSimulation(currentCountry);
  gameState = "PLAY";
}

function getLogicalMouse() {
  const s = min(width / BASE_W, height / BASE_H);
  const offsetX = (width - BASE_W * s) * 0.5;
  const offsetY = (height - BASE_H * s) * 0.5;
  return {
    x: (mouseX - offsetX) / s,
    y: (mouseY - offsetY) / s
  };
}

function mouseMoved() {
  lastInteractionMillis = millis();
  if (typeof initAudioEngine === "function") {
    initAudioEngine();
  }
}

function draw() {
  background(18, 22, 30);

  if (typeof updateAudioEnvironment === "function") {
    updateAudioEnvironment(gameState, routineState, survivalBarLevel, frameCount);
  }

  // 2-Minute (120,000 ms) inactivity check -> returns to main welcome page
  if (gameState !== "INTRO" && millis() - lastInteractionMillis > IDLE_RESET_MS) {
    returnToMainWelcomePage();
  }

  const s = min(width / BASE_W, height / BASE_H);
  const offsetX = (width - BASE_W * s) * 0.5;
  const offsetY = (height - BASE_H * s) * 0.5;

  push();
  translate(offsetX, offsetY);
  scale(s);

  if (gameState === "INTRO") {
    drawIntroWelcomeScreen();
  } else if (gameState === "PERSPECTIVE") {
    drawPerspectiveChoiceScreen();
  } else if (gameState === "PLAY") {
    updateDailyLoop();
    drawWorldScene();
  } else if (gameState === "GAMEOVER") {
    drawWorldScene();
    drawGameOverOverlay();
  } else if (gameState === "SURVIVED") {
    drawWorldScene();
    drawSurvivedOverlay();
  }

  pop();
}

// ============================================================================
// SCREEN 1: MINIMALIST INTRO ("Welcome to \"Life in Paradise\"" + DANCING PLAY)
// ============================================================================
function drawIntroWelcomeScreen() {
  background(20, 25, 35);
  drawFadedUrbanHorizon(0.4, false);
  drawSnowfall();

  const m = getLogicalMouse();

  // Headline: Welcome to "Life in Paradise" (with "Life in Paradise" inside quotes)
  noStroke();
  textAlign(CENTER, CENTER);
  textSize(74);
  textStyle(BOLD);

  const part1 = "Welcome to ";
  const part2 = '"Life in Paradise"';
  const w1 = textWidth(part1);
  const w2 = textWidth(part2);
  const startX = BASE_W / 2 - (w1 + w2) / 2;

  textAlign(LEFT, CENTER);
  fill(246, 249, 255);
  text(part1, startX, 410);

  fill(245, 206, 108);
  text(part2, startX + w1, 410);

  // Inviting Dancing / Floating PLAY Button
  const baseBw = 330;
  const baseBh = 78;
  const baseBx = BASE_W / 2;
  const baseBy = 555;

  const hoverCheck = (
    m.x >= baseBx - baseBw / 2 &&
    m.x <= baseBx + baseBw / 2 &&
    m.y >= baseBy - baseBh / 2 &&
    m.y <= baseBy + baseBh / 2
  );

  // Gentle rhythmic bounce, sway, and pulse
  const danceY = sin(frameCount * 0.065) * 9;
  const danceX = cos(frameCount * 0.032) * 5;
  const danceRot = sin(frameCount * 0.05) * (hoverCheck ? 0.015 : 0.035);
  const pulseScale = hoverCheck ? 1.07 : (1.0 + sin(frameCount * 0.08) * 0.03);

  push();
  translate(baseBx + danceX, baseBy + danceY);
  rotate(danceRot);
  scale(pulseScale);

  // Outer ambient inviting halo
  const glowAlpha = map(sin(frameCount * 0.08), -1, 1, 25, 75);
  noStroke();
  fill(245, 206, 108, glowAlpha);
  rect(-baseBw / 2 - 14, -baseBh / 2 - 14, baseBw + 28, baseBh + 28, 22);

  fill(hoverCheck ? color(255, 222, 130) : color(240, 198, 98));
  stroke(255, 242, 190);
  strokeWeight(3);
  rect(-baseBw / 2, -baseBh / 2, baseBw, baseBh, 16);

  noStroke();
  fill(18, 22, 30);
  textAlign(CENTER, CENTER);
  textSize(28);
  textStyle(BOLD);
  text("PLAY →", 0, 1);
  pop();
}

// ============================================================================
// SCREEN 2: PERSPECTIVE & MOUSE-ONLY ON-SCREEN KEYPAD
// ============================================================================
function drawPerspectiveChoiceScreen() {
  background(20, 25, 35);
  drawFadedUrbanHorizon(0.35, false);
  drawSnowfall();

  const m = getLogicalMouse();

  noStroke();
  fill(246, 249, 255);
  textAlign(CENTER, CENTER);
  textSize(44);
  textStyle(BOLD);
  text("HOW DO YOU WANT TO EXPERIENCE THIS WINTER?", BASE_W / 2, 118);

  fill(170, 184, 204);
  textSize(20);
  textStyle(NORMAL);
  text("Step directly into the protagonist's shoes, or observe from an outside perspective.", BASE_W / 2, 168);

  if (!enteringNameMode) {
    // --- TWO SIDE-BY-SIDE CARDS ---
    const cardW = 580;
    const cardH = 420;
    const gap = 64;
    const leftX = (BASE_W - (cardW * 2 + gap)) / 2;
    const rightX = leftX + cardW + gap;
    const cardY = 265;

    // Left Card: Protagonist's Shoes
    const leftHover = m.x >= leftX && m.x <= leftX + cardW && m.y >= cardY && m.y <= cardY + cardH;
    stroke(leftHover ? color(240, 198, 98) : color(75, 88, 110));
    strokeWeight(leftHover ? 3.5 : 2);
    fill(leftHover ? color(30, 36, 50) : color(25, 30, 42));
    rect(leftX, cardY, cardW, cardH, 18);

    noStroke();
    fill(240, 198, 98);
    textAlign(CENTER, TOP);
    textSize(15);
    textStyle(BOLD);
    text("FIRST-PERSON IMMERSION", leftX + cardW / 2, cardY + 34);

    fill(248);
    textSize(28);
    textStyle(BOLD);
    rectMode(CENTER);
    text("Feel Yourself in the\nProtagonist's Shoes", leftX + cardW / 2, cardY + 105, cardW - 60, 80);

    fill(172, 184, 202);
    textSize(17);
    textStyle(NORMAL);
    text("Enter your name using the on-screen keypad so the experience speaks directly to you.", leftX + cardW / 2, cardY + 185, cardW - 70, 65);
    rectMode(CORNER);

    fill(leftHover ? color(240, 198, 98) : color(56, 66, 84));
    rect(leftX + 110, cardY + 295, cardW - 220, 56, 10);
    fill(leftHover ? 18 : 240);
    textAlign(CENTER, CENTER);
    textSize(18);
    textStyle(BOLD);
    text("ENTER YOUR NAME →", leftX + cardW / 2, cardY + 323);

    // Right Card: Outside Perspective (ANONYMOUS)
    const rightHover = m.x >= rightX && m.x <= rightX + cardW && m.y >= cardY && m.y <= cardY + cardH;
    stroke(rightHover ? color(120, 215, 175) : color(75, 88, 110));
    strokeWeight(rightHover ? 3.5 : 2);
    fill(rightHover ? color(30, 38, 52) : color(25, 30, 42));
    rect(rightX, cardY, cardW, cardH, 18);

    noStroke();
    fill(120, 215, 175);
    textAlign(CENTER, TOP);
    textSize(15);
    textStyle(BOLD);
    text("OBSERVER MODE", rightX + cardW / 2, cardY + 34);

    fill(248);
    textSize(28);
    textStyle(BOLD);
    rectMode(CENTER);
    text("Play From an\nOutside Perspective", rightX + cardW / 2, cardY + 105, cardW - 60, 80);

    fill(172, 184, 202);
    textSize(17);
    textStyle(NORMAL);
    text("Jump straight into the simulation as an anonymous resident and watch how the system unfolds.", rightX + cardW / 2, cardY + 185, cardW - 70, 65);
    rectMode(CORNER);

    fill(rightHover ? color(120, 215, 175) : color(56, 66, 84));
    rect(rightX + 110, cardY + 295, cardW - 220, 56, 10);
    fill(rightHover ? 18 : 240);
    textAlign(CENTER, CENTER);
    textSize(18);
    textStyle(BOLD);
    text("PLAY AS ANONYMOUS →", rightX + cardW / 2, cardY + 323);
  } else {
    // --- MOUSE-ONLY ON-SCREEN KEYPAD PANEL ---
    const panelW = 1040;
    const panelH = 740;
    const px = (BASE_W - panelW) / 2;
    const py = 215;

    fill(24, 29, 41, 248);
    stroke(240, 198, 98);
    strokeWeight(3);
    rect(px, py, panelW, panelH, 20);

    noStroke();
    fill(240, 198, 98);
    textAlign(CENTER, CENTER);
    textSize(18);
    textStyle(BOLD);
    text("TAP LETTERS WITH THE MOUSE TO ENTER YOUR NAME", BASE_W / 2, py + 42);

    // Name Display Box
    const inW = 680;
    const inH = 68;
    const inX = (BASE_W - inW) / 2;
    const inY = py + 76;

    fill(15, 19, 27);
    stroke(nameBlockedWarning ? color(245, 85, 80) : color(110, 126, 152));
    strokeWeight(2.5);
    rect(inX, inY, inW, inH, 12);

    noStroke();
    const cursor = (frameCount % 40 < 20) ? "|" : "";
    fill(typedPlayerName.length > 0 ? 252 : 115);
    textAlign(CENTER, CENTER);
    textSize(30);
    textStyle(BOLD);
    const displayStr = typedPlayerName.length > 0 ? (typedPlayerName + cursor) : ("YOUR NAME" + cursor);
    text(displayStr, BASE_W / 2, inY + inH / 2);

    if (nameBlockedWarning) {
      fill(245, 95, 88);
      textSize(16);
      textStyle(BOLD);
      text("RESTRICTED WORD DETECTED — PLEASE ENTER A DIFFERENT NAME", BASE_W / 2, inY + inH + 22);
    }

    // QWERTY Keys
    const keyW = 78;
    const keyH = 66;
    const keyGap = 12;
    const keysStartY = py + 190;

    for (let r = 0; r < KEYPAD_ROWS.length; r++) {
      const rowKeys = KEYPAD_ROWS[r];
      const rowW = rowKeys.length * keyW + (rowKeys.length - 1) * keyGap;
      const rowStartX = (BASE_W - rowW) / 2;
      const ky = keysStartY + r * (keyH + 14);

      for (let c = 0; c < rowKeys.length; c++) {
        const kx = rowStartX + c * (keyW + keyGap);
        const kHover = m.x >= kx && m.x <= kx + keyW && m.y >= ky && m.y <= ky + keyH;

        fill(kHover ? color(240, 198, 98) : color(38, 46, 62));
        stroke(kHover ? color(255, 240, 180) : color(78, 90, 112));
        strokeWeight(2);
        rect(kx, ky, keyW, keyH, 10);

        noStroke();
        fill(kHover ? 18 : 245);
        textAlign(CENTER, CENTER);
        textSize(24);
        textStyle(BOLD);
        text(rowKeys[c], kx + keyW / 2, ky + keyH / 2);
      }
    }

    // Bottom Utility Row: CLEAR | SPACE | BACKSPACE
    const utilY = keysStartY + 3 * (keyH + 14);
    const utilGap = 16;
    const clearW = 180;
    const spaceW = 360;
    const backW = 210;
    const totalUtilW = clearW + spaceW + backW + utilGap * 2;
    const utilStartX = (BASE_W - totalUtilW) / 2;

    // CLEAR
    const clearHover = m.x >= utilStartX && m.x <= utilStartX + clearW && m.y >= utilY && m.y <= utilY + keyH;
    fill(clearHover ? color(220, 82, 78) : color(48, 42, 52));
    stroke(85, 76, 92);
    strokeWeight(2);
    rect(utilStartX, utilY, clearW, keyH, 10);
    noStroke();
    fill(245);
    textSize(18);
    text("CLEAR", utilStartX + clearW / 2, utilY + keyH / 2);

    // SPACE
    const spaceX = utilStartX + clearW + utilGap;
    const spaceHover = m.x >= spaceX && m.x <= spaceX + spaceW && m.y >= utilY && m.y <= utilY + keyH;
    fill(spaceHover ? color(240, 198, 98) : color(38, 46, 62));
    stroke(78, 90, 112);
    strokeWeight(2);
    rect(spaceX, utilY, spaceW, keyH, 10);
    noStroke();
    fill(spaceHover ? 18 : 240);
    textSize(18);
    text("SPACE", spaceX + spaceW / 2, utilY + keyH / 2);

    // BACKSPACE
    const backX = spaceX + spaceW + utilGap;
    const backHover = m.x >= backX && m.x <= backX + backW && m.y >= utilY && m.y <= utilY + keyH;
    fill(backHover ? color(240, 198, 98) : color(38, 46, 62));
    stroke(78, 90, 112);
    strokeWeight(2);
    rect(backX, utilY, backW, keyH, 10);
    noStroke();
    fill(backHover ? 18 : 240);
    textSize(18);
    text("⌫ DELETE", backX + backW / 2, utilY + keyH / 2);

    // Bottom Action Buttons: BACK TO OPTIONS | START GAME
    const actY = py + panelH - 96;
    const backOptW = 280;
    const startW = 420;
    const actGap = 28;
    const actStartX = (BASE_W - (backOptW + startW + actGap)) / 2;

    const backOptHover = m.x >= actStartX && m.x <= actStartX + backOptW && m.y >= actY && m.y <= actY + 62;
    fill(backOptHover ? color(72, 82, 102) : color(42, 48, 62));
    noStroke();
    rect(actStartX, actY, backOptW, 62, 12);
    fill(230);
    textSize(18);
    text("← BACK", actStartX + backOptW / 2, actY + 31);

    const startX = actStartX + backOptW + actGap;
    const startHover = m.x >= startX && m.x <= startX + startW && m.y >= actY && m.y <= actY + 62;
    fill(startHover ? color(255, 218, 120) : color(240, 198, 98));
    rect(startX, actY, startW, 62, 12);
    fill(18, 22, 30);
    textSize(20);
    const labelName = typedPlayerName.trim().length > 0 ? typedPlayerName.trim() : "YOURSELF";
    text("START AS " + labelName + " →", startX + startW / 2, actY + 31);
  }
}

// ============================================================================
// DAILY WINTER ROUTINE LOGIC
// ============================================================================
function updateDailyLoop() {
  displayedCorpProfit = lerp(displayedCorpProfit, corpProfit, 0.08);
  if (towerFlashAlpha > 0) towerFlashAlpha = max(0, towerFlashAlpha - 5);
  if (bellRingTimer > 0) bellRingTimer--;
  if (houseMessageTimer > 0) houseMessageTimer--;

  if (routineState === "AT_SHOP" && marketingAd.active) {
    updateMarketingAdAnimation();
  } else {
    marketingAd.active = false;
  }

  if (strikerPeakHold > 0) {
    strikerLevel = lerp(strikerLevel, strikerTarget, 0.22);
    strikerPeakHold--;
  } else {
    strikerTarget = max(0, strikerTarget - 0.008);
    strikerLevel = lerp(strikerLevel, strikerTarget, 0.08);
  }

  if (routineState !== "AT_SHOP") {
    let drainMultiplier = 1.0;
    if (clothingTier === 1) drainMultiplier = 0.68;
    else if (clothingTier >= 2) drainMultiplier = 0.48;

    survivalBarLevel -= 0.00044 * drainMultiplier;
    survivalBarLevel = constrain(survivalBarLevel, 0, 1);

    if (survivalBarLevel <= 0) {
      gameOverReason = "DEPLETED";
      gameState = "GAMEOVER";
      if (typeof triggerGameOverSound === "function") triggerGameOverSound();
      return;
    }
  }

  for (let i = towerPulseRings.length - 1; i >= 0; i--) {
    let ring = towerPulseRings[i];
    ring.radius += 6.0;
    ring.alpha -= 4.0;
    if (ring.alpha <= 0) towerPulseRings.splice(i, 1);
  }
  for (let i = towerSparkles.length - 1; i >= 0; i--) {
    let sp = towerSparkles[i];
    sp.x += sp.vx;
    sp.y += sp.vy;
    sp.vy -= 0.04;
    sp.alpha -= 3.2;
    if (sp.alpha <= 0) towerSparkles.splice(i, 1);
  }

  if (frameCount % 22 === 0) {
    chimneySmoke.push({
      x: HOUSE_X + 72,
      y: GROUND_Y - 318,
      r: random(9, 15),
      alpha: 135
    });
  }
  for (let i = chimneySmoke.length - 1; i >= 0; i--) {
    let sm = chimneySmoke[i];
    sm.y -= 0.8;
    sm.x += sin(frameCount * 0.03 + i) * 0.45;
    sm.r += 0.14;
    sm.alpha -= 0.85;
    if (sm.alpha <= 0) chimneySmoke.splice(i, 1);
  }

  const walkSpeed = survivalBarLevel < 0.35 ? 1.35 : 1.85;

  if (routineState === "LEAVING_HOUSE") {
    person.facing = 1;
    person.walkCycle += 0.085;
    person.x += walkSpeed;

    if (!dailyPromptShown && person.x >= HOUSE_X + 165) {
      dailyPromptShown = true;
      const idx = constrain(dayCount - 1, 0, DAILY_THOUGHTS_30.length - 1);
      houseMessage = DAILY_THOUGHTS_30[idx];
      houseMessageTimer = 350;
    }

    if (person.x >= SHOP_X - 60) {
      person.x = SHOP_X - 60;
      shopMenuView = "MAIN";
      routineState = "AT_SHOP";
      triggerMarketFlashAd(dayCount);
    }
  } else if (routineState === "AT_SHOP") {
    person.walkCycle = 0;
  } else if (routineState === "GOING_HOME") {
    person.facing = -1;
    person.walkCycle += 0.085;
    person.x -= walkSpeed;

    if (person.x <= HOUSE_X) {
      person.x = HOUSE_X;
      person.carryingItem = null;
      routineState = "RESTING_NIGHT";
      stateTimer = 90;
    }
  } else if (routineState === "RESTING_NIGHT") {
    stateTimer--;
    if (stateTimer <= 0) {
      advanceToNextWinterDay();
    }
  }

  for (let i = pipeOrbs.length - 1; i >= 0; i--) {
    let orb = pipeOrbs[i];
    orb.progress += 0.015;
    if (orb.progress >= 1) {
      monolithGlowLevel = constrain(monolithGlowLevel + orb.glowGain, 0, 1);
      corpProfit += orb.profitSlice;
      triggerTowerAndCarnivalHit(orb.isBig, orb.strikerPeak);
      pipeOrbs.splice(i, 1);
    }
  }
}

function triggerTowerAndCarnivalHit(isBigPurchase, peakVal) {
  towerFlashAlpha = isBigPurchase ? 160 : 55;

  if (typeof triggerTowerOrbSound === "function") {
    triggerTowerOrbSound(isBigPurchase, corpProfit);
  }

  if (peakVal > strikerTarget) {
    strikerTarget = peakVal;
    strikerPeakHold = isBigPurchase ? 120 : 55;
  }

  if (peakVal >= 0.78 && bellRingTimer <= 0) {
    bellRingTimer = 95;
    if (typeof triggerTowerBellSound === "function") {
      triggerTowerBellSound();
    }
  }

  towerPulseRings.push({
    x: MONOLITH_X,
    y: GROUND_Y - 290,
    radius: 45,
    alpha: isBigPurchase ? 235 : 110,
    weight: isBigPurchase ? 6.0 : 2.0
  });

  const count = isBigPurchase ? 24 : 5;
  for (let i = 0; i < count; i++) {
    towerSparkles.push({
      x: MONOLITH_X + random(-115, 115),
      y: GROUND_Y - random(60, 530),
      vx: random(-1.4, 1.4),
      vy: random(-2.5, -0.6),
      size: random(4, isBigPurchase ? 12 : 5),
      alpha: 255
    });
  }
}

function advanceToNextWinterDay() {
  dayCount++;
  dailyPromptShown = false;
  refreshDailyShopRotation(dayCount);

  if (survivalBarLevel <= 0) {
    gameOverReason = "DEPLETED";
    gameState = "GAMEOVER";
    if (typeof triggerGameOverSound === "function") triggerGameOverSound();
  } else if (dayCount > MONTH_LENGTH) {
    if (!boughtNonEssentialTrap && clothingTier >= 1) {
      gameState = "SURVIVED";
    } else if (boughtNonEssentialTrap) {
      gameOverReason = "IMPULSE_TRAP";
      gameState = "GAMEOVER";
      if (typeof triggerGameOverSound === "function") triggerGameOverSound();
    } else {
      gameOverReason = "NO_CLOTHING";
      gameState = "GAMEOVER";
      if (typeof triggerGameOverSound === "function") triggerGameOverSound();
    }
  } else {
    routineState = "LEAVING_HOUSE";
  }
}

// ============================================================================
// MAIN VISUAL WORLD
// ============================================================================
function drawWorldScene() {
  const isNight = routineState === "RESTING_NIGHT";

  drawWinterSky(isNight);
  drawFadedUrbanHorizon(1.0, isNight);
  drawSnowyGroundAndEvergreens();
  drawUndergroundPipeSystem();
  drawCanadianHouse(isNight);
  drawCanadianUrbanMarket(isNight);
  drawMonolithTower();
  drawCarnivalStrikerGauge();

  if (survivalBarLevel < 0.35) {
    drawLowSurvivalVignette();
  }

  drawTopAllocationHeader();

  if (routineState === "AT_SHOP") {
    drawLargeShopOverlay();
  }

  drawProtagonist();
  drawRectangularThoughtBubble();
  drawSnowfall();

  if (routineState === "AT_SHOP" && marketingAd.active) {
    drawCorporateMarketingPopup();
  }
}

function drawLowSurvivalVignette() {
  const pulse = (sin(frameCount * 0.12) * 0.5 + 0.5) * 45;
  const baseAlpha = map(survivalBarLevel, 0, 0.35, 85, 15) + pulse;
  noFill();
  stroke(95, 165, 235, baseAlpha);
  strokeWeight(24);
  rect(0, 88, BASE_W, BASE_H - 88);
  noStroke();
}

function drawWinterSky(isNight) {
  const cTop = isNight ? color(18, 24, 38) : color(152, 174, 196);
  const cBot = isNight ? color(36, 46, 68) : color(214, 224, 234);

  for (let y = 0; y < GROUND_Y; y += 6) {
    const inter = map(y, 0, GROUND_Y, 0, 1);
    stroke(lerpColor(cTop, cBot, inter));
    strokeWeight(7);
    line(0, y, BASE_W, y);
  }
  noStroke();
}

function drawFadedUrbanHorizon(opacityScale, isNight) {
  const silColor = isNight
    ? color(28, 36, 52, 165 * opacityScale)
    : color(128, 146, 166, 105 * opacityScale);

  fill(silColor);
  noStroke();

  const skyline = [
    { x: 60,   w: 135, h: 300 },
    { x: 220,  w: 100, h: 390 },
    { x: 430,  w: 170, h: 260 },
    { x: 625,  w: 110, h: 430 },
    { x: 760,  w: 150, h: 330 },
    { x: 1120, w: 160, h: 400 },
    { x: 1300, w: 190, h: 310 },
    { x: 1490, w: 125, h: 480 },
    { x: 1740, w: 145, h: 350 }
  ];

  for (let b of skyline) {
    rect(b.x, GROUND_Y - b.h, b.w, b.h, 3, 3, 0, 0);
  }

  rect(485, GROUND_Y - 340, 18, 80);
  rect(525, GROUND_Y - 315, 16, 55);
  rect(1355, GROUND_Y - 395, 20, 85);
}

function drawSnowyGroundAndEvergreens() {
  noStroke();
  fill(44, 50, 60);
  rect(0, GROUND_Y, BASE_W, BASE_H - GROUND_Y);

  fill(238, 244, 250);
  rect(0, GROUND_Y - 7, BASE_W, 20, 4);

  fill(224, 234, 245);
  ellipse(140, GROUND_Y, 150, 20);
  ellipse(500, GROUND_Y, 200, 24);
  ellipse(750, GROUND_Y, 160, 18);
  ellipse(1210, GROUND_Y, 230, 24);

  drawSnowyPineTree(75, GROUND_Y, 1.22);
  drawSnowyPineTree(455, GROUND_Y, 0.98);
}

function drawSnowyPineTree(tx, ty, scaleFactor) {
  push();
  translate(tx, ty);
  scale(scaleFactor);

  fill(74, 56, 46);
  rect(-8, -48, 16, 48);

  const tiers = [
    { y: -44, w: 92, h: 70 },
    { y: -88, w: 72, h: 62 },
    { y: -128, w: 52, h: 54 }
  ];

  for (let t of tiers) {
    fill(44, 82, 68);
    triangle(-t.w / 2, t.y, t.w / 2, t.y, 0, t.y - t.h);

    fill(240, 246, 252);
    triangle(-t.w * 0.26, t.y - t.h * 0.48, t.w * 0.26, t.y - t.h * 0.48, 0, t.y - t.h);
  }
  pop();
}

// --- LEFT: CANADIAN STYLE HOUSE ---
function drawCanadianHouse(isNight) {
  const hx = HOUSE_X - 130;
  const hy = GROUND_Y - 225;
  const hw = 260;
  const hh = 225;

  noStroke();
  for (let sm of chimneySmoke) {
    fill(225, 232, 242, sm.alpha);
    ellipse(sm.x, sm.y, sm.r, sm.r * 0.85);
  }

  fill(138, 68, 62);
  rect(hx + 188, hy - 96, 30, 84);
  fill(242, 247, 252);
  rect(hx + 184, hy - 101, 38, 8, 2);

  fill(218, 212, 202);
  stroke(150, 154, 162);
  strokeWeight(2);
  rect(hx, hy, hw, hh);

  stroke(188, 184, 176);
  strokeWeight(1.4);
  for (let y = hy + 18; y < GROUND_Y; y += 18) {
    line(hx + 2, y, hx + hw - 2, y);
  }

  noStroke();
  fill(52, 60, 72);
  triangle(hx - 20, hy + 4, hx + hw + 20, hy + 4, hx + hw / 2, hy - 98);

  fill(242, 247, 252);
  beginShape();
  vertex(hx - 22, hy + 4);
  vertex(hx + hw / 2, hy - 101);
  vertex(hx + hw + 22, hy + 4);
  vertex(hx + hw + 15, hy + 12);
  vertex(hx + hw / 2, hy - 85);
  vertex(hx - 15, hy + 12);
  endShape(CLOSE);

  fill(64, 72, 86);
  rect(hx + 18, hy + 110, 98, 14, 2);
  fill(242, 247, 252);
  rect(hx + 16, hy + 104, 102, 7, 2);
  fill(235, 238, 242);
  rect(hx + 25, hy + 124, 8, 101);
  rect(hx + 102, hy + 124, 8, 101);

  fill(124, 58, 52);
  rect(hx + 46, hy + 132, 44, 93, 3, 3, 0, 0);

  const coldWin = color(82, 96, 114);
  const warmWin = isNight ? color(255, 208, 105) : color(248, 224, 158);
  fill(lerpColor(coldWin, warmWin, constrain(survivalBarLevel, 0.2, 1)));
  stroke(58, 64, 76);
  strokeWeight(2.5);

  rect(hx + hw / 2 - 25, hy - 50, 50, 38, 3);
  line(hx + hw / 2, hy - 50, hx + hw / 2, hy - 12);

  rect(hx + 140, hy + 55, 86, 70, 3);
  line(hx + 183, hy + 55, hx + 183, hy + 125);
  line(hx + 140, hy + 90, hx + 226, hy + 90);
  noStroke();
}

// --- RECTANGULAR THOUGHT BOX + CONNECTED TRAIL BUBBLES ---
function drawRectangularThoughtBubble() {
  if (houseMessageTimer <= 0 || !houseMessage || routineState === "AT_SHOP" || routineState === "RESTING_NIGHT") return;

  const alpha = constrain(map(houseMessageTimer, 0, 45, 0, 248), 0, 248);
  const bw = 490;
  const bh = 106;
  const bx = constrain(person.x - bw * 0.35, 75, 760);
  const by = GROUND_Y - 468;

  push();
  noStroke();
  fill(10, 14, 22, alpha * 0.45);
  rect(bx + 5, by + 6, bw, bh, 16);

  fill(22, 27, 38, alpha);
  stroke(235, 165, 85, alpha);
  strokeWeight(2.5);
  rect(bx, by, bw, bh, 16);

  const headX = person.x + person.facing * 6;
  const headY = GROUND_Y - 125;
  const startTrailX = constrain(person.x, bx + 65, bx + bw - 65);
  const startTrailY = by + bh + 16;

  const steps = 4;
  for (let i = 0; i < steps; i++) {
    const t = i / (steps - 1);
    const tx = lerp(startTrailX, headX, t * 0.88);
    const ty = lerp(startTrailY, headY - 16, t * 0.88);
    const tr = lerp(22, 8, t);

    noStroke();
    fill(235, 165, 85, alpha);
    ellipse(tx, ty, tr + 4, tr + 4);
    fill(22, 27, 38, alpha);
    ellipse(tx, ty, tr, tr);
  }

  noStroke();
  fill(248, 245, 238, alpha);
  textAlign(LEFT, CENTER);
  textSize(18);
  textStyle(ITALIC);
  text('"' + houseMessage + '"', bx + 22, by + 12, bw - 44, bh - 24);
  pop();
}

// --- CENTER: CANADIAN URBAN STOREFRONT ---
function drawCanadianUrbanMarket(isNight) {
  const sx = SHOP_X - 160;
  const sy = GROUND_Y - 260;
  const sw = 320;
  const sh = 260;

  fill(132, 68, 62);
  stroke(88, 46, 42);
  strokeWeight(2);
  rect(sx, sy, sw, sh, 4, 4, 0, 0);

  noStroke();
  fill(185, 190, 198);
  rect(sx - 10, sy - 14, sw + 20, 18, 3);
  fill(242, 247, 252);
  rect(sx - 12, sy - 22, sw + 24, 10, 4);

  fill(isNight ? color(235, 200, 130, 170) : color(165, 192, 214));
  rect(sx + 36, sy + 28, 56, 54, 3);
  rect(sx + 132, sy + 28, 56, 54, 3);
  rect(sx + 228, sy + 28, 56, 54, 3);

  const stripes = 8;
  const stripeW = (sw + 20) / stripes;
  for (let i = 0; i < stripes; i++) {
    fill(i % 2 === 0 ? color(42, 92, 74) : color(236, 238, 242));
    rect(sx - 10 + i * stripeW, sy + 102, stripeW, 32, 2);
  }
  fill(242, 247, 252);
  rect(sx - 10, sy + 95, sw + 20, 8, 3);

  fill(245, 224, 168, isNight ? 225 : 195);
  stroke(52, 58, 68);
  strokeWeight(3);
  rect(sx + 26, sy + 146, 176, 88, 3);

  fill(185, 215, 232);
  rect(sx + 224, sy + 146, 66, 114, 3, 3, 0, 0);
  noStroke();

  fill(155, 118, 82);
  rect(sx + 40, sy + 190, 148, 9);
  fill(110, 185, 115);
  ellipse(sx + 66, sy + 180, 24, 18);
  fill(235, 130, 75);
  rect(sx + 98, sy + 168, 28, 22, 2);
  fill(85, 145, 210);
  rect(sx + 140, sy + 166, 30, 24, 3);
}

// --- UNDERGROUND PIPE SYSTEM ---
function drawUndergroundPipeSystem() {
  const startX = SHOP_X;
  const endX = MONOLITH_X;
  const pipeY = GROUND_Y + 62;

  stroke(58, 64, 76);
  strokeWeight(28);
  line(startX, GROUND_Y - 6, startX, pipeY);
  line(startX, pipeY, endX, pipeY);
  line(endX, pipeY, endX, GROUND_Y - 6);

  stroke(24, 27, 35);
  strokeWeight(16);
  line(startX, GROUND_Y - 6, startX, pipeY);
  line(startX, pipeY, endX, pipeY);
  line(endX, pipeY, endX, GROUND_Y - 6);

  noStroke();
  for (let orb of pipeOrbs) {
    let ox, oy;
    if (orb.progress < 0.12) {
      const t = orb.progress / 0.12;
      ox = startX;
      oy = lerp(GROUND_Y - 6, pipeY, t);
    } else if (orb.progress < 0.88) {
      const t = (orb.progress - 0.12) / 0.76;
      ox = lerp(startX, endX, t);
      oy = pipeY + sin(t * TWO_PI * 3) * 2.5;
    } else {
      const t = (orb.progress - 0.88) / 0.12;
      ox = endX;
      oy = lerp(pipeY, GROUND_Y - 6, t);
    }

    fill(255, 215, 95, 95);
    ellipse(ox, oy, orb.isBig ? 38 : 26, orb.isBig ? 38 : 26);
    fill(255, 238, 140);
    ellipse(ox, oy, orb.isBig ? 20 : 14, orb.isBig ? 20 : 14);
  }
}

// --- RIGHT: CORPORATE MONOLITH TOWER ---
function drawMonolithTower() {
  const cw = 240;
  const ch = 630;
  const cx = MONOLITH_X - cw / 2;
  const cy = GROUND_Y - ch;

  noFill();
  for (let ring of towerPulseRings) {
    stroke(255, 218, 105, ring.alpha);
    strokeWeight(ring.weight);
    ellipse(ring.x, ring.y, ring.radius * 2, ring.radius * 2.4);
  }

  noStroke();
  fill(255, 205, 85, monolithGlowLevel * 65 + towerFlashAlpha * 0.4);
  ellipse(MONOLITH_X, GROUND_Y - ch * 0.45, cw * 2.1, ch * 1.2);

  fill(28, 33, 44);
  stroke(lerpColor(color(72, 82, 102), color(255, 218, 110), towerFlashAlpha / 150));
  strokeWeight(2.5);
  rect(cx, cy, cw, ch, 6, 6, 0, 0);

  noStroke();
  fill(46, 54, 70);
  rect(cx + 38, cy - 32, cw - 76, 32, 4, 4, 0, 0);

  const innerPad = 14;
  const innerW = cw - innerPad * 2;
  const innerH = ch - 48;
  const glowH = innerH * monolithGlowLevel;

  fill(245, 192, 68, 210);
  rect(cx + innerPad, GROUND_Y - 12 - glowH, innerW, glowH, 4);

  fill(255, 245, 185, 230);
  rect(cx + innerPad, GROUND_Y - 14 - glowH, innerW, 5, 2);

  const cols = 4;
  const rows = 12;
  const winW = 35;
  const winH = 30;
  const gapX = (cw - cols * winW) / (cols + 1);
  const gapY = 16;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const wx = cx + gapX + c * (winW + gapX);
      const wy = cy + 40 + r * (winH + gapY);
      const isLit = wy > (GROUND_Y - 12 - glowH);
      fill(isLit ? color(255, 238, 165, 240) : color(48, 56, 74, 165));
      rect(wx, wy, winW, winH, 2.5);
    }
  }

  for (let sp of towerSparkles) {
    fill(255, 238, 150, sp.alpha);
    ellipse(sp.x, sp.y, sp.size, sp.size);
  }

  fill(255, 224, 115);
  textAlign(CENTER, CENTER);
  textSize(30);
  textStyle(BOLD);
  text("$" + displayedCorpProfit.toFixed(2) + "B", MONOLITH_X, cy - 64);
}

// --- CARNIVAL HIGH-STRIKER HAMMER BAR BESIDE THE TOWER ---
function drawCarnivalStrikerGauge() {
  const barW = 34;
  const barH = 540;
  const bx = STRIKER_X - barW / 2;
  const by = GROUND_Y - barH - 24;

  noStroke();
  fill(54, 62, 78);
  rect(STRIKER_X - 34, GROUND_Y - 24, 68, 24, 6, 6, 0, 0);

  fill(22, 26, 36);
  stroke(84, 96, 118);
  strokeWeight(2.5);
  rect(bx, by, barW, barH, 10);

  stroke(75, 86, 106);
  strokeWeight(1.5);
  for (let i = 1; i < 10; i++) {
    const ty = by + (barH / 10) * i;
    line(bx + 5, ty, bx + barW - 5, ty);
  }

  noStroke();
  const fillH = (barH - 12) * constrain(strikerLevel, 0, 1);
  if (fillH > 2) {
    const colLow = color(105, 195, 145);
    const colHigh = color(255, 205, 65);
    fill(lerpColor(colLow, colHigh, strikerLevel));
    rect(bx + 5, by + barH - 6 - fillH, barW - 10, fillH, 6);

    fill(255, 248, 210);
    rect(bx + 3, by + barH - 10 - fillH, barW - 6, 8, 4);
  }

  const bellY = by - 26;
  const bellShake = bellRingTimer > 0 ? sin(frameCount * 0.9) * 5 : 0;

  if (bellRingTimer > 0) {
    fill(255, 215, 85, map(bellRingTimer, 0, 95, 0, 160));
    ellipse(STRIKER_X + bellShake, bellY, 74, 74);
  }

  fill(bellRingTimer > 0 ? color(255, 224, 95) : color(115, 126, 148));
  stroke(42, 48, 60);
  strokeWeight(2);
  arc(STRIKER_X + bellShake, bellY + 8, 44, 42, PI, TWO_PI, CHORD);
  ellipse(STRIKER_X + bellShake, bellY + 10, 12, 12);
  noStroke();
}

// --- PROTAGONIST (CROSSED ARMS ONLY WHEN clothingTier < 2) ---
function drawProtagonist() {
  if (routineState === "RESTING_NIGHT") return;

  push();
  translate(person.x, person.y);
  scale(person.facing * 1.18, 1.18);

  const bob = abs(sin(person.walkCycle)) * 3.5;
  const legSwing = sin(person.walkCycle) * 11;

  let shiverAmp = 1.25;
  let hunchAngle = 0.14;
  if (clothingTier === 1) {
    shiverAmp = 0.45;
    hunchAngle = 0.06;
  } else if (clothingTier >= 2) {
    shiverAmp = 0.0;
    hunchAngle = 0.0;
  }

  const shiverX = sin(frameCount * 0.36) * shiverAmp;
  translate(shiverX, 0);

  stroke(clothingTier >= 1 ? color(44, 52, 68) : color(198, 158, 130));
  strokeWeight(6.5);
  line(0, -38 - bob, -legSwing, 0);
  line(0, -38 - bob, legSwing, 0);

  push();
  translate(0, -38 - bob);
  rotate(hunchAngle);

  noStroke();
  if (clothingTier === 0) {
    fill(228, 230, 235);
    rect(-11, -38, 22, 34, 5);
    fill(65, 75, 92);
    rect(-11, -6, 22, 12, 2);
  } else if (clothingTier === 1) {
    fill(74, 134, 194);
    rect(-13, -40, 26, 44, 7);
  } else {
    fill(46, 108, 92);
    rect(-15, -43, 30, 47, 8);
    fill(215, 82, 74);
    rect(-13, -45, 26, 8, 3);
  }

  if (!person.carryingItem && clothingTier < 2) {
    const sleeveCol = clothingTier === 0
      ? color(198, 158, 130)
      : color(56, 110, 168);
    stroke(sleeveCol);
    strokeWeight(5.5);
    line(-2, -31, 8, -21);
    line(8, -21, -7, -18);
    line(4, -29, 12, -23);
    line(12, -23, -2, -22);
    noStroke();
  }

  noStroke();
  fill(222, 178, 146);
  ellipse(0, -55, 24, 24);

  if (clothingTier >= 2) {
    fill(215, 82, 74);
    arc(0, -59, 26, 24, PI, TWO_PI);
    ellipse(0, -72, 9, 9);
  } else {
    fill(38, 32, 30);
    arc(0, -58, 25, 22, PI, TWO_PI);
  }

  if (person.carryingItem) {
    fill(person.carryingItem.color[0], person.carryingItem.color[1], person.carryingItem.color[2]);
    rect(12, -18, 20, 22, 4);
  }

  pop();
  pop();
}

function drawSnowfall() {
  noStroke();
  fill(245, 250, 255, 195);
  for (let sf of snowflakes) {
    sf.y += sf.speedY;
    sf.x += sin(frameCount * 0.015 + sf.drift) * 0.65;
    if (sf.y > GROUND_Y) {
      sf.y = -10;
      sf.x = random(BASE_W);
    }
    ellipse(sf.x, sf.y, sf.r, sf.r);
  }
}

// --- TOP HEADER (PROFILE BADGE + DUAL RESTART BUTTONS: RESTART & MAIN MENU) ---
function drawTopAllocationHeader() {
  fill(18, 22, 30, 220);
  noStroke();
  rect(0, 0, BASE_W, 88);

  const effectiveInf = getEffectiveInflationPercent(dayCount);

  fill(242);
  textAlign(LEFT, CENTER);
  textSize(19);
  textStyle(BOLD);
  text("CANADA · +" + effectiveInf + "% INFLATION", 42, 42);

  fill(165, 178, 195);
  textSize(14);
  textStyle(NORMAL);
  text("ALLOCATION:", 335, 42);

  fill(remainingBudget > 400 ? color(110, 225, 155) : color(245, 95, 88));
  textSize(25);
  textStyle(BOLD);
  text("$" + remainingBudget.toLocaleString(), 440, 42);

  const hBarX = 610;
  const hBarY = 20;
  const hBarW = 260;
  const hBarH = 28;
  const pct = Math.max(0, Math.round(survivalBarLevel * 100));

  fill(38, 44, 56);
  stroke(68, 76, 94);
  strokeWeight(1.5);
  rect(hBarX, hBarY, hBarW, hBarH, 7);

  noStroke();
  const barCol = survivalBarLevel > 0.45
    ? color(110, 215, 145)
    : (survivalBarLevel > 0.22 ? color(245, 185, 65) : color(245, 78, 72));
  fill(barCol);
  rect(hBarX + 2, hBarY + 2, (hBarW - 4) * constrain(survivalBarLevel, 0, 1), hBarH - 4, 5);

  fill(14, 18, 26);
  textAlign(CENTER, CENTER);
  textSize(15);
  textStyle(BOLD);
  text(pct + "%", hBarX + hBarW / 2, hBarY + hBarH / 2 + 1);

  fill(155, 168, 188);
  textSize(12);
  textStyle(BOLD);
  text("SURVIVAL", hBarX + hBarW / 2, hBarY + hBarH + 13);

  textAlign(LEFT, CENTER);
  fill(195, 206, 220);
  textSize(19);
  textStyle(BOLD);
  text("DAY " + dayCount + " / " + MONTH_LENGTH, 920, 42);

  // Player Profile Badge (Entered Name or ANONYMOUS)
  const profX = 1085;
  const profW = 360;
  const profH = 40;
  const profY = 22;

  fill(28, 34, 46);
  stroke(72, 84, 106);
  strokeWeight(1.5);
  rect(profX, profY, profW, profH, 8);

  noStroke();
  fill(playerProfileName === "ANONYMOUS" ? color(170, 184, 204) : color(240, 198, 98));
  textAlign(CENTER, CENTER);
  textSize(15);
  textStyle(BOLD);
  text(playerProfileName, profX + profW / 2, profY + profH / 2);

  // Two Buttons: RESTART (Day 1) & MAIN MENU (Welcome Screen)
  const m = getLogicalMouse();

  const b1x = BASE_W - 396;
  const b1y = 22;
  const b1w = 172;
  const b1h = 40;
  const h1 = m.x >= b1x && m.x <= b1x + b1w && m.y >= b1y && m.y <= b1y + b1h;

  fill(h1 ? color(64, 72, 88) : color(36, 42, 54));
  rect(b1x, b1y, b1w, b1h, 8);
  fill(230);
  textSize(13);
  textAlign(CENTER, CENTER);
  text("RESTART", b1x + b1w / 2, b1y + b1h / 2);

  const b2x = BASE_W - 210;
  const b2y = 22;
  const b2w = 166;
  const b2h = 40;
  const h2 = m.x >= b2x && m.x <= b2x + b2w && m.y >= b2y && m.y <= b2y + b2h;

  fill(h2 ? color(64, 72, 88) : color(36, 42, 54));
  rect(b2x, b2y, b2w, b2h, 8);
  fill(230);
  textSize(13);
  textAlign(CENTER, CENTER);
  text("MAIN MENU", b2x + b2w / 2, b2y + b2h / 2);
}

// ============================================================================
// CORPORATE MARKETING POP-UP (EXACT 1:1 SCALED VERSION OF SMALL DOCKED CARD)
// ============================================================================
function drawCorporateMarketingPopup() {
  const item = marketingAd.item;
  if (!item) return;

  const rx = marketingAd.curX;
  const ry = marketingAd.curY;
  const rw = marketingAd.curW;
  const rh = marketingAd.curH;

  const sx = rw / 450;
  const sy = rh / 222;

  const price = getInflatedPrice(item.basePrice, dayCount);
  const canAfford = remainingBudget >= price;
  const m = getLogicalMouse();
  const hovered = m.x >= rx && m.x <= rx + rw && m.y >= ry && m.y <= ry + rh;

  push();
  translate(rx, ry);
  scale(sx, sy);

  const isSplash = marketingAd.age <= 75;
  const flashFast = isSplash ? (sin(frameCount * 0.45) > 0) : false;

  if (isSplash) {
    noStroke();
    fill(255, 195, 55, flashFast ? 95 : 35);
    rect(-8, -8, 466, 238, 22);
  }

  fill(flashFast ? color(48, 28, 42, 252) : color(26, 22, 36, 250));
  stroke(flashFast ? color(255, 235, 110) : color(255, 185, 65));
  strokeWeight(hovered && canAfford ? 3.5 : 2.5);
  rect(0, 0, 450, 222, 16);

  noStroke();
  fill(flashFast ? color(255, 95, 70) : color(230, 68, 68));
  rect(18, 14, 190, 24, 6);
  fill(255);
  textAlign(CENTER, CENTER);
  textSize(11.5);
  textStyle(BOLD);
  text("SPONSORED · FLASH SALE", 18 + 95, 26);

  fill(200, 210, 225);
  textSize(18);
  text("✕", 450 - 24, 26);

  textAlign(LEFT, TOP);
  fill(255, 224, 105);
  textSize(14.5);
  textStyle(BOLD);
  text(marketingAd.headline, 18, 50);

  fill(250);
  textSize(20);
  text(item.label + " — $" + price.toLocaleString(), 18, 78);

  fill(210, 218, 232);
  textSize(13.5);
  textStyle(NORMAL);
  text(marketingAd.subline, 18, 114);

  fill(canAfford ? (flashFast ? color(255, 230, 110) : color(255, 202, 72)) : color(80, 84, 94));
  rect(18, 168, 414, 38, 8);
  fill(canAfford ? 20 : 185);
  textAlign(CENTER, CENTER);
  textSize(13.5);
  textStyle(BOLD);
  text(canAfford ? "CLAIM OFFER NOW →" : "INSUFFICIENT FUNDS", 225, 187);
  pop();
}

// ============================================================================
// LARGE SHOP MODAL
// ============================================================================
function drawLargeShopOverlay() {
  fill(10, 13, 18, 95);
  noStroke();
  rect(0, 88, BASE_W, BASE_H - 88);

  const cardW = 1380;
  const cardH = 710;
  const cx = 56;
  const cy = 104;

  fill(20, 24, 34, 244);
  stroke(92, 104, 126);
  strokeWeight(3);
  rect(cx, cy, cardW, cardH, 22);

  const m = getLogicalMouse();

  if (shopMenuView === "MAIN") {
    drawMainShopGrid(cx, cy, cardW, cardH, m);
  } else if (shopMenuView === "FOOD") {
    drawSubMenuGrid(cx, cy, cardW, cardH, m, "FOOD & GROCERIES — CHOOSE ONE ITEM", FOOD_SUB_ITEMS, "FOOD");
  } else if (shopMenuView === "CLOTHING") {
    drawSubMenuGrid(cx, cy, cardW, cardH, m, "CLOTHING & WINTER GEAR — CHOOSE ONE ITEM", CLOTHING_SUB_ITEMS, "CLOTHING");
  }
}

function drawMainShopGrid(cx, cy, cardW, cardH, m) {
  const effectiveInf = getEffectiveInflationPercent(dayCount);

  noStroke();
  fill(248);
  textAlign(CENTER, CENTER);
  textSize(32);
  textStyle(BOLD);
  text("SELECT ONE OPTION FOR TODAY", cx + cardW / 2, cy + 44);

  fill(170, 182, 200);
  textSize(19);
  textStyle(NORMAL);
  text("Compounded Inflation: +" + effectiveInf + "% · Remaining Allocation: $" + remainingBudget.toLocaleString(), cx + cardW / 2, cy + 82);

  const cols = 2;
  const btnW = 615;
  const btnH = 132;
  const gapX = 44;
  const gapY = 20;
  const gridStartX = cx + (cardW - (btnW * 2 + gapX)) / 2;
  const gridStartY = cy + 120;

  for (let i = 0; i < activeMainShopItems.length; i++) {
    const item = activeMainShopItems[i];
    const col = i % cols;
    const row = floor(i / cols);
    const bx = gridStartX + col * (btnW + gapX);
    const by = gridStartY + row * (btnH + gapY);

    const hovered = m.x >= bx && m.x <= bx + btnW && m.y >= by && m.y <= by + btnH;

    if (item.isSubMenu) {
      stroke(hovered ? color(110, 235, 165) : color(78, 92, 114));
      strokeWeight(3);
      fill(hovered ? color(36, 48, 62) : color(28, 35, 48));
      rect(bx, by, btnW, btnH, 16);

      noStroke();
      fill(item.color[0], item.color[1], item.color[2]);
      ellipse(bx + 54, by + btnH / 2, 48, 48);

      fill(252);
      textAlign(LEFT, TOP);
      textSize(28);
      textStyle(BOLD);
      text(item.label, bx + 98, by + 28);

      fill(120, 230, 165);
      textSize(18);
      textStyle(BOLD);
      text(item.tag, bx + 98, by + 72);
    } else {
      const price = getInflatedPrice(item.basePrice, dayCount);
      const canAfford = remainingBudget >= price;
      const isGreyedOut = item.purchased || !canAfford;

      if (item.purchased) {
        stroke(58, 86, 72);
        fill(24, 32, 30);
      } else if (!canAfford) {
        stroke(78, 82, 92);
        fill(32, 34, 40);
      } else {
        stroke(hovered ? color(245, 205, 105) : color(72, 82, 102));
        fill(hovered ? color(42, 50, 66) : color(28, 34, 46));
      }
      strokeWeight(3);
      rect(bx, by, btnW, btnH, 16);

      noStroke();
      fill(isGreyedOut ? color(110, 114, 122, 130) : color(item.color[0], item.color[1], item.color[2]));
      ellipse(bx + 54, by + btnH / 2, 48, 48);

      fill(isGreyedOut ? 130 : 252);
      textAlign(LEFT, TOP);
      textSize(26);
      textStyle(BOLD);
      text(item.label, bx + 98, by + 22);

      fill(isGreyedOut ? 115 : 175);
      textSize(17);
      textStyle(NORMAL);
      text("Base $" + item.basePrice + " · +" + effectiveInf + "% inflation", bx + 98, by + 58);

      textAlign(RIGHT, TOP);
      fill(item.purchased ? color(105, 195, 145) : (!canAfford ? color(140, 144, 152) : color(245, 205, 105)));
      textSize(31);
      textStyle(BOLD);
      text("$" + price.toLocaleString(), bx + btnW - 24, by + 24);

      if (!item.purchased && !canAfford) {
        fill(220, 72, 68, 235);
        rect(bx + 98, by + 90, btnW - 122, 28, 6);
        fill(255);
        textAlign(CENTER, CENTER);
        textSize(14);
        textStyle(BOLD);
        text("YOU CANNOT AFFORD IT", bx + 98 + (btnW - 122) / 2, by + 104);
      } else if (item.purchased) {
        fill(105, 195, 145);
        textAlign(RIGHT, TOP);
        textSize(17);
        text("ACQUIRED", bx + btnW - 24, by + 68);
      }
    }
  }

  const skipW = 500;
  const skipH = 54;
  const skipX = cx + (cardW - skipW) / 2;
  const skipY = cy + cardH - 74;
  const skipHover = m.x >= skipX && m.x <= skipX + skipW && m.y >= skipY && m.y <= skipY + skipH;

  fill(skipHover ? color(78, 88, 108) : color(46, 52, 68));
  noStroke();
  rect(skipX, skipY, skipW, skipH, 12);
  fill(235);
  textAlign(CENTER, CENTER);
  textSize(20);
  textStyle(BOLD);
  text("RETURN HOME EMPTY-HANDED →", cx + cardW / 2, skipY + skipH / 2);
}

function drawSubMenuGrid(cx, cy, cardW, cardH, m, titleText, itemsList, subType) {
  const effectiveInf = getEffectiveInflationPercent(dayCount);

  noStroke();
  fill(248);
  textAlign(CENTER, CENTER);
  textSize(30);
  textStyle(BOLD);
  text(titleText, cx + cardW / 2, cy + 44);

  fill(170, 182, 200);
  textSize(18);
  textStyle(NORMAL);
  text("Compounded Inflation: +" + effectiveInf + "% · Allocation: $" + remainingBudget.toLocaleString(), cx + cardW / 2, cy + 82);

  const cols = 2;
  const btnW = 615;
  const btnH = 104;
  const gapX = 44;
  const gapY = 16;
  const gridStartX = cx + (cardW - (btnW * 2 + gapX)) / 2;
  const gridStartY = cy + 116;

  for (let i = 0; i < itemsList.length; i++) {
    const item = itemsList[i];
    const col = i % cols;
    const row = floor(i / cols);
    const bx = gridStartX + col * (btnW + gapX);
    const by = gridStartY + row * (btnH + gapY);

    const price = getInflatedPrice(item.basePrice, dayCount);
    const canAfford = remainingBudget >= price;
    const hovered = m.x >= bx && m.x <= bx + btnW && m.y >= by && m.y <= by + btnH;

    if (!canAfford) {
      stroke(78, 82, 92);
      fill(32, 34, 40);
    } else {
      stroke(hovered ? color(115, 235, 165) : color(72, 82, 102));
      fill(hovered ? color(40, 50, 66) : color(28, 34, 46));
    }
    strokeWeight(3);
    rect(bx, by, btnW, btnH, 14);

    noStroke();
    fill(!canAfford ? color(110, 114, 122, 130) : color(item.color[0], item.color[1], item.color[2]));
    ellipse(bx + 46, by + btnH / 2, 40, 40);

    fill(!canAfford ? 130 : 252);
    textAlign(LEFT, TOP);
    textSize(24);
    textStyle(BOLD);
    text(item.label, bx + 86, by + 18);

    fill(!canAfford ? 115 : 175);
    textSize(15);
    textStyle(NORMAL);
    text("Base $" + item.basePrice + " · +" + effectiveInf + "% inflation", bx + 86, by + 50);

    textAlign(RIGHT, TOP);
    fill(!canAfford ? color(140, 144, 152) : color(245, 205, 105));
    textSize(29);
    textStyle(BOLD);
    text("$" + price.toLocaleString(), bx + btnW - 22, by + 20);

    if (!canAfford) {
      fill(220, 72, 68, 235);
      rect(bx + 86, by + 72, btnW - 108, 22, 5);
      fill(255);
      textAlign(CENTER, CENTER);
      textSize(13);
      textStyle(BOLD);
      text("YOU CANNOT AFFORD IT", bx + 86 + (btnW - 108) / 2, by + 83);
    }
  }

  const backW = 350;
  const backH = 50;
  const backX = cx + (cardW - backW) / 2;
  const backY = cy + cardH - 70;
  const backHover = m.x >= backX && m.x <= backX + backW && m.y >= backY && m.y <= backY + backH;

  fill(backHover ? color(78, 88, 108) : color(46, 52, 68));
  noStroke();
  rect(backX, backY, backW, backH, 12);
  fill(235);
  textAlign(CENTER, CENTER);
  textSize(19);
  textStyle(BOLD);
  text("← BACK TO ALL AISLES", cx + cardW / 2, backY + backH / 2);
}

// ============================================================================
// END STATE OVERLAYS (TWO BUTTONS: RESTART vs. MAIN MENU)
// ============================================================================
function drawGameOverOverlay() {
  fill(14, 18, 26, 236);
  noStroke();
  rect(0, 0, BASE_W, BASE_H);

  let eyebrowText = "";
  let headlineText = "";
  let subtextText = "";

  if (gameOverReason === "IMPULSE_TRAP") {
    eyebrowText = playerProfileName + " · DAY 30 COMPLETE · REMAINING ALLOCATION: $" + remainingBudget.toLocaleString() + " · TOWER PROFIT: $" + corpProfit.toFixed(2) + "B";
    headlineText = "YOU BOUGHT THE HYPE. YOU PAID WITH YOUR WINTER.";
    subtextText = "That flash-sale upgrade felt good for a moment, didn't it? The tower rang its bell, hit $" + corpProfit.toFixed(2) + "B, and left you freezing at the finish line.";
  } else if (gameOverReason === "NO_CLOTHING") {
    eyebrowText = playerProfileName + " · DAY 30 COMPLETE · REMAINING ALLOCATION: $" + remainingBudget.toLocaleString() + " · TOWER PROFIT: $" + corpProfit.toFixed(2) + "B";
    headlineText = "THIRTY DAYS OF SHIVERING WASN'T ENOUGH.";
    subtextText = "You hoarded every dollar you could, yet walked through a Canadian winter without a coat. Survival isn't just saving—it's knowing what keeps you alive.";
  } else {
    eyebrowText = playerProfileName + " · SURVIVAL DEPLETED: 0% · REMAINING ALLOCATION: $" + remainingBudget.toLocaleString();
    headlineText = "YOU HAD ENOUGH. YOU JUST CHOSE POORLY.";
    subtextText = "Four thousand dollars was plenty to survive the winter—if only you hadn't given in to comfort, cravings, or impulse. The tower thanks you for your lack of discipline.";
  }

  fill(240, 198, 98);
  textAlign(CENTER, CENTER);
  textSize(17);
  textStyle(BOLD);
  text(eyebrowText, BASE_W / 2, 330);

  fill(245, 247, 250);
  textSize(44);
  textStyle(BOLD);
  text(headlineText, BASE_W / 2, 398);

  fill(185, 196, 212);
  textSize(21);
  textStyle(NORMAL);
  rectMode(CENTER);
  text(subtextText, BASE_W / 2, 478, 1280, 90);
  rectMode(CORNER);

  drawDualEndActionButtons();
}

function drawSurvivedOverlay() {
  fill(14, 18, 26, 236);
  noStroke();
  rect(0, 0, BASE_W, BASE_H);

  fill(240, 198, 98);
  textAlign(CENTER, CENTER);
  textSize(17);
  textStyle(BOLD);
  text(playerProfileName + " · MONTH COMPLETE · REMAINING BUDGET: $" + remainingBudget.toLocaleString() + " · TOWER PROFIT: $" + corpProfit.toFixed(2) + "B", BASE_W / 2, 330);

  fill(245, 247, 250);
  textSize(44);
  textStyle(BOLD);
  text("SUB-OPTIMAL GROWTH — BARELY MEETING MINIMUMS.", BASE_W / 2, 398);

  fill(185, 196, 212);
  textSize(21);
  textStyle(NORMAL);
  rectMode(CENTER);
  text("You survived the 30-day winter on bare essentials, leaving corporate growth targets unfulfilled.", BASE_W / 2, 478, 1280, 90);
  rectMode(CORNER);

  drawDualEndActionButtons();
}

function drawDualEndActionButtons() {
  const m = getLogicalMouse();
  const bw = 320;
  const bh = 64;
  const gap = 36;
  const leftBx = BASE_W / 2 - bw - gap / 2;
  const rightBx = BASE_W / 2 + gap / 2;
  const by = 560;

  // Button 1: Restart (Day 1)
  const hLeft = m.x >= leftBx && m.x <= leftBx + bw && m.y >= by && m.y <= by + bh;
  fill(hLeft ? color(255, 218, 120) : color(240, 198, 98));
  rect(leftBx, by, bw, bh, 12);
  fill(20, 24, 30);
  textAlign(CENTER, CENTER);
  textSize(19);
  textStyle(BOLD);
  text("RESTART", leftBx + bw / 2, by + bh / 2);

  // Button 2: Main Menu (Welcome Page)
  const hRight = m.x >= rightBx && m.x <= rightBx + bw && m.y >= by && m.y <= by + bh;
  fill(hRight ? color(68, 78, 98) : color(42, 48, 62));
  stroke(92, 104, 128);
  strokeWeight(2);
  rect(rightBx, by, bw, bh, 12);
  noStroke();
  fill(240);
  textSize(19);
  textStyle(BOLD);
  text("MAIN MENU", rightBx + bw / 2, by + bh / 2);
}

// ============================================================================
// MOUSE INTERACTION
// ============================================================================
function mousePressed() {
  if (typeof initAudioEngine === "function") {
    initAudioEngine();
  }

  lastInteractionMillis = millis();
  const m = getLogicalMouse();

  if (gameState === "INTRO") {
    const baseBw = 330;
    const baseBh = 78;
    const baseBx = BASE_W / 2;
    const baseBy = 555;
    if (
      m.x >= baseBx - baseBw / 2 - 15 &&
      m.x <= baseBx + baseBw / 2 + 15 &&
      m.y >= baseBy - baseBh / 2 - 15 &&
      m.y <= baseBy + baseBh / 2 + 15
    ) {
      enteringNameMode = false;
      typedPlayerName = "";
      nameBlockedWarning = false;
      gameState = "PERSPECTIVE";
    }
  } else if (gameState === "PERSPECTIVE") {
    if (!enteringNameMode) {
      const cardW = 580;
      const cardH = 420;
      const gap = 64;
      const leftX = (BASE_W - (cardW * 2 + gap)) / 2;
      const rightX = leftX + cardW + gap;
      const cardY = 265;

      // Left Card -> Open Mouse Keypad
      if (m.x >= leftX && m.x <= leftX + cardW && m.y >= cardY && m.y <= cardY + cardH) {
        enteringNameMode = true;
        typedPlayerName = "";
        nameBlockedWarning = false;
        return;
      }

      // Right Card -> Straight to Game with ANONYMOUS
      if (m.x >= rightX && m.x <= rightX + cardW && m.y >= cardY && m.y <= cardY + cardH) {
        playerProfileName = "ANONYMOUS";
        enteringNameMode = false;
        restartFromFirstDayLoop();
        return;
      }
    } else {
      // Mouse-Only Keypad Hit Detection
      const panelW = 1040;
      const panelH = 740;
      const py = 215;

      const keyW = 78;
      const keyH = 66;
      const keyGap = 12;
      const keysStartY = py + 190;

      for (let r = 0; r < KEYPAD_ROWS.length; r++) {
        const rowKeys = KEYPAD_ROWS[r];
        const rowW = rowKeys.length * keyW + (rowKeys.length - 1) * keyGap;
        const rowStartX = (BASE_W - rowW) / 2;
        const ky = keysStartY + r * (keyH + 14);

        for (let c = 0; c < rowKeys.length; c++) {
          const kx = rowStartX + c * (keyW + keyGap);
          if (m.x >= kx && m.x <= kx + keyW && m.y >= ky && m.y <= ky + keyH) {
            if (typedPlayerName.length < 18) {
              typedPlayerName += rowKeys[c];
              nameBlockedWarning = containsRestrictedWord(typedPlayerName);
              if (typeof triggerKeypadClickSound === "function") triggerKeypadClickSound();
            }
            return;
          }
        }
      }

      // Utility Row: CLEAR | SPACE | DELETE
      const utilY = keysStartY + 3 * (keyH + 14);
      const utilGap = 16;
      const clearW = 180;
      const spaceW = 360;
      const backW = 210;
      const totalUtilW = clearW + spaceW + backW + utilGap * 2;
      const utilStartX = (BASE_W - totalUtilW) / 2;

      if (m.x >= utilStartX && m.x <= utilStartX + clearW && m.y >= utilY && m.y <= utilY + keyH) {
        typedPlayerName = "";
        nameBlockedWarning = false;
        if (typeof triggerKeypadClickSound === "function") triggerKeypadClickSound();
        return;
      }

      const spaceX = utilStartX + clearW + utilGap;
      if (m.x >= spaceX && m.x <= spaceX + spaceW && m.y >= utilY && m.y <= utilY + keyH) {
        if (typedPlayerName.length > 0 && typedPlayerName.length < 18 && !typedPlayerName.endsWith(" ")) {
          typedPlayerName += " ";
          if (typeof triggerKeypadClickSound === "function") triggerKeypadClickSound();
        }
        return;
      }

      const backX = spaceX + spaceW + utilGap;
      if (m.x >= backX && m.x <= backX + backW && m.y >= utilY && m.y <= utilY + keyH) {
        typedPlayerName = typedPlayerName.slice(0, -1);
        nameBlockedWarning = containsRestrictedWord(typedPlayerName);
        if (typeof triggerKeypadClickSound === "function") triggerKeypadClickSound();
        return;
      }

      // Bottom Actions: BACK | START
      const actY = py + panelH - 96;
      const backOptW = 280;
      const startW = 420;
      const actGap = 28;
      const actStartX = (BASE_W - (backOptW + startW + actGap)) / 2;

      if (m.x >= actStartX && m.x <= actStartX + backOptW && m.y >= actY && m.y <= actY + 62) {
        enteringNameMode = false;
        nameBlockedWarning = false;
        return;
      }

      const startX = actStartX + backOptW + actGap;
      if (m.x >= startX && m.x <= startX + startW && m.y >= actY && m.y <= actY + 62) {
        const cleaned = typedPlayerName.trim();
        if (containsRestrictedWord(cleaned)) {
          nameBlockedWarning = true;
          return;
        }
        playerProfileName = cleaned.length > 0 ? cleaned.toUpperCase() : "ANONYMOUS";
        enteringNameMode = false;
        restartFromFirstDayLoop();
        return;
      }
    }
  } else if (gameState === "PLAY") {
    // Top Header Button 1: RESTART (Day 1)
    const b1x = BASE_W - 396;
    const b1y = 22;
    const b1w = 172;
    const b1h = 40;
    if (m.x >= b1x && m.x <= b1x + b1w && m.y >= b1y && m.y <= b1y + b1h) {
      restartFromFirstDayLoop();
      return;
    }

    // Top Header Button 2: MAIN MENU (Welcome Page)
    const b2x = BASE_W - 210;
    const b2y = 22;
    const b2w = 166;
    const b2h = 40;
    if (m.x >= b2x && m.x <= b2x + b2w && m.y >= b2y && m.y <= b2y + b2h) {
      returnToMainWelcomePage();
      return;
    }

    if (routineState === "AT_SHOP") {
      if (marketingAd.active) {
        const rx = marketingAd.curX;
        const ry = marketingAd.curY;
        const rw = marketingAd.curW;
        const rh = marketingAd.curH;
        const sx = rw / 450;
        const sy = rh / 222;

        if (m.x >= rx && m.x <= rx + rw && m.y >= ry && m.y <= ry + rh) {
          if (m.x >= rx + rw - 48 * sx && m.y <= ry + 48 * sy) {
            marketingAd.active = false;
            return;
          }
          const item = marketingAd.item;
          const price = getInflatedPrice(item.basePrice, dayCount);
          if (remainingBudget >= price) {
            marketingAd.active = false;
            completePurchase(item, price, "AD_IMPULSE");
          }
          return;
        }
      }

      const cardW = 1380;
      const cardH = 710;
      const cx = 56;
      const cy = 104;

      if (shopMenuView === "MAIN") {
        const cols = 2;
        const btnW = 615;
        const btnH = 132;
        const gapX = 44;
        const gapY = 20;
        const gridStartX = cx + (cardW - (btnW * 2 + gapX)) / 2;
        const gridStartY = cy + 120;

        for (let i = 0; i < activeMainShopItems.length; i++) {
          const item = activeMainShopItems[i];
          const col = i % cols;
          const row = floor(i / cols);
          const bx = gridStartX + col * (btnW + gapX);
          const by = gridStartY + row * (btnH + gapY);

          if (m.x >= bx && m.x <= bx + btnW && m.y >= by && m.y <= by + btnH) {
            if (item.isSubMenu) {
              shopMenuView = item.subMenuType;
              return;
            }

            const price = getInflatedPrice(item.basePrice, dayCount);
            if (!item.purchased && remainingBudget >= price) {
              completePurchase(item, price, "MAIN");
            }
            return;
          }
        }

        const skipW = 500;
        const skipH = 54;
        const skipX = cx + (cardW - skipW) / 2;
        const skipY = cy + cardH - 74;
        if (m.x >= skipX && m.x <= skipX + skipW && m.y >= skipY && m.y <= skipY + skipH) {
          person.carryingItem = null;
          marketingAd.active = false;
          routineState = "GOING_HOME";
          return;
        }
      } else {
        const itemsList = shopMenuView === "FOOD" ? FOOD_SUB_ITEMS : CLOTHING_SUB_ITEMS;
        const cols = 2;
        const btnW = 615;
        const btnH = 104;
        const gapX = 44;
        const gapY = 16;
        const gridStartX = cx + (cardW - (btnW * 2 + gapX)) / 2;
        const gridStartY = cy + 116;

        for (let i = 0; i < itemsList.length; i++) {
          const item = itemsList[i];
          const col = i % cols;
          const row = floor(i / cols);
          const bx = gridStartX + col * (btnW + gapX);
          const by = gridStartY + row * (btnH + gapY);

          if (m.x >= bx && m.x <= bx + btnW && m.y >= by && m.y <= by + btnH) {
            const price = getInflatedPrice(item.basePrice, dayCount);
            if (remainingBudget >= price) {
              completePurchase(item, price, shopMenuView);
            }
            return;
          }
        }

        const backW = 350;
        const backH = 50;
        const backX = cx + (cardW - backW) / 2;
        const backY = cy + cardH - 70;
        if (m.x >= backX && m.x <= backX + backW && m.y >= backY && m.y <= backY + backH) {
          shopMenuView = "MAIN";
          return;
        }
      }
    }
  } else if (gameState === "GAMEOVER" || gameState === "SURVIVED") {
    const bw = 320;
    const bh = 64;
    const gap = 36;
    const leftBx = BASE_W / 2 - bw - gap / 2;
    const rightBx = BASE_W / 2 + gap / 2;
    const by = 560;

    // Button 1: Restart (Day 1)
    if (m.x >= leftBx && m.x <= leftBx + bw && m.y >= by && m.y <= by + bh) {
      restartFromFirstDayLoop();
      return;
    }

    // Button 2: Main Menu (Welcome Page)
    if (m.x >= rightBx && m.x <= rightBx + bw && m.y >= by && m.y <= by + bh) {
      returnToMainWelcomePage();
      return;
    }
  }
}

function completePurchase(item, price, sourceMenu) {
  remainingBudget -= price;
  if (!item.repeatable && sourceMenu === "MAIN") {
    item.purchased = true;
  }
  person.carryingItem = item;
  marketingAd.active = false;

  if (!item.isCore) {
    boughtNonEssentialTrap = true;
  }

  if (typeof triggerPurchaseSound === "function") {
    triggerPurchaseSound(!item.isCore);
  }

  if (sourceMenu === "FOOD") {
    survivalBarLevel = constrain(survivalBarLevel + item.barRestore, 0, 1);
  } else if (sourceMenu === "CLOTHING") {
    if (item.clothTier && item.clothTier > clothingTier) {
      clothingTier = item.clothTier;
    }
    survivalBarLevel = constrain(survivalBarLevel + item.barRestore, 0, 1);
  }

  const isBig = !item.isCore;
  const orbCount = isBig ? 14 : 4;
  for (let k = 0; k < orbCount; k++) {
    pipeOrbs.push({
      progress: -k * 0.055,
      glowGain: item.towerBoost / orbCount,
      profitSlice: item.profitJump / orbCount,
      isBig: isBig,
      strikerPeak: item.strikerPeak
    });
  }

  shopMenuView = "MAIN";
  routineState = "GOING_HOME";
}