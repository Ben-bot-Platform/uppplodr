const express = require("express");
const { Telegraf, Markup } = require("telegraf");
const LocalSession = require("telegraf-session-local");

const app = express();
app.use(express.json());

const TOKEN = "7390701571:AAGqmoG9a7VqSUKy5PaISYUNrQ3DnRbIY84"; // 🔹 توکن ربات را جایگزین کنید
const ADMIN_ID = 2048310529; // 🔹 آیدی ادمین
const bot = new Telegraf(TOKEN);

// استفاده از سیستم ذخیره‌سازی جلسات
bot.use(new LocalSession({ database: "session.json" }).middleware());

// متغیرهای ذخیره فایل‌ها
const files = {};
const groupUploads = {};

const settings = {
  deleteDelay: 20, // ⏳ زمان حذف خودکار پیام‌ها (ثانیه)
  downloadButtonText: "♻️ دانلود مجدد",
  downloadMessageText: "⬇️ برای دانلود مجدد، روی دکمه زیر کلیک کنید! 👇",
  warningMessageText: "⚠️ توجه: فایل‌های ارسالی پس از [20] ثانیه حذف خواهند شد."
};

// مسیر اصلی برای بررسی وضعیت سرور
app.get("/", (req, res) => {
  res.send("🤖 Telegram Uploader Bot is Running on Vercel!");
});

// دریافت پیام‌ها از Webhook
app.post("/webhook", (req, res) => {
  bot.handleUpdate(req.body);
  res.sendStatus(200);
});

// تنظیم Webhook برای Vercel
const WEBHOOK_URL = "https://uppplodr-upp-ipp.vercel.app/webhook"; // 🔹 لینک Vercel را جایگزین کنید
bot.telegram.setWebhook(WEBHOOK_URL)
  .then(() => console.log("✅ Webhook set successfully!"))
  .catch((err) => console.error("❌ Error setting webhook:", err));

// دستور `/start`
bot.start(async (ctx) => {
  if (ctx.startPayload) {
    const code = ctx.startPayload;
    if (files[code]) {
      await ctx.replyWithDocument(files[code].file_id, { caption: files[code].caption });
    } else if (groupUploads[code]) {
      for (const file of groupUploads[code]) {
        await ctx.replyWithDocument(file.file_id, { caption: file.caption });
      }
    } else {
      return ctx.reply("❌ این لینک منقضی شده یا نامعتبر است.");
    }

    // هشدار حذف
    const warningMessage = await ctx.reply(settings.warningMessageText.replace("[20]", `[${settings.deleteDelay}]`));

    // دکمه دانلود مجدد
    const downloadLink = `https://t.me/${ctx.botInfo.username}?start=${code}`;
    await ctx.reply(
      settings.downloadMessageText,
      Markup.inlineKeyboard([[{ text: settings.downloadButtonText, url: downloadLink }]])
    );

    // حذف پیام‌ها بعد از مدت مشخص
    setTimeout(async () => {
      try {
        await ctx.deleteMessage(warningMessage.message_id);
      } catch (error) {
        console.error("Error deleting messages:", error);
      }
    }, settings.deleteDelay * 1000);
  } else {
    ctx.reply("👋 به آپلودر پیشرفته تلگرام خوش آمدید!");
  }
});

// دریافت فایل و ایجاد لینک دانلود
bot.on(["document", "photo", "video"], async (ctx) => {
  if (ctx.from.id !== ADMIN_ID) return;

  const file = ctx.message.document || ctx.message.photo?.pop() || ctx.message.video;
  if (file) {
    const uniqueCode = Math.floor(100000 + Math.random() * 900000).toString();
    files[uniqueCode] = { file_id: file.file_id, caption: ctx.message.caption || "بدون کپشن" };
    const link = `https://t.me/${ctx.botInfo.username}?start=${uniqueCode}`;

    ctx.reply(
      `🔗 **لینک فایل شما:** \`${link}\``,
      { parse_mode: "Markdown", reply_markup: { inline_keyboard: [[{ text: "📎 دیدن لینک", url: link }]] } }
    );
  }
});

// اجرای سرور در Vercel
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🌍 Server running on port ${PORT}`);
});
