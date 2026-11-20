/**
 * First-boot seed for the Language Hub PostgreSQL database.
 *
 * Runs once (guarded by a settings row) and is fully idempotent:
 *   • catalogue seeded from the static fallback (the DB then owns it),
 *   • public testimonials + team profiles so the marketing site is never empty,
 *   • platform settings (academy details, live stats),
 *   • the owner/admin account from ADMIN_EMAIL + ADMIN_PASSWORD.
 *
 * Everything uses ON CONFLICT so re-running is safe.
 */

import crypto from "node:crypto";
import bcrypt from "bcryptjs";

import { FALLBACK_COURSES, courseSlug } from "@/lib/course-data";
import { FOUNDER } from "@/lib/content";

type Queryable = {
  query: <T>(sql: string, params?: unknown[]) => Promise<{ rows: T[] }>;
};

const uid = () => crypto.randomUUID();

const ACCENTS: Array<[string, string]> = [
  ["#0a4e43", "#14a08c"],
  ["#d9532f", "#fb6a47"],
  ["#0d5f52", "#1aa88f"],
  ["#a87400", "#d99a1a"],
];

const TESTIMONIALS = [
  {
    name: "Ayesha Khan",
    role: "IELTS Academic",
    course: "IELTS Exam Preparation",
    quote:
      "I walked in scared of speaking English and walked out with a Band 7.5. The small batches meant I actually spoke every single class.",
    outcome: "Band 7.5 · admitted to a UK university",
    rating: 5,
    featured: true,
  },
  {
    name: "Hamza Riaz",
    role: "PTE Academic",
    course: "PTE · GRE · Duolingo Preparation",
    quote:
      "The mock tests were brutal in the best way. By exam day nothing felt new — I scored 79 and got my Australian visa points.",
    outcome: "PTE 79 · Australian visa points secured",
    rating: 5,
    featured: true,
  },
  {
    name: "Fatima Noor",
    role: "Spoken English",
    course: "Spoken English",
    quote:
      "Three months ago I could not order coffee in English. Last week I led a client call at work. That is the difference this place made.",
    outcome: "Promoted to a client-facing role",
    rating: 5,
    featured: true,
  },
  {
    name: "Bilal Ahmed",
    role: "Writing & Communication",
    course: "Creative Writing",
    quote:
      "The writing feedback was personal, line by line. My emails are sharper, my reports are clearer, and my manager noticed within a month.",
    outcome: "Published his first short story",
    rating: 5,
    featured: false,
  },
  {
    name: "Zara Sheikh",
    role: "IELTS General",
    course: "IELTS Exam Preparation",
    quote:
      "Flexible evening batches let me study around a full-time job. I never once felt like just a roll number.",
    outcome: "Band 8.0 · PR application submitted",
    rating: 5,
    featured: false,
  },
  {
    name: "Usman Tariq",
    role: "Spoken English",
    course: "Spoken English",
    quote:
      "What changed everything was the conversation-first approach. Grammar came later, confidence came first — exactly the right order.",
    outcome: "Interviewed and hired at a multinational",
    rating: 5,
    featured: false,
  },
];

const TEAM = [
  {
    name: FOUNDER.name,
    role: "Founder & Head of Language Hub",
    headline: "Founder-led teaching, every single batch.",
    credentials: ["CELTA", "IELTS Specialist", "12+ years"],
    bio: Array.isArray(FOUNDER.bio) ? FOUNDER.bio.join(" ") : String(FOUNDER.bio),
    focus: ["Curriculum", "IELTS", "Teacher training"],
    ceo: true,
  },
  {
    name: "Sana Iqbal",
    role: "Senior IELTS & PTE Trainer",
    headline: "Band 8+ is a system, not luck.",
    credentials: ["IELTS 8.5", "PTE 90"],
    bio: "Sana has prepared over 400 students for IELTS and PTE, with a focus on writing task response and speaking fluency under exam pressure.",
    focus: ["IELTS Writing", "PTE Speaking", "Mock feedback"],
    ceo: false,
  },
  {
    name: "Adeel Hussain",
    role: "Spoken English & Fluency Coach",
    headline: "Confidence before perfection.",
    credentials: ["TESOL", "Accent training"],
    bio: "Adeel leads conversation-first batches built around real scenarios — interviews, client calls and everyday confidence — with pronunciation coaching that sticks.",
    focus: ["Conversation", "Pronunciation", "Interviews"],
    ceo: false,
  },
  {
    name: "Mariam Aslam",
    role: "Writing & Communication Lead",
    headline: "Clear writing is clear thinking.",
    credentials: ["MA English", "Editorial lead"],
    bio: "Mariam teaches professional writing, storytelling and academic structure, with line-by-line feedback that turns hesitant writers into confident ones.",
    focus: ["Creative writing", "Business writing", "Feedback"],
    ceo: false,
  },
];

