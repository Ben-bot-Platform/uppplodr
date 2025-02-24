const express = require("express");
const { Telegraf, Markup } = require("telegraf");

const app = express();
app.use(express.json());

const TOKEN = "7390701571:AAGqmoG9a7VqSUKy5PaISYUNrQ3DnRbIY84"; // توکن ربات خود را اینجا قرار دهید
const ADMIN_ID = 2048310529; // آیدی ادمین
const bot = new Telegraf(TOKEN);

// مسیر اصلی برای بررسی وضعیت
app.get("/", (req, res) => {
  res.send("🤖 Telegram Uploader Bot is Running on Vercel!");
});

// مسیر Webhook برای دریافت پیام‌ها
app.post("/webhook", (req, res) => {
  bot.handleUpdate(req.body);
  res.sendStatus(200);
});

// تنظیمات ربات
const settings = {
  deleteDelay: 20, // زمان حذف خودکار (ثانیه)
  downloadButtonText: "♻️ دانلود مجدد",
  downloadMessageText: "⬇️ برای دانلود مجدد، دکمه زیر را فشار دهید! 👇",
  warningMessageText: "⚠️ توجه\nمدیاهای ارسال شده پس از [20] ثانیه حذف خواهند شد."
};

// مدیریت فایل‌های آپلود شده
const files = {};
const groupUploads = {};

// دستور `/start`
bot.start((ctx) => {
  if (ctx.startPayload) {
    const code = ctx.startPayload;

    if (files[code]) {
      const file = files[code];
      ctx.replyWithDocument(file.file_id, { caption: file.caption });
    } else if (groupUploads[code]) {
      groupUploads[code].forEach(file => {
        ctx.replyWithDocument(file.file_id, { caption: file.caption });
      });
    } else {
      return ctx.reply("❌ این لینک معتبر نیست یا منقضی شده است.");
    }
    return;
  }

  if (ctx.from.id !== ADMIN_ID) {
    return ctx.reply("👋 به آپلودر پیشرفته خوش آمدید! 🎬");
  }

  ctx.reply(
    "👋 سلام! به ربات آپلودر خوش آمدید.\n📂 یکی از گزینه‌های زیر را انتخاب کنید.",
    Markup.keyboard([["📤 آپلود فایل", "📂 آپلود گروهی"]]).resize()
  );
});

// مدیریت ارسال فایل‌ها
bot.hears(["📤 آپلود فایل", "📂 آپلود گروهی"], (ctx) => {
  if (ctx.from.id !== ADMIN_ID) return ctx.reply("⛔ شما اجازه استفاده از این قابلیت را ندارید.");

  if (ctx.message.text === "📤 آپلود فایل") {
    ctx.reply("📂 لطفاً یک فایل ارسال کنید.");
    ctx.session = { mode: "single" };
  } else {
    ctx.reply(
      "📤 لطفاً چندین فایل ارسال کنید و سپس روی **پایان** بزنید.",
      Markup.keyboard([["پایان"]]).resize()
    );
    ctx.session = { mode: "group", files: [] };
  }
});

// پایان آپلود گروهی
bot.hears("پایان", (ctx) => {
  if (ctx.from.id !== ADMIN_ID) return;
  if (ctx.session.mode !== "group" || !ctx.session.files.length) {
    return ctx.reply("❌ شما هنوز هیچ فایلی ارسال نکرده‌اید.");
  }

  const uniqueCode = Math.floor(100000 + Math.random() * 900000).toString();
  groupUploads[uniqueCode] = ctx.session.files;
  const link = `https://t.me/${ctx.botInfo.username}?start=${uniqueCode}`;

  ctx.reply(
    `📤 **آپلود شما کامل شد!**\n🔗 لینک: \`${link}\``,
    {
      parse_mode: "Markdown",
      reply_markup: Markup.inlineKeyboard([
        [{ text: "📎 دیدن لینک", url: link }]
      ])
    }
  );

  delete ctx.session;
});

// دریافت فایل‌ها
bot.on(["document", "photo", "video"], async (ctx) => {
  if (ctx.from.id !== ADMIN_ID) return;

  const file = ctx.message.document || ctx.message.photo?.pop() || ctx.message.video;
  if (!file) return;

  const uniqueCode = Math.floor(100000 + Math.random() * 900000).toString();
  const fileData = { file_id: file.file_id, caption: ctx.message.caption || "بدون کپشن" };

  if (ctx.session.mode === "single") {
    files[uniqueCode] = fileData;
    const link = `https://t.me/${ctx.botInfo.username}?start=${uniqueCode}`;
    ctx.reply(`🔗 **لینک شما:** \`${link}\``, {
      parse_mode: "Markdown",
      reply_markup: Markup.inlineKeyboard([{ text: "📎 دیدن لینک", url: link }])
    });
  } else if (ctx.session.mode === "group") {
    ctx.session.files.push(fileData);
    ctx.reply("✅ فایل ذخیره شد. فایل دیگری ارسال کنید یا روی **پایان** بزنید.");
  }
});

// تنظیم Webhook برای Vercel
const WEBHOOK_URL = "https://uppplodr-upp-ipp.vercel.app/webhook"; // لینک Vercel خود را جایگزین کنید
bot.telegram.setWebhook(WEBHOOK_URL)
  .then(() => console.log("✅ Webhook set successfully!"))
  .catch((err) => console.error("❌ Error setting webhook:", err));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🌍 Web server is running on port ${PORT}`);
});
