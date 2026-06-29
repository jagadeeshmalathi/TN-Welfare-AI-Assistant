import type { Lang, Scheme } from "@/types";

/** UI string table. Keys are English; each has an `en` and `ta` rendering. */
export const STRINGS = {
  appName: { en: "TN Schemes AI", ta: "தமிழ்நாடு திட்டங்கள் AI" },
  tagline: {
    en: "AI assistant for TN Government Schemes",
    ta: "தமிழ்நாடு அரசுத் திட்டங்களுக்கான AI உதவியாளர்",
  },
  responseLanguage: { en: "Response language", ta: "பதில் மொழி" },
  searchBreadth: { en: "Search breadth", ta: "தேடல் அகலம்" },
  searchBreadthHelp: {
    en: "Higher value searches more schemes (broader answers). Lower value gives tighter focus.",
    ta: "அதிக மதிப்பு அதிக திட்டங்களைத் தேடும் (பரந்த பதில்கள்). குறைந்த மதிப்பு கூர்மையான கவனம்.",
  },
  chatsCount: { en: "Chats", ta: "உரையாடல்கள்" },
  latestSources: { en: "Latest Sources", ta: "சமீபத்திய ஆதாரங்கள்" },
  clearChat: { en: "Clear Chat", ta: "உரையாடலை அழி" },
  badgeRag: { en: "RAG + FAISS", ta: "RAG + FAISS" },
  badgeGrounded: { en: "Grounded Answers", ta: "சான்றுபூர்வ பதில்கள்" },
  badgeCitations: { en: "Source Citations", ta: "ஆதார மேற்கோள்கள்" },
  askYourQuestion: { en: "Ask your question", ta: "உங்கள் கேள்வியைக் கேளுங்கள்" },
  quickKeywords: { en: "Quick Keywords", ta: "விரைவு முக்கியச் சொற்கள்" },
  domainWelfare: { en: "Welfare", ta: "நலன்" },
  domainAgriculture: { en: "Agriculture", ta: "வேளாண்மை" },
  domainLabel: { en: "Scheme category", ta: "திட்ட வகை" },
  createdBy: { en: "Created with Claude Code", ta: "Claude Code மூலம் உருவாக்கப்பட்டது" },
  welcome: { en: "Vanakkam", ta: "வணக்கம்" },
  heroTitle: {
    en: "Find the welfare schemes you deserve",
    ta: "உங்களுக்கு உரிய நலத் திட்டங்களைக் கண்டறியுங்கள்",
  },
  heroSub: {
    en: "Ask questions, check your eligibility, and browse official Tamil Nadu disability welfare schemes — in English or தமிழ்.",
    ta: "கேள்விகள் கேளுங்கள், தகுதியைச் சரிபார்க்கவும், அதிகாரப்பூர்வ தமிழ்நாடு மாற்றுத்திறனாளிகள் நலத் திட்டங்களை உலாவவும் — ஆங்கிலம் அல்லது தமிழில்.",
  },
  nav: {
    home: { en: "Home", ta: "முகப்பு" },
    chat: { en: "Chat", ta: "உரையாடல்" },
    eligibility: { en: "Eligibility", ta: "தகுதி" },
    browse: { en: "Browse", ta: "உலாவு" },
  },
  statSchemes: { en: "Official schemes", ta: "அதிகாரப்பூர்வ திட்டங்கள்" },
  statCategories: { en: "Categories", ta: "வகைகள்" },
  statFree: { en: "Free & offline", ta: "இலவசம் & ஆஃப்லைன்" },
  chatPlaceholder: {
    en: "Ask about any welfare scheme…",
    ta: "எந்த நலத் திட்டத்தைப் பற்றியும் கேளுங்கள்…",
  },
  chatEmpty: {
    en: "Ask me anything about Tamil Nadu disability welfare schemes.",
    ta: "தமிழ்நாடு மாற்றுத்திறனாளிகள் நலத் திட்டங்கள் பற்றி எதையும் கேளுங்கள்.",
  },
  send: { en: "Send", ta: "அனுப்பு" },
  source: { en: "Based on", ta: "ஆதாரம்" },
  checkEligibility: { en: "Check Eligibility", ta: "தகுதியைச் சரிபார்" },
  eligibilityIntro: {
    en: "Tell us a little about yourself and we'll rank the schemes that fit best.",
    ta: "உங்களைப் பற்றி சிறிது சொல்லுங்கள், பொருந்தும் திட்டங்களை வரிசைப்படுத்துவோம்.",
  },
  disabilityType: { en: "Disability type", ta: "ஊனத்தின் வகை" },
  disabilityPercent: { en: "Disability percentage", ta: "ஊனச் சதவீதம்" },
  age: { en: "Age", ta: "வயது" },
  purpose: { en: "I'm looking for help with", ta: "எதற்கு உதவி தேவை" },
  results: { en: "Matching schemes", ta: "பொருந்தும் திட்டங்கள்" },
  match: { en: "match", ta: "பொருத்தம்" },
  learnMore: { en: "Learn more", ta: "மேலும் அறிக" },
  searchPlaceholder: { en: "Search schemes…", ta: "திட்டங்களைத் தேடுங்கள்…" },
  allCategories: { en: "All categories", ta: "அனைத்து வகைகளும்" },
  benefit: { en: "Benefit", ta: "பயன்" },
  eligibility: { en: "Eligibility", ta: "தகுதி" },
  documents: { en: "Documents required", ta: "தேவையான ஆவணங்கள்" },
  howToApply: { en: "How to apply", ta: "விண்ணப்பிக்கும் முறை" },
  applyTo: { en: "Apply to", ta: "விண்ணப்பிக்க வேண்டிய இடம்" },
  applyNow: { en: "Official source", ta: "அதிகாரப்பூர்வ ஆதாரம்" },
  noResults: { en: "No schemes found.", ta: "திட்டங்கள் எதுவும் இல்லை." },
  offline: {
    en: "AI model offline — showing scheme data directly.",
    ta: "AI மாதிரி ஆஃப்லைனில் — திட்டத் தரவை நேரடியாகக் காட்டுகிறது.",
  },
} as const;

