const TelegramBot = require("node-telegram-bot-api");
const axios = require("axios");
const fs = require("fs");

// ================= CONFIG =================

const token = "8933266221:AAFGNmY064fRpi2c5Auw2EUgMd1DW6PnXyY";
const GEMINI_API_KEY = "AIzaSyBNSDT6EjFTERZJTPP_bqpQt8qO-9o5VY8";

const OWNER_ID = 6191749317;

// ================= BOT =================

const bot = new TelegramBot(token, {
    polling: true
});

console.log("🚀AYAN CHEATS PREMIUM AI BOT RUNNING...");

// ================= DATABASE =================

const dbFile = "users.json";

if (!fs.existsSync(dbFile)) {

    fs.writeFileSync(
        dbFile,
        JSON.stringify({
            users: [],
            premium: [],
            admins: []
        }, null, 2)
    );
}

function loadDB() {

    return JSON.parse(
        fs.readFileSync(dbFile)
    );
}

function saveDB(data) {

    fs.writeFileSync(
        dbFile,
        JSON.stringify(data, null, 2)
    );
}

// ================= FUNCTIONS =================

function isOwner(id) {

    return id === OWNER_ID;
}

function isAdmin(id) {

    const db = loadDB();

    return db.admins.includes(id) || isOwner(id);
}

function isPremium(id) {

    const db = loadDB();

    return db.premium.includes(id);
}

function addUser(id) {

    const db = loadDB();

    if (!db.users.includes(id)) {

        db.users.push(id);

        saveDB(db);
    }
}

// ================= LEVEL SYSTEM =================

const levels = {};

// ================= SPAM SYSTEM =================

const spam = {};

// ================= START =================

bot.onText(/\/start/, async (msg) => {

    const id = msg.from.id;

    addUser(id);

    bot.sendMessage(
        msg.chat.id,
`🤖 PREMIUM AI BOT

👑 Owner System
🛡 Admin System
💎 Premium System
🧠 AI Chat
📢 Broadcast
📊 Stats
🎛 Panel
🎮 Level System
🚫 Anti Spam
🎁 Daily Reward
🔒 Authentication

Commands:
/help`
    );
});

// ================= HELP =================

bot.onText(/\/help/, async (msg) => {

    bot.sendMessage(
        msg.chat.id,
`📚 COMMANDS

🧠 AI
/ai question

👤 USER
/id
/profile
/premium

👑 ADMIN
/stats
/broadcast text
/addpremium id
/removepremium id
/addadmin id

🎛 EXTRA
/panel
/ping
/uptime
/quote
/daily
/system
/weather city`
    );
});

// ================= USER ID =================

bot.onText(/\/id/, async (msg) => {

    bot.sendMessage(
        msg.chat.id,
        `🆔 ID: ${msg.from.id}`
    );
});

// ================= PROFILE =================

bot.onText(/\/profile/, async (msg) => {

    const id = msg.from.id;

    if (!levels[id]) {

        levels[id] = {
            xp: 0,
            level: 1
        };
    }

    bot.sendMessage(
        msg.chat.id,
`👤 PROFILE

🆔 ID: ${id}
⭐ Level: ${levels[id].level}
⚡ XP: ${levels[id].xp}
💎 Premium: ${isPremium(id)}`
    );
});

// ================= PREMIUM =================

bot.onText(/\/premium/, async (msg) => {

    if (isPremium(msg.from.id)) {

        bot.sendMessage(
            msg.chat.id,
            "💎 Premium Active"
        );

    } else {

        bot.sendMessage(
            msg.chat.id,
            "❌ No Premium"
        );
    }
});

// ================= STATS =================

bot.onText(/\/stats/, async (msg) => {

    if (!isAdmin(msg.from.id)) return;

    const db = loadDB();

    bot.sendMessage(
        msg.chat.id,
`📊 BOT STATS

👤 Users: ${db.users.length}
💎 Premium: ${db.premium.length}
🛡 Admins: ${db.admins.length}`
    );
});

// ================= ADD PREMIUM =================

