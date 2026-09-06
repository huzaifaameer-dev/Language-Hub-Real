import type { GuideLang } from "@/lib/guide/persona";

const EN = {
  greet:
    "Assalam o alaikum! Welcome to Language Hub. I am Aina, your guide. I can tell you about our courses — Spoken English, IELTS, PTE and Duolingo — plus fees, batches, the placement test and how to sign up. Just talk to me, or type below. Want me to take you on a quick tour?",
  welcomBack:
    "Assalam o alaikum! Great to see you again. Ask me about any course, fee or the placement test.",
  courses:
    "We have four programmes. Spoken English is a four month conversation-first course. IELTS preparation runs three months with weekly mock tests. PTE preparation is computer-marked and lasts three months. And the Duolingo sprint is six weeks of short daily lessons. Which one interests you?",
  ielts:
    "IELTS preparation runs for three months across Listening, Reading, Writing and Speaking, with weekly mock tests and one-on-one speaking reviews. Students often improve by half a band to a full band. It has morning and weekend batches.",
  pte:
    "PTE is fully computer-based and AI-scored. Our three month course drills every question type with timed response practice, so test day feels routine. Batches run in the evening and on weekends.",
  det:
    "The Duolingo English Test is a fast adaptive test. Our six week sprint uses short daily lessons with writing and speaking feedback, and many students reach 110 or higher.",
  spoken:
    "Spoken English is our four month conversation-first course. You speak in every single session in a small batch, so the habit of translating in your head melts away quickly.",
  fee:
    "Fees depend on the course. Spoken English is eight thousand rupees a month, IELTS and PTE are twelve thousand, and the Duolingo sprint is six thousand. The full prices are on the pricing page.",
  placement:
    "Yes! We have a free placement test. It checks your level across twenty questions, and our AI gives you a personal study plan with a recommended course. You will find it in the placement test section.",
  signup:
    "Easy — tap Sign up, create your free account, choose your course and batch, and submit the application. You can track its status live in your dashboard.",
  demo:
    "Yes, we offer a free demo call. You can meet the teacher, see how a session runs, and decide before enrolling. The WhatsApp chat opens with one tap.",
  tour:
    "Let me show you around. There are four course cards, then the pricing with batch timings, the placement test, and the sign-up page at the end. Which part should I walk you through first?",
  thanks: "You are most welcome! Is there anything else I can help you with?",
  default:
    "I can help with our courses, fees, batches, the placement test, the free demo or how to sign up. What would you like to know?",
};

