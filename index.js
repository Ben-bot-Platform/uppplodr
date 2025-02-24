const express = require("express");
const { Telegraf, Markup } = require("telegraf");
const LocalSession = require("telegraf-session-local");

const app = express();
app.use(express.json());

const TOKEN = "7390701571:AAEZS36vqBD8u7p_dfmMjIdNSIwAm2y7c7k"; // توکن ربات
const ADMIN_ID = 2048310529; // آیدی ادمین
const bot = new Telegraf(TOKEN);

bot.use(new LocalSession({ database: "session.json" }).middleware());

// مسیر اصلی برای بررسی وضعیت ربات
app.get("/", (req, res) => {
  res.send("🤖 Telegram Uploader Bot is running on Vercel!");
});

// مسیر Webhook برای دریافت پیام‌ها
app.post("/webhook", (req, res) => {
  bot.handleUpdate(req.body);
  res.sendStatus(200);
});

// تنظیمات Webhook برای Vercel
const WEBHOOK_URL = "https://your-vercel-app.vercel.app/webhook"; // لینک Vercel خود را جایگزین کنید
bot.telegram.setWebhook(WEBHOOK_URL)
  .then(() => console.log("✅ Webhook set successfully!"))
  .catch((err) => console.error("❌ Error setting webhook:", err));

const settings = {
  deleteDelay: 20, // مدت حذف خودکار (ثانیه)
  downloadButtonText: "♻️ دانلود مجدد",
  downloadMessageText: "⬇️ برای دانلود مجدد، دکمه زیر را بزنید! 👇",
  warningMessageText: "⚠️ مدیاها پس از ۲۰ ثانیه حذف می‌شوند، لطفاً ذخیره کنید."
};

bot.start((ctx) => {
  if (ctx.from.id !== ADMIN_ID) {
    return ctx.reply("👋 به آپلودر پیشرفته لاوو مووی خوش آمدید! 🎬");
  }

  ctx.reply(
    "👋 سلام! به ربات آپلودر خوش آمدید.\n📂 یکی از گزینه‌های زیر را انتخاب کنید.",
    Markup.keyboard([["📤 آپلود فایل", "📂 آپلود گروهی"]]).resize()
  );
});

// بخش آپلود فایل‌ها
const files = {};
const groupUploads = {};

bot.hears(["📤 آپلود فایل", "📂 آپلود گروهی"], (ctx) => {
  if (ctx.from.id !== ADMIN_ID) return ctx.reply("⛔ شما اجازه استفاده از این قابلیت را ندارید.");

  if (ctx.message.text === "📤 آپلود فایل") {
    ctx.reply("📂 لطفاً یک فایل ارسال کنید.");
    ctx.session.mode = "single";
  } else {
    ctx.reply("📤 چندین فایل ارسال کنید، سپس دکمه **پایان** را بزنید.", Markup.keyboard([["پایان"]]).resize());
    ctx.session.mode = "group";
    ctx.session.files = [];
  }
});

bot.hears("پایان", (ctx) => {
  if (ctx.from.id !== ADMIN_ID) return;
  if (ctx.session.mode !== "group" || ctx.session.files.length === 0) return ctx.reply("❌ شما هنوز فایلی ارسال نکرده‌اید.");

  const uniqueCode = Math.floor(100000 + Math.random() * 900000).toString();
  groupUploads[uniqueCode] = ctx.session.files;
  const link = `https://t.me/${ctx.botInfo.username}?start=${uniqueCode}`;

  ctx.reply(`📤 **آپلود کامل شد!**\n🔗 لینک: \`${link}\``, { parse_mode: "Markdown" });
  
  delete ctx.session.mode;
  delete ctx.session.files;

  ctx.reply("📂 گزینه‌ای را انتخاب کنید.", Markup.keyboard([["📤 آپلود فایل", "📂 آپلود گروهی"]]).resize());
});

bot.on(["document", "photo", "video"], async (ctx) => {
  if (ctx.from.id !== ADMIN_ID) return;

  const file = ctx.message.document || ctx.message.photo?.pop() || ctx.message.video;
  if (!file) return;

  if (ctx.session.mode === "single") {
    const uniqueCode = Math.floor(100000 + Math.random() * 900000).toString();
    files[uniqueCode] = { file_id: file.file_id, caption: ctx.message.caption || "بدون کپشن" };
    const link = `https://t.me/${ctx.botInfo.username}?start=${uniqueCode}`;

    ctx.reply(`🔗 **لینک شما:** \`${link}\``, { parse_mode: "Markdown" });
  } else {
    ctx.session.files.push({ file_id: file.file_id, caption: ctx.message.caption || "بدون کپشن" });
    ctx.reply("✅ فایل آپلود شد، فایل دیگری ارسال کنید یا روی **پایان** کلیک کنید.");
  }
});

// اجرای سرور
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🌍 Web server is running on port ${PORT}`);
});