bot.onText(/\/addpremium (.+)/, async (msg, match) => {

    if (!isAdmin(msg.from.id)) return;

    const userId = Number(match[1]);

    const db = loadDB();

    if (!db.premium.includes(userId)) {

        db.premium.push(userId);

        saveDB(db);

        bot.sendMessage(
            msg.chat.id,
            "✅ Premium Added"
        );
    }
});

// ================= REMOVE PREMIUM =================

bot.onText(/\/removepremium (.+)/, async (msg, match) => {

    if (!isAdmin(msg.from.id)) return;

    const userId = Number(match[1]);

    const db = loadDB();

    db.premium =
        db.premium.filter(
            id => id !== userId
        );

    saveDB(db);

    bot.sendMessage(
        msg.chat.id,
        "❌ Premium Removed"
    );
});

// ================= ADD ADMIN =================

bot.onText(/\/addadmin (.+)/, async (msg, match) => {

    if (!isOwner(msg.from.id)) return;

    const userId = Number(match[1]);

    const db = loadDB();

    if (!db.admins.includes(userId)) {

        db.admins.push(userId);

        saveDB(db);

        bot.sendMessage(
            msg.chat.id,
            "🛡 Admin Added"
        );
    }
});

// ================= BROADCAST =================

bot.onText(/\/broadcast (.+)/, async (msg, match) => {

    if (!isAdmin(msg.from.id)) return;

    const text = match[1];

    const db = loadDB();

    for (const user of db.users) {

        try {

            await bot.sendMessage(
                user,
                `📢 BROADCAST\n\n${text}`
            );

        } catch (e) {}
    }

    bot.sendMessage(
        msg.chat.id,
        "✅ Broadcast Sent"
    );
});

// ================= AI CHAT =================