export function t(key: keyof typeof STRINGS, lang: Lang): string {
  const entry = STRINGS[key] as { en: string; ta: string };
  return entry[lang];
}

/** Disability + purpose option lists, kept bilingual for the dropdowns. */
export const DISABILITY_TYPES: { value: string; en: string; ta: string }[] = [
  { value: "physical", en: "Physical / Locomotor", ta: "உடல் / இயக்க ஊனம்" },
  { value: "visual", en: "Visual", ta: "பார்வை" },
  { value: "hearing", en: "Hearing", ta: "செவித்திறன்" },
  { value: "speech", en: "Speech", ta: "பேச்சு" },
  { value: "intellectual", en: "Intellectual", ta: "அறிவுசார்" },
  { value: "autism", en: "Autism", ta: "மன இறுக்கம்" },
  { value: "multiple", en: "Multiple", ta: "பல்வேறு" },
];

export const PURPOSES: { value: string; en: string; ta: string }[] = [
  { value: "financial", en: "Financial allowance", ta: "நிதி உதவித்தொகை" },
  { value: "education", en: "Education", ta: "கல்வி" },
  { value: "employment", en: "Employment / Business", ta: "வேலை / தொழில்" },
  { value: "marriage", en: "Marriage", ta: "திருமணம்" },
  { value: "travel", en: "Travel", ta: "பயணம்" },
  { value: "assistive_device", en: "Assistive devices", ta: "உதவிக் கருவிகள்" },
  { value: "rehabilitation", en: "Rehabilitation / Care", ta: "மறுவாழ்வு / பராமரிப்பு" },
  { value: "identification", en: "ID / Certificate", ta: "அடையாளம் / சான்றிதழ்" },
];

/* ---- Bilingual field accessors so components stay clean ---- */
export const schemeName = (s: Scheme, l: Lang) => (l === "ta" ? s.name_ta : s.name_en);
export const schemeSummary = (s: Scheme, l: Lang) =>
  l === "ta" ? s.summary_ta : s.summary_en;
export const schemeBenefit = (s: Scheme, l: Lang) =>
  l === "ta" ? s.benefit_ta : s.benefit_en;
export const schemeCategory = (s: Scheme, l: Lang) =>
  l === "ta" ? s.category_ta : s.category;
export const schemeEligibility = (s: Scheme, l: Lang) =>
  l === "ta" ? s.eligibility_ta : s.eligibility_en;
export const schemeHowTo = (s: Scheme, l: Lang) =>
  l === "ta" ? s.how_to_apply_ta : s.how_to_apply_en;
