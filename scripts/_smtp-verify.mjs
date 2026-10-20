import nodemailer from "nodemailer";

const t = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT ?? 587),
  secure: Number(process.env.SMTP_PORT ?? 587) === 465,
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
});

try {
  await t.verify();
  console.log("SMTP verify: OK —", t.options.host, "user:", t.options.auth?.user);
} catch (e) {
  console.log("SMTP verify FAILED:", e.message);
  process.exitCode = 1;
}