bot.onText(/\/ai (.+)/, async (msg, match) => {

    const userText = match[1];

    try {

        bot.sendChatAction(
            msg.chat.id,
            "typing"
        );

        const response = await axios.post(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${AIzaSyBNSDT6EjFTERZJTPP_bqpQt8qO-9o5VY8}`,
            {
                contents: [
                    {
                        parts: [
                            {
                                text: userText
                            }
                        ]
                    }
                ]
            }
        );

        const reply =
            response.data.candidates[0]
            .content.parts[0].text;

        bot.sendMessage(
            msg.chat.id,
            reply
        );

    } catch (err) {

        console.log(
            err.response?.data || err.message
        );

        bot.sendMessage(
            msg.chat.id,
            "❌ AI Error"
        );
    }
});

// ================= PANEL =================

bot.onText(/\/panel/, async (msg) => {

    bot.sendMessage(
        msg.chat.id,
        "🎛 Control Panel",
        {
            reply_markup: {
                inline_keyboard: [
                    [
                        {
                            text: "📊 Stats",
                            callback_data: "stats"
                        },
                        {
                            text: "💎 Premium",
                            callback_data: "premium"
                        }
                    ],
                    [
                        {
                            text: "👑 Owner",
                            callback_data: "owner"
                        }
                    ]
                ]
            }
        }
    );
});

// ================= CALLBACK =================

bot.on("callback_query", async (query) => {

    const data = query.data;

    if (data === "stats") {

        const db = loadDB();

        bot.sendMessage(
            query.message.chat.id,
            `👤 Users: ${db.users.length}`
        );
    }

    if (data === "premium") {

        bot.sendMessage(
            query.message.chat.id,
            "💎 Premium System Active"
        );
    }

    if (data === "owner") {

        bot.sendMessage(
            query.message.chat.id,
            "👑 Owner Online"
        );
    }
});

// ================= DAILY =================

const rewardCooldown = {};

bot.onText(/\/daily/, async (msg) => {

    const id = msg.from.id;

    const now = Date.now();

    if (
        rewardCooldown[id] &&
        now - rewardCooldown[id] < 86400000
    ) {

        return bot.sendMessage(
            msg.chat.id,
            "⏳ Come Tomorrow"
        );
    }

    rewardCooldown[id] = now;

    bot.sendMessage(
        msg.chat.id,
        "🎁 Daily Reward Claimed"
    );
});

// ================= QUOTES =================

const quotes = [
    "🔥 Never Give Up",
    "💪 Work Hard",
    "🚀 Success Loading",
    "😎 Stay Strong"
];

bot.onText(/\/quote/, async (msg) => {

    const random =
        quotes[
            Math.floor(
                Math.random() * quotes.length
            )
        ];

    bot.sendMessage(
        msg.chat.id,
        random
    );
});

// ================= WEATHER =================

bot.onText(/\/weather (.+)/, async (msg, match) => {

    const city = match[1];

    bot.sendMessage(
        msg.chat.id,
`🌤 WEATHER

📍 City: ${city}
🌡 Temp: 28°C
💨 Wind: 10km/h`
    );
});

// ================= SYSTEM =================

bot.onText(/\/system/, async (msg) => {

    bot.sendMessage(
        msg.chat.id,
`🖥 SYSTEM

⚡ Status: Online
🧠 AI: Active
📦 Database: Connected`
    );
});

// ================= PING =================

bot.onText(/\/ping/, async (msg) => {

    bot.sendMessage(
        msg.chat.id,
        "🏓 Pong!"
    );
});

// ================= UPTIME =================

const startTime = Date.now();

bot.onText(/\/uptime/, async (msg) => {

    const uptime =
        Math.floor(
            (Date.now() - startTime) / 1000
        );

    bot.sendMessage(
        msg.chat.id,
        `⏰ Uptime: ${uptime}s`
    );
});

// ================= WELCOME =================

bot.on("new_chat_members", async (msg) => {

    const name =
        msg.new_chat_members[0]
        .first_name;

    bot.sendMessage(
        msg.chat.id,
        `👋 Welcome ${name}`
    );
});

// ================= FILTER =================

const badWords = [
    "mc",
    "bc",
    "abuse"
];

bot.on("message", async (msg) => {

    if (!msg.text) return;

    const text =
        msg.text.toLowerCase();

    if (
        badWords.some(
            word => text.includes(word)
        )
    ) {

        try {

            await bot.deleteMessage(
                msg.chat.id,
                msg.message_id
            );

            bot.sendMessage(
                msg.chat.id,
                "🚫 Bad Word Not Allowed"
            );

        } catch (e) {}
    }
});

// ================= AUTO REPLY =================

bot.on("message", async (msg) => {

    if (!msg.text) return;

    const text =
        msg.text.toLowerCase();

    if (text === "hi") {

        bot.sendMessage(
            msg.chat.id,
            "👋 Hello"
        );
    }

    if (text === "owner") {

        bot.sendMessage(
            msg.chat.id,
            "👑 Owner Online"
        );
    }

    if (text.includes("love")) {

        bot.sendMessage(
            msg.chat.id,
            "❤️"
        );
    }
});

// ================= LEVEL =================

bot.on("message", async (msg) => {

    if (!msg.text) return;

    const id = msg.from.id;

    if (!levels[id]) {

        levels[id] = {
            xp: 0,
            level: 1
        };
    }

    levels[id].xp += 10;

    const need =
        levels[id].level * 100;

    if (
        levels[id].xp >= need
    ) {

        levels[id].level++;

        levels[id].xp = 0;

        bot.sendMessage(
            msg.chat.id,
            `🎉 Level Up ${levels[id].level}`
        );
    }
});

// ================= ANTI SPAM =================

bot.on("message", async (msg) => {

    const id = msg.from.id;

    if (!spam[id]) {

        spam[id] = {
            count: 0,
            time: Date.now()
        };
    }

    spam[id].count++;

    if (
        spam[id].count >= 5
    ) {

        if (
            Date.now() -
            spam[id].time < 5000
        ) {

            bot.sendMessage(
                msg.chat.id,
                "🚫 Spam Detected"
            );
        }

        spam[id].count = 0;

        spam[id].time = Date.now();
    }
});


const express = require("express");
const app = express();

app.get("/", (req, res) => {
    res.send("Bot is running 🚀");
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log("🌐 Server running on port " + PORT);
});