const UR = {
  greet:
    "السلام علیکم! لینگویج ہب میں خوش آمدید۔ میں آئینہ ہوں، آپ کی رہنما۔ میں آپ کو ہمارے کورسز کے بارے میں بتا سکتی ہوں — اسپوکن انگلش، آئی ایل ٹی ایس، پی ٹی ای اور ڈولنگو — فیس، بیچ، پلیسمنٹ ٹیسٹ اور سائن اپ کے بارے میں بھی۔ بس مجھ سے بولیں یا نیچے لکھیں۔ کیا آپ چاہیں گے کہ میں آپ کو ایک مختصر ٹور دکھاؤں؟",
  welcomBack:
    "السلام علیکم! آپ کو دوبارہ دیکھ کر خوشی ہوئی۔ کسی بھی کورس، فیس یا پلیسمنٹ ٹیسٹ کے بارے میں پوچھیں۔",
  courses:
    "ہمارے چار پروگرام ہیں۔ اسپوکن انگلش ایک چار ماہ کا گفتگو پر مبنی کورس ہے۔ آئی ایل ٹی ایس کی تیاری تین ماہ کی ہے جس میں ہر ہفتے مذاق امتحان ہوتا ہے۔ پی ٹی ای کی تیاری کمپیوٹر پر ہوتی ہے اور تین ماہ چلتی ہے۔ اور ڈولنگو کا کورس چھ ہفتے کا ہے جس میں روزانہ چھوٹے اسباق ہوتے ہیں۔ کون سا کورس آپ کے لیے دلچسپ ہے؟",
  ielts:
    "آئی ایل ٹی ایس کی تیاری تین ماہ چلتی ہے — سننا، پڑھنا، لکھنا اور بولنا — ہر ہفتے مذاق امتحان اور ذاتی اسپیکنگ فیدبیک کے ساتھ۔ طلبہ اکثر آدھا بینڈ یا پورا بینڈ بہتر کرتے ہیں۔ صبح اور ویک اینڈ بیچ دستیاب ہیں۔",
  pte:
    "پی ٹی ای مکمل طور پر کمپیوٹر پر اور AI سے اسکور ہوتا ہے۔ ہمارا تین ماہ کا کورس ہر سوال کی قسم کی مشق کرتا ہے، تاکہ امتحان کا دن معمول جیسا لگے۔ شام اور ویک اینڈ بیچ چلتے ہیں۔",
  det:
    "ڈولنگو انگلش ٹیسٹ ایک تیز ایڈپٹیو ٹیسٹ ہے۔ ہمارا چھ ہفتے کا کورس روزانہ چھوٹے اسباق اور تحریر و گفتگو پر فیدبیک دیتا ہے، اور بہت سے طلبہ 110 یا اس سے زیادہ اسکور کرتے ہیں۔",
  spoken:
    "اسپوکن انگلش ہمارا چار ماہ کا گفتگو پر مبنی کورس ہے۔ آپ ہر سبق میں بولتے ہیں، چھوٹے گروپ میں، تاکہ ذہن میں ترجمہ کرنے کی عادت جلدی ختم ہو جائے۔",
  fee:
    "فیس کورس پر منحصر ہے۔ اسپوکن انگلش آٹھ ہزار روپے ماہانہ، آئی ایل ٹی ایس اور پی ٹی ای بارہ ہزار، اور ڈولنگو کا کورس چھ ہزار روپے ماہانہ ہے۔ مکمل قیمتیں پرائسنگ والے حصے میں ہیں۔",
  placement:
    "جی ہاں! ہمارا پلیسمنٹ ٹیسٹ مفت ہے۔ یہ بیس سوالوں سے آپ کی لیول جانچتا ہے، اور ہماری AI آپ کو ذاتی اسٹڈی پلان کے ساتھ بہترین کورس تجویز کرتی ہے۔ یہ پلیسمنٹ ٹیسٹ والے حصے میں ہے۔",
  signup:
    "بہت آسان — سائن اپ پر ٹیپ کریں، مفت اکاؤنٹ بنائیں، اپنا کورس اور بیچ چنیں، اور درخواست جمع کریں۔ آپ اپنے ڈیش بورڈ میں اس کی حیثیت لائیو دیکھ سکتے ہیں۔",
  demo:
    "جی ہاں، ہم مفت ڈیمو کال دیتے ہیں۔ آپ ٹیچر سے مل سکتے ہیں، دیکھ سکتے ہیں کہ کلاس کیسے چلتی ہے، اور داخلے سے پہلے فیصلہ کر سکتے ہیں۔ واٹس ایپ چیٹ ایک ٹیپ پر کھلتی ہے۔",
  tour:
    "میں آپ کو سیر کراؤں۔ آئیے چار کورس کارڈ دیکھتے ہیں، پھر فیس اور بیچ کے اوقات، پھر پلیسمنٹ ٹیسٹ، اور آخر میں سائن اپ پیج۔ کون سا حصہ پہلے دیکھنا چاہیں گے؟",
  thanks: "خوش آمدید! کیا اور کچھ پوچھنا چاہیں گے؟",
  default:
    "میں ہمارے کورسز، فیس، بیچ، پلیسمنٹ ٹیسٹ، مفت ڈیمو یا سائن اپ کے بارے میں بتا سکتی ہوں۔ آپ کیا جاننا چاہیں گے؟",
};

/**
 * Deterministic offline guide (no AI key). Detects the visitor's intent from a
 * few keywords and returns a warm spoken reply in the active language.
 */
export function offlineGuideReply(question: string, lang: GuideLang): string {
  const t = lang === "ur" ? UR : EN;
  const q = question.toLowerCase();
  const has = (...words: string[]) => words.some((w) => q.includes(w));

  if (has("salam", "hello", "hi", "hey", "assalam", "ہیلو", "السلام")) return t.greet;
  if (has("ielts", "آئی ایل ٹی ایس")) return t.ielts;
  if (has("pte", "پی ٹی ای")) return t.pte;
  if (has("duolingo", "det", "ڈولنگو")) return t.det;
  if (has("spoken", "اسپوکن")) return t.spoken;
  if (has("tour", "guide", "start", "show me", "ٹور", "سیر", "راستہ")) return t.tour;
  if (has("placement", "test", "پلیسمنٹ", "لیول")) return t.placement;
  if (has("sign", "apply", "admission", "سائن اپ", "داخلہ", "درخواست")) return t.signup;
  if (has("demo", "whatsapp", "contact", "call", "ڈیمو", "واٹس ایپ")) return t.demo;
  if (has("fee", "price", "cost", "charge", "pricing", "کیفیت", "فیس", "قیمت", "kitna")) return t.fee;
  if (has("thank", "thanks", "شکریہ", "جزاک")) return t.thanks;
  if (has("course", "program", "classes", "کورس", "programme")) return t.courses;
  return t.default;
}

/** Speakable/scriptable copy used by the widget itself (greetings, welcome back). */
export function guideScripts(lang: GuideLang): {
  greeting: string;
  welcomeBack: string;
  quickTour: string;
} {
  return {
    greeting: lang === "ur" ? UR.greet : EN.greet,
    welcomeBack: lang === "ur" ? UR.welcomBack : EN.welcomBack,
    quickTour: lang === "ur" ? UR.tour : EN.tour,
  };
}