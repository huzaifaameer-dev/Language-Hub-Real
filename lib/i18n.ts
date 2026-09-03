export type Lang = "en" | "ur";

/** A nested translation dictionary for one language. */
export type Dict = Record<string, string>;

/** English UI strings (source of truth). */
export const enDict: Dict = {
  // Navigation / layout
  "nav.home": "Home",
  "nav.journey": "Journey",
  "nav.about": "About",
  "nav.courses": "Courses",
  "nav.pricing": "Pricing",
  "nav.reviews": "Reviews",
  "nav.faq": "FAQ",
  "nav.team": "Team",
  "nav.blog": "Blog",
  "nav.placement": "Placement Test",
  "nav.bookDemo": "Book a Free Demo",
  "nav.signIn": "Sign in",
  "nav.signUp": "Sign up",

  // Hero
  "hero.eyebrow": "Hub of Language Excellence",
  "hero.headline.a": "Master",
  "hero.headline.english": "English",
  "hero.headline.b": "and speak with",
  "hero.headline.c": "confidence.",
  "hero.subtitle":
    "Learn to speak, score, and express yourself fluently through live, small-batch classes built around real conversation.",
  "hero.cta.primary": "Start Learning Today",
  "hero.cta.demo": "Book a Free Demo",
  "hero.trust": "Trusted by learners across Pakistan and beyond",

  // Stats
  "stats.students": "Students guided",
  "stats.years": "Years teaching",
  "stats.programmes": "Programmes",
  "stats.batches": "Daily batches",

  // Common
  "common.enroll": "Enroll",
  "common.apply": "Apply",
  "common.learnMore": "Learn more",
  "common.whyUs": "Why us",
  "common.freeDemo": "Free demo class",

  // About
  "about.eyebrow": "About the Academy",
  "about.title": "Beyond",
  "about.title2": "English.",
  "about.subtitle": "English is not an end in itself. At Language Hub it becomes a doorway to a broader life.",

  // Courses / Pricing
  "courses.eyebrow": "Our Programmes",
  "courses.title1": "Four ways to",
  "courses.title2": "move forward.",
  "courses.subtitle": "Every course is a proven path to real English fluency — built around small batches and personal attention.",
  "courses.apply": "Apply",
  "courses.details": "Details",
  "courses.seatsFilled": "Seats filled",
  "pricing.eyebrow": "Programmes & Fees",
  "pricing.title1": "Pick a path,",
  "pricing.title2": "start today",
  "pricing.subtitle": "Clear monthly fees, fixed schedules and small batches — so you know exactly what you are signing up for before you enroll.",
  "pricing.perMonth": "per month",
  "pricing.applyOnline": "Apply Online",
  "pricing.ask": "Ask a question",
  "pricing.fullDetails": "Full course details",
  "pricing.duration": "Duration",
  "pricing.schedule": "Schedule",
  "pricing.available": "seats available",
  "pricing.left": "Only",
  "pricing.left2": "seats left",
  "pricing.waitlist": "Waitlist — batch full",
  "pricing.batchFull": "batch full",

  // Reviews
  "reviews.eyebrow": "Student Voices",
  "reviews.title1": "Proven results,",
  "reviews.title2": "validated.",
  "reviews.subtitle": "Real learners, real progress — here is what our students say about their experience.",
  "reviews.allStories": "Read all success stories",

  // FAQ
  "faq.eyebrow": "Questions",
  "faq.title1": "Everything you",
  "faq.title2": "want to ask first",
  "faq.subtitle": "Still unsure about something? A short call with us helps you decide — no pressure, no pushy sales.",
  "faq.askWhatsApp": "Ask us on WhatsApp",

  // Footer
  "footer.explore": "Explore",
  "footer.support": "Support",
  "footer.startToday": "Start Today",
  "footer.blog": "Blog",
  "footer.successStories": "Success Stories",
  "footer.team": "Meet the Team",
  "footer.faq": "FAQ",
  "footer.contact": "Contact & Help",
  "footer.privacy": "Privacy",
  "footer.terms": "Terms",
  "footer.refunds": "Refunds",
  "footer.whatsapp": "WhatsApp the studio",
};