export async function seedDatabase(db: Queryable): Promise<void> {
  /* ── catalogue ─────────────────────────────────────────────────────── */
  const courseCount = await db.query<{ n: number }>("SELECT COUNT(*)::INT AS n FROM courses");
  if ((courseCount.rows[0]?.n ?? 0) === 0) {
    for (let i = 0; i < FALLBACK_COURSES.length; i += 1) {
      const c = FALLBACK_COURSES[i];
      const slug = courseSlug(c.name);
      const [from, to] = ACCENTS[i % ACCENTS.length];
      await db.query(
        `INSERT INTO courses
           (id, slug, name, tagline, description, duration, schedule, teacher, fee,
            accent_from, accent_to, modules, outcomes, batches, active, sort_order)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12::jsonb,$13::jsonb,$14::jsonb,TRUE,$15)
         ON CONFLICT (slug) DO NOTHING`,
        [
          uid(),
          slug,
          c.name,
          c.tagline,
          c.description,
          c.duration,
          c.schedule,
          c.teacher,
          c.fee,
          from,
          to,
          JSON.stringify(c.modules ?? []),
          JSON.stringify(c.outcomes ?? []),
          JSON.stringify(c.batches ?? []),
          c.order,
        ]
      );

      // Chapters = syllabus topics (fallback to module titles) so the learner
      // dashboard has a concrete, tickable checklist from day one.
      const titles: string[] = [];
      for (const m of c.modules ?? []) {
        for (const t of m.topics ?? []) titles.push(t);
      }
      const fallbackTitles = (c.modules ?? []).map((m) => m.title);
      const chapterTitles = (titles.length ? titles : fallbackTitles).slice(0, 14);
      for (let k = 0; k < chapterTitles.length; k += 1) {
        await db.query(
          `INSERT INTO chapters (id, course_slug, title, sort_order)
           VALUES ($1,$2,$3,$4)
           ON CONFLICT (course_slug, title) DO NOTHING`,
          [uid(), slug, chapterTitles[k], k]
        );
      }
    }
  }

  /* ── public testimonials ───────────────────────────────────────────── */
  const tCount = await db.query<{ n: number }>("SELECT COUNT(*)::INT AS n FROM testimonials");
  if ((tCount.rows[0]?.n ?? 0) === 0) {
    for (let i = 0; i < TESTIMONIALS.length; i += 1) {
      const t = TESTIMONIALS[i];
      await db.query(
        `INSERT INTO testimonials
           (id, name, role, course, quote, outcome, rating, featured, active, sort_order)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,TRUE,$9)`,
        [uid(), t.name, t.role, t.course, t.quote, t.outcome, t.rating, t.featured, i]
      );
    }
  }

  /* ── team profiles ─────────────────────────────────────────────────── */
  const teamCount = await db.query<{ n: number }>("SELECT COUNT(*)::INT AS n FROM team_members");
  if ((teamCount.rows[0]?.n ?? 0) === 0) {
    for (let i = 0; i < TEAM.length; i += 1) {
      const m = TEAM[i];
      await db.query(
        `INSERT INTO team_members
           (id, name, role, headline, credentials, bio, focus, ceo, active, sort_order)
         VALUES ($1,$2,$3,$4,$5::jsonb,$6,$7::jsonb,$8,TRUE,$9)`,
        [
          uid(),
          m.name,
          m.role,
          m.headline,
          JSON.stringify(m.credentials),
          m.bio,
          JSON.stringify(m.focus),
          m.ceo,
          i,
        ]
      );
    }
  }

  /* ── journal (blog) ────────────────────────────────────────────────── */
  const postCount = await db.query<{ n: number }>("SELECT COUNT(*)::INT AS n FROM blog_posts");
  if ((postCount.rows[0]?.n ?? 0) === 0) {
    const now = Date.now();
    const JOURNAL: Array<{
      title: string;
      category: string;
      tags: string[];
      excerpt: string;
      content: string;
      read: number;
      days: number;
      featured: boolean;
    }> = [
      {
        title: "Five speaking habits that make you sound fluent",
        category: "Speaking",
        tags: ["fluency", "pronunciation", "habits"],
        excerpt:
          "Fluency is not speed. It is the confidence to finish a thought without apologising for it — and these five habits build exactly that.",
        read: 5,
        days: 2,
        featured: true,
        content: `
<p>Most learners think fluency arrives as one dramatic breakthrough. In our classrooms it arrives quietly, in five small habits that teachers notice before students do.</p>
<h2>1. Start with a full sentence, not a word</h2>
<p>When someone asks a question, resist the single-word reply. Even a short sentence gives your mouth and your ear a little more practice at real English rhythm.</p>
<p><strong>Try:</strong> instead of &ldquo;Yes,&rdquo; say, &ldquo;Yes, I did — and it went better than I expected.&rdquo;</p>
<h2>2. Use fillers that buy you time</h2>
<p>Every fluent speaker pauses. The trick is to pause <em>in English</em> — &ldquo;let me think,&rdquo; &ldquo;that&rsquo;s a good question,&rdquo; &ldquo;what I mean is&rdquo; — rather than freezing or slipping back into your first language.</p>
<h2>3. Record yourself once a week</h2>
<p>Two minutes on your phone, one topic, then listen back. You will hear one habit to keep and one to fix. That is more progress than an hour of silent reading.</p>
<blockquote>Speaking is a physical skill. You cannot read your way into it — you have to hear your own voice.</blockquote>
<h2>4. Steal whole phrases, not single words</h2>
<p>Keep a small list of phrases you actually want to use: &ldquo;I&rsquo;m not sure I follow,&rdquo; &ldquo;to be honest,&rdquo; &ldquo;that reminds me.&rdquo; Then use one in your next class, on purpose.</p>
<h2>5. Finish what you start</h2>
<p>The strongest habit of all: finish the sentence, even if the grammar wobbles. Correction is a teacher&rsquo;s job. Confidence is yours.</p>
<p>If you want to practise these with feedback in real time, our <a href="/courses">Spoken English batches</a> are built around exactly this loop.</p>
`.trim(),
      },
      {
        title: "IELTS Writing Task 2: the four-sentence plan that works",
        category: "IELTS",
        tags: ["ielts", "writing", "band descriptors"],
        excerpt:
          "Before you write a single sentence, build the skeleton. Four sentences of planning save twenty minutes of hesitation.",
        read: 6,
        days: 6,
        featured: false,
        content: `
<p>A high-scoring Task 2 answer is built before the introduction is written. Here is the four-sentence plan our exam classes use every week.</p>
<h2>Sentence one — the position</h2>
<p>State what you believe in plain words. Not &ldquo;there are many perspectives,&rdquo; but &ldquo;I believe schools should teach practical finance.&rdquo;</p>
<h2>Sentence two — the strongest reason</h2>
<p>Choose the reason you can support with a real example, not the most dramatic one.</p>
<h2>Sentence three — the example</h2>
<p>Make it specific: a country, a school, a number, a consequence. Specificity is what separates a 6.5 from a 7.5.</p>
<h2>Sentence four — the concession</h2>
<p>Acknowledge the other side in one line, then answer it. This is where &ldquo;coherence and cohesion&rdquo; is earned.</p>
<h3>What the examiner is looking for</h3>
<ul>
<li><strong>Task response:</strong> every paragraph answers the question that was asked.</li>
<li><strong>Cohesion:</strong> ideas connect logically — not just with &ldquo;moreover.&rdquo;</li>
<li><strong>Lexical resource:</strong> precise words, not rare ones.</li>
<li><strong>Grammar:</strong> a mix of complex sentences you can actually control.</li>
</ul>
<blockquote>Plan for five minutes. Write for thirty. Leave five to check articles, plurals and verb tense.</blockquote>
<p>Our <a href="/courses/ielts-general-academic">IELTS programme</a> marks every essay against the official band descriptors and returns it with a line-by-line rewrite.</p>
`.trim(),
      },
      {
        title: "Why small batches change everything",
        category: "Study Tips",
        tags: ["small batches", "confidence", "classroom"],
        excerpt:
          "In a room of twelve, there is nowhere to hide — and that is the point. A look at why we cap every class.",
        read: 4,
        days: 11,
        featured: false,
        content: `
<p>We cap every batch at twelve learners. It is the single decision that shapes how our classrooms feel.</p>
<h2>Speaking time is not a luxury</h2>
<p>In a class of thirty, a learner might speak for ninety seconds in an hour. In a class of twelve, that becomes six or seven minutes — every session, not once a week.</p>
<h2>Teachers can see the individual</h2>
<p>Small batches let a teacher remember that one student avoids past tense, or that another reads beautifully but freezes when asked to improvise. Those details are the whole job.</p>
<blockquote>You cannot coach a crowd. You coach a person.</blockquote>
<h2>Accountability without fear</h2>
<p>The first two weeks are uncomfortable for almost everyone. By week three, the silence has gone and the room starts to sound like a conversation rather than a lesson.</p>
<p>If that sounds like the room you want to learn in, <a href="/placement-test">take the free placement test</a> and we will suggest the right batch.</p>
`.trim(),
      },
    ];

    for (let i = 0; i < JOURNAL.length; i += 1) {
      const post = JOURNAL[i];
      const publishedAt = new Date(now - post.days * 86_400_000).toISOString();
      const slug = post.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 90);
      await db.query(
        `INSERT INTO blog_posts
           (id, slug, title, excerpt, content, category, tags, author, author_role,
            status, featured, read_minutes, published_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7::jsonb,$8,$9,'PUBLISHED',$10,$11,$12)
         ON CONFLICT (slug) DO NOTHING`,
        [
          uid(),
          slug,
          post.title,
          post.excerpt,
          post.content,
          post.category,
          JSON.stringify(post.tags),
          "Javaria Malik",
          "Founder & CEO",
          post.featured,
          post.read,
          publishedAt,
        ]
      );
    }
  }

  /* ── platform settings ─────────────────────────────────────────────── */
  const defaults: Array<[string, unknown]> = [
    [
      "site.stats",
      { learners: 1000, batches: 60, rating: 4.9, satisfaction: 98, teachers: 12 },
    ],
    [
      "site.academy",
      {
        name: "Language Hub",
        tagline: "Hub of language excellence",
        email: process.env.NEXT_PUBLIC_ACADEMY_EMAIL ?? "hello@languagehub.pk",
        phone: process.env.NEXT_PUBLIC_ACADEMY_PHONE ?? "+92 300 0000000",
        whatsapp: process.env.NEXT_PUBLIC_ACADEMY_WHATSAPP ?? "",
        city: process.env.NEXT_PUBLIC_ACADEMY_CITY ?? "Lahore",
        address: process.env.NEXT_PUBLIC_ACADEMY_ADDRESS ?? "",
      },
    ],
    ["site.seeded_at", new Date().toISOString()],
  ];
  for (const [key, value] of defaults) {
    await db.query(
      `INSERT INTO settings (key, value) VALUES ($1, $2::jsonb)
       ON CONFLICT (key) DO NOTHING`,
      [key, JSON.stringify(value)]
    );
  }

  /* ── owner / admin account ─────────────────────────────────────────── */
  const adminEmail = (process.env.ADMIN_EMAIL ?? "").trim().toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD ?? "";
  if (adminEmail && adminPassword) {
    const existing = await db.query<{ id: string }>(
      "SELECT id FROM users WHERE LOWER(email) = $1",
      [adminEmail]
    );
    const hash = await bcrypt.hash(adminPassword, 12);
    if (existing.rows[0]) {
      await db.query(
        `UPDATE users
            SET role = 'ADMIN', password_hash = $1, disabled = FALSE,
                email_verified = TRUE, updated_at = NOW()
          WHERE id = $2`,
        [hash, existing.rows[0].id]
      );
    } else {
      await db.query(
        `INSERT INTO users
           (id, name, email, password_hash, role, email_verified, referral_code, created_at, updated_at)
         VALUES ($1,$2,$3,$4,'ADMIN',TRUE,$5,NOW(),NOW())`,
        [
          uid(),
          "Javaria Malik",
          adminEmail,
          hash,
          "LH-" + crypto.randomBytes(3).toString("hex").toUpperCase(),
        ]
      );
    }
  }

  /* ── optional demo student (local QA only) ─────────────────────────── */
  if (process.env.SEED_DEMO_STUDENT === "true") {
    const demoEmail = "student@languagehub.pk";
    const found = await db.query<{ id: string }>(
      "SELECT id FROM users WHERE LOWER(email) = $1",
      [demoEmail]
    );
    if (!found.rows[0]) {
      const hash = await bcrypt.hash("Student123!", 12);
      const id = uid();
      await db.query(
        `INSERT INTO users
           (id, name, email, password_hash, role, email_verified, referral_code, created_at, updated_at)
         VALUES ($1,'Ayesha Khan',$2,$3,'USER',TRUE,$4,NOW(),NOW())`,
        [id, demoEmail, hash, "LH-DEMO01"]
      );
      await db.query(
        `INSERT INTO enrollments (id, user_id, course_slug, batch, instructor, status)
         VALUES ($1,$2,'spoken-english','Evening','Adeel Hussain','ACTIVE')`,
        [uid(), id]
      );
    }
  }
}
