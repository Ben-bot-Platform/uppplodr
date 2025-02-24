const express = require("express");
const { Telegraf } = require("telegraf");

const app = express();
app.use(express.json());

const TOKEN = "7390701571:AAEdOrnbHxd_5fZiNYIDiFNUZmFIySbw0_0"; // توکن ربات خود را اینجا قرار دهید
const bot = new Telegraf(TOKEN);

// مسیر اصلی برای بررسی وضعیت
app.get("/", (req, res) => {
  res.send("🤖 Telegram Bot is Running on Vercel!");
});

// مسیر Webhook برای دریافت پیام‌ها
app.post("/webhook", (req, res) => {
  bot.handleUpdate(req.body);
  res.sendStatus(200);
});

// دستورات ساده ربات
bot.start((ctx) => ctx.reply("سلام! 👋 به ربات من خوش آمدید!"));
bot.help((ctx) => ctx.reply("📌 راهنما:\n/start - شروع ربات\n/help - راهنما"));
bot.on("text", (ctx) => ctx.reply(`📩 شما گفتید: ${ctx.message.text}`));

// تنظیم Webhook برای Vercel
const WEBHOOK_URL = "https://uppplodr-upp-ipp.vercel.app/webhook"; // لینک Vercel خود را جایگزین کنید
bot.telegram.setWebhook(WEBHOOK_URL)
  .then(() => console.log("✅ Webhook set successfully!"))
  .catch((err) => console.error("❌ Error setting webhook:", err));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🌍 Web server is running on port ${PORT}`);
});