/** Urdu UI strings. */
export const urDict: Dict = {
  "nav.home": "ہوم",
  "nav.journey": "سفر",
  "nav.about": "ہمارے بارے میں",
  "nav.courses": "کورسز",
  "nav.pricing": "فیس",
  "nav.reviews": "تاثرات",
  "nav.faq": "سوالات",
  "nav.team": "ٹیم",
  "nav.blog": "بلاگ",
  "nav.placement": "لیول ٹیسٹ",
  "nav.bookDemo": "مفت ڈیمو بک کریں",
  "nav.signIn": "لاگ ان",
  "nav.signUp": "رجسٹر کریں",

  "hero.eyebrow": "زبان کی عمدگی کا مرکز",
  "hero.headline.a": "انگریزی",
  "hero.headline.english": "سیکھیں",
  "hero.headline.b": "اور",
  "hero.headline.c": "اعتماد سے بولیں۔",
  "hero.subtitle":
    "لائیو، چھوٹی کلاسوں کے ذریعے روانی سے بولیں، نمبر حاصل کریں اور اظہار کریں۔",
  "hero.cta.primary": "آج ہی سیکھنا شروع کریں",
  "hero.cta.demo": "مفت ڈیمو بک کریں",
  "hero.trust": "پاکستان بھر کے سیکھنے والوں کا اعتماد",

  "stats.students": "طلبا کی رہنمائی",
  "stats.years": "سال تدریس",
  "stats.programmes": "پروگرام",
  "stats.batches": "روزانہ بیچ",

  "common.enroll": "داخلہ لیں",
  "common.apply": "درخواست دیں",
  "common.learnMore": "مزید جانیں",
  "common.whyUs": "ہم کیوں",
  "common.freeDemo": "مفت ڈیمو کلاس",

  // About
  "about.eyebrow": "اکیڈمی کے بارے میں",
  "about.title": "انگریزی سے",
  "about.title2": "آگے۔",
  "about.subtitle": "انگریزی اپنے آپ میں مقصد نہیں — لینگویج ہب پر یہ وسیع تر زندگی کا دروازہ بن جاتی ہے۔",

  // Courses / Pricing
  "courses.eyebrow": "ہمارے پروگرام",
  "courses.title1": "آگے بڑھنے کے",
  "courses.title2": "چار راستے۔",
  "courses.subtitle": "ہر کورس اصلی انگریزی روانی کا ثابت شدہ راستہ ہے — چھوٹی کلاسوں اور انفرادی توجہ کے ساتھ۔",
  "courses.apply": "درخواست دیں",
  "courses.details": "تفصیلات",
  "courses.seatsFilled": "سیٹیں بھری ہوئیں",
  "pricing.eyebrow": "پروگرام اور فیس",
  "pricing.title1": "راستہ چنیں،",
  "pricing.title2": "آج شروع کریں",
  "pricing.subtitle": "صاف ماہانہ فیس، مقررہ اوقات اور چھوٹی کلاسیں — تاکہ شروع سے پتہ ہو کیا اہم ہے۔",
  "pricing.perMonth": "ماہانہ",
  "pricing.applyOnline": "آن لائن درخواست دیں",
  "pricing.ask": "سوال پوچھیں",
  "pricing.fullDetails": "مکمل کورس کی تفصیلات",
  "pricing.duration": "مدت",
  "pricing.schedule": "شیڈول",
  "pricing.available": "سیٹیں دستیاب",
  "pricing.left": "صرف",
  "pricing.left2": "سیٹیں باقی",
  "pricing.waitlist": "ویٹ لسٹ — بیچ مکمل",
  "pricing.batchFull": "بیچ مکمل",

  // Reviews
  "reviews.eyebrow": "طلبہ کی آواز",
  "reviews.title1": "ثابت شدہ نتائج،",
  "reviews.title2": "توثیق شدہ۔",
  "reviews.subtitle": "حقیقی سیکھنے والے، حقیقی ترقی — یہ ہے وہ جو ہمارے طلبہ کہتے ہیں۔",
  "reviews.allStories": "تمام کامیابی کی کہانیاں پڑھیں",

  // FAQ
  "faq.eyebrow": "سوالات",
  "faq.title1": "سب کچھ جو",
  "faq.title2": "پہلے پوچھنا چاہتے ہیں",
  "faq.subtitle": "پھر بھی کچھ شک ہو؟ ہمارے ساتھ ایک مختصر کال فیصلہ کرنے میں مدد کرتی ہے — بغیر دباؤ کے۔",
  "faq.askWhatsApp": "واٹس ایپ پر پوچھیں",

  // Footer
  "footer.explore": "دریافت کریں",
  "footer.support": "معاونت",
  "footer.startToday": "آج شروع کریں",
  "footer.blog": "بلاگ",
  "footer.successStories": "کامیابی کی کہانیاں",
  "footer.team": "ٹیم سے ملیں",
  "footer.faq": "سوالات",
  "footer.contact": "رابطہ اور مدد",
  "footer.privacy": "پرائیویسی",
  "footer.terms": "شرائط",
  "footer.refunds": "ریفنڈ",
  "footer.whatsapp": "اسٹوڈیو کو واٹس ایپ کریں",
};

export const DICTS: Record<Lang, Dict> = { en: enDict, ur: urDict };

/** URL/SEO helper — flip every dict prefix value and dir. */
export const RTL_LANGS: Lang[] = ["ur"];
