#!/usr/bin/env python3
# =====================================================
# TELEGRAM AI CHATBOT - Powered by Claude API
# Install: pip install python-telegram-bot anthropic
# =====================================================

import logging
import os
from anthropic import Anthropic
from telegram import Update, KeyboardButton, ReplyKeyboardMarkup, ReplyKeyboardRemove
from telegram.ext import Application, CommandHandler, MessageHandler, ContextTypes, filters

logging.basicConfig(
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    level=logging.INFO
)
logger = logging.getLogger(__name__)

# =====================================================
# CONFIG - Apne tokens yahan daalo
# =====================================================
BOT_TOKEN = "8933266221:AAEnowlBIIGPv3J2oZZnHB9IS-S22DY8S0s"       # @BotFather se lena
ANTHROPIC_API_KEY = "AIzaSyBNSDT6EjFTERZJTPP_bqpQt8qO-9o5VY8" # console.anthropic.com se lena

# Bot ka naam aur personality
BOT_NAME = "AI Assistant"
SYSTEM_PROMPT = """Tu ek helpful AI assistant hai jo Hinglish mein baat karta hai.
Tujhe short, clear aur friendly replies dene hain.
User ke questions ka accha jawab de. Emojis use kar lekin zyada nahi."""

# =====================================================
# USER CHAT HISTORY (memory for conversation)
# =====================================================
user_histories = {}

def get_history(user_id):
    if user_id not in user_histories:
        user_histories[user_id] = []
    return user_histories[user_id]

def clear_history(user_id):
    user_histories[user_id] = []

# =====================================================
# KEYBOARDS
# =====================================================

def main_keyboard():
    keyboard = [
        [KeyboardButton("💬 AI Chat"), KeyboardButton("🧠 Smart Q&A")],
        [KeyboardButton("📝 Text Tools"), KeyboardButton("🌐 Translate")],
        [KeyboardButton("💡 Ideas Generator"), KeyboardButton("📊 Summarize")],
        [KeyboardButton("🗑️ Clear Chat"), KeyboardButton("❓ Help")],
    ]
    return ReplyKeyboardMarkup(keyboard, resize_keyboard=True)

def text_tools_keyboard():
    keyboard = [
        [KeyboardButton("✍️ Fix Grammar"), KeyboardButton("📋 Rewrite")],
        [KeyboardButton("📏 Make Shorter"), KeyboardButton("📖 Make Longer")],
        [KeyboardButton("🎯 Key Points"), KeyboardButton("« Back")],
    ]
    return ReplyKeyboardMarkup(keyboard, resize_keyboard=True)

def translate_keyboard():
    keyboard = [
        [KeyboardButton("🇮🇳 Hindi"), KeyboardButton("🇬🇧 English")],
        [KeyboardButton("🇸🇦 Arabic"), KeyboardButton("🇫🇷 French")],
        [KeyboardButton("🇯🇵 Japanese"), KeyboardButton("🇩🇪 German")],
        [KeyboardButton("« Back")],
    ]
    return ReplyKeyboardMarkup(keyboard, resize_keyboard=True)

def cancel_keyboard():
    keyboard = [[KeyboardButton("❌ Cancel")]]
    return ReplyKeyboardMarkup(keyboard, resize_keyboard=True)

# =====================================================
# USER STATE (konsa mode active hai)
# =====================================================
user_state = {}

MODE_NONE        = "none"
MODE_CHAT        = "chat"
MODE_QNA         = "qna"
MODE_GRAMMAR     = "grammar"
MODE_REWRITE     = "rewrite"
MODE_SHORTER     = "shorter"
MODE_LONGER      = "longer"
MODE_KEYPOINTS   = "keypoints"
MODE_TRANSLATE   = "translate"
MODE_SUMMARIZE   = "summarize"
MODE_IDEAS       = "ideas"
MODE_AWAIT_LANG  = "await_lang"

def set_mode(user_id, mode):
    user_state[user_id] = mode

def get_mode(user_id):
    return user_state.get(user_id, MODE_NONE)

# =====================================================
# CLAUDE API CALL
# =====================================================
client = Anthropic(api_key=ANTHROPIC_API_KEY)

async def ask_claude(user_id, user_message, system_override=None):
    history = get_history(user_id)
    history.append({"role": "user", "content": user_message})

    system = system_override if system_override else SYSTEM_PROMPT

    response = client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=1024,
        system=system,
        messages=history
    )

    reply = response.content[0].text
    history.append({"role": "assistant", "content": reply})

    # History 20 messages tak rakho
    if len(history) > 20:
        user_histories[user_id] = history[-20:]

    return reply

# =====================================================
# COMMAND HANDLERS
# =====================================================

async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user = update.effective_user
    user_id = user.id
    set_mode(user_id, MODE_CHAT)
    clear_history(user_id)

    msg = (
        f"👋 *Namaste {user.first_name}!*\n"
        f"━━━━━━━━━━━━━━━━━━━━━\n"
        f"Main hoon *{BOT_NAME}* 🤖\n\n"
        f"Aap mujhse kuch bhi pooch sakte hain!\n"
        f"Ya niche buttons se option choose karein.\n\n"
        f"💡 Seedha type karke bhi baat kar sakte hain!"
    )

    await update.message.reply_text(
        msg,
        parse_mode="Markdown",
        reply_markup=main_keyboard()
    )

async def help_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    msg = (
        "❓ *HELP - Features*\n"
        "━━━━━━━━━━━━━━━━━━━━━\n\n"
        "💬 *AI Chat* - Normal baat karo AI se\n"
        "🧠 *Smart Q&A* - Deep questions ke liye\n"
        "📝 *Text Tools* - Grammar, rewrite, etc.\n"
        "🌐 *Translate* - Kisi bhi language mein\n"
        "💡 *Ideas* - Creative ideas generator\n"
        "📊 *Summarize* - Bada text chhota karo\n"
        "🗑️ *Clear Chat* - History saaf karo\n\n"
        "━━━━━━━━━━━━━━━━━━━━━\n"
        "Koi sawaal? Seedha type karo! 😊"
    )
    await update.message.reply_text(msg, parse_mode="Markdown", reply_markup=main_keyboard())

# =====================================================
# MAIN MESSAGE HANDLER
# =====================================================

async def handle_message(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user_id = update.effective_user.id
    text = update.message.text
    mode = get_mode(user_id)

    # ── MAIN MENU BUTTONS ──────────────────────────

    if text == "💬 AI Chat":
        set_mode(user_id, MODE_CHAT)
        await update.message.reply_text(
            "💬 *AI Chat Mode ON!*\n"
            "━━━━━━━━━━━━━━━━━━━━━\n"
            "Kuch bhi poochein, main jawab dunga! 🤖",
            parse_mode="Markdown",
            reply_markup=main_keyboard()
        )
        return

    elif text == "🧠 Smart Q&A":
        set_mode(user_id, MODE_QNA)
        await update.message.reply_text(
            "🧠 *Smart Q&A Mode!*\n"
            "━━━━━━━━━━━━━━━━━━━━━\n"
            "Apna sawaal poochein - main detail mein explain karunga!",
            parse_mode="Markdown",
            reply_markup=cancel_keyboard()
        )
        return

    elif text == "📝 Text Tools":
        set_mode(user_id, MODE_NONE)
        await update.message.reply_text(
            "📝 *Text Tools*\n"
            "━━━━━━━━━━━━━━━━━━━━━\n"
            "Kaunsa tool use karna hai?",
            parse_mode="Markdown",
            reply_markup=text_tools_keyboard()
        )
        return

    elif text == "🌐 Translate":
        set_mode(user_id, MODE_AWAIT_LANG)
        await update.message.reply_text(
            "🌐 *Translate*\n"
            "━━━━━━━━━━━━━━━━━━━━━\n"
            "Pehle language choose karo:",
            parse_mode="Markdown",
            reply_markup=translate_keyboard()
        )
        return

    elif text == "💡 Ideas Generator":
        set_mode(user_id, MODE_IDEAS)
        await update.message.reply_text(
            "💡 *Ideas Generator!*\n"
            "━━━━━━━━━━━━━━━━━━━━━\n"
            "Kaunse topic pe ideas chahiye? Batao!",
            parse_mode="Markdown",
            reply_markup=cancel_keyboard()
        )
        return

    elif text == "📊 Summarize":
        set_mode(user_id, MODE_SUMMARIZE)
        await update.message.reply_text(
            "📊 *Summarize Mode!*\n"
            "━━━━━━━━━━━━━━━━━━━━━\n"
            "Jo text summarize karna hai woh bhejo:",
            parse_mode="Markdown",
            reply_markup=cancel_keyboard()
        )
        return

    elif text == "🗑️ Clear Chat":
        clear_history(user_id)
        set_mode(user_id, MODE_CHAT)
        await update.message.reply_text(
            "🗑️ *Chat history clear ho gayi!*\n"
            "Fresh start karo! 😊",
            parse_mode="Markdown",
            reply_markup=main_keyboard()
        )
        return

    elif text == "❓ Help":
        await help_command(update, context)
        return

    # ── TEXT TOOLS BUTTONS ─────────────────────────

    elif text == "✍️ Fix Grammar":
        set_mode(user_id, MODE_GRAMMAR)
        await update.message.reply_text(
            "✍️ *Grammar Fix Mode*\n"
            "━━━━━━━━━━━━━━━━━━━━━\n"
            "Apna text bhejo, main grammar theek karunga:",
            parse_mode="Markdown",
            reply_markup=cancel_keyboard()
        )
        return

    elif text == "📋 Rewrite":
        set_mode(user_id, MODE_REWRITE)
        await update.message.reply_text(
            "📋 *Rewrite Mode*\n"
            "━━━━━━━━━━━━━━━━━━━━━\n"
            "Text bhejo, main better tarike se likhta hoon:",
            parse_mode="Markdown",
            reply_markup=cancel_keyboard()
        )
        return

    elif text == "📏 Make Shorter":
        set_mode(user_id, MODE_SHORTER)
        await update.message.reply_text(
            "📏 *Make Shorter Mode*\n"
            "━━━━━━━━━━━━━━━━━━━━━\n"
            "Text bhejo, main use concise bana dunga:",
            parse_mode="Markdown",
            reply_markup=cancel_keyboard()
        )
        return

    elif text == "📖 Make Longer":
        set_mode(user_id, MODE_LONGER)
        await update.message.reply_text(
            "📖 *Make Longer Mode*\n"
            "━━━━━━━━━━━━━━━━━━━━━\n"
            "Text bhejo, main use detailed bana dunga:",
            parse_mode="Markdown",
            reply_markup=cancel_keyboard()
        )
        return

    elif text == "🎯 Key Points":
        set_mode(user_id, MODE_KEYPOINTS)
        await update.message.reply_text(
            "🎯 *Key Points Mode*\n"
            "━━━━━━━━━━━━━━━━━━━━━\n"
            "Article ya paragraph bhejo, main key points nikalta hoon:",
            parse_mode="Markdown",
            reply_markup=cancel_keyboard()
        )
        return

    elif text == "« Back":
        set_mode(user_id, MODE_CHAT)
        await update.message.reply_text(
            "🏠 Main menu pe wapas aa gaye!",
            reply_markup=main_keyboard()
        )
        return

    elif text == "❌ Cancel":
        set_mode(user_id, MODE_CHAT)
        await update.message.reply_text(
            "❌ *Cancelled!*\n"
            "Main menu pe wapas.",
            parse_mode="Markdown",
            reply_markup=main_keyboard()
        )
        return

    # ── TRANSLATE LANGUAGE SELECTION ───────────────

    elif mode == MODE_AWAIT_LANG and text in [
        "🇮🇳 Hindi", "🇬🇧 English", "🇸🇦 Arabic",
        "🇫🇷 French", "🇯🇵 Japanese", "🇩🇪 German"
    ]:
        lang_map = {
            "🇮🇳 Hindi": "Hindi",
            "🇬🇧 English": "English",
            "🇸🇦 Arabic": "Arabic",
            "🇫🇷 French": "French",
            "🇯🇵 Japanese": "Japanese",
            "🇩🇪 German": "German",
        }
        lang = lang_map[text]
        context.user_data["translate_lang"] = lang
        set_mode(user_id, MODE_TRANSLATE)
        await update.message.reply_text(
            f"🌐 *{text} selected!*\n"
            f"━━━━━━━━━━━━━━━━━━━━━\n"
            f"Ab jo text bhejoge woh {lang} mein translate hoga:",
            parse_mode="Markdown",
            reply_markup=cancel_keyboard()
        )
        return

    # ── AI PROCESSING ──────────────────────────────

    # Show typing indicator
    await context.bot.send_chat_action(
        chat_id=update.effective_chat.id,
        action="typing"
    )

    try:
        if mode == MODE_GRAMMAR:
            prompt = f"Niche diye gaye text ki grammar fix karo. Sirf corrected text do, explanation nahi:\n\n{text}"
            reply = await ask_claude(user_id, prompt, "Tu ek expert grammar editor hai. Sirf fixed text do.")

        elif mode == MODE_REWRITE:
            prompt = f"Is text ko better aur professional style mein rewrite karo:\n\n{text}"
            reply = await ask_claude(user_id, prompt, "Tu ek expert writer hai. Text ko better banao.")

        elif mode == MODE_SHORTER:
            prompt = f"Is text ko concise aur short banao, main points rakho:\n\n{text}"
            reply = await ask_claude(user_id, prompt, "Tu ek expert editor hai. Text ko short karo without losing meaning.")

        elif mode == MODE_LONGER:
            prompt = f"Is text ko elaborate aur detailed banao:\n\n{text}"
            reply = await ask_claude(user_id, prompt, "Tu ek expert writer hai. Text ko detailed banao.")

        elif mode == MODE_KEYPOINTS:
            prompt = f"Is text ke key points bullet points mein nikalo:\n\n{text}"
            reply = await ask_claude(user_id, prompt, "Tu ek expert analyst hai. Key points clearly list karo.")

        elif mode == MODE_TRANSLATE:
            lang = context.user_data.get("translate_lang", "English")
            prompt = f"Is text ko {lang} mein translate karo. Sirf translation do:\n\n{text}"
            reply = await ask_claude(user_id, prompt, f"Tu ek expert translator hai. Sirf {lang} translation do.")

        elif mode == MODE_SUMMARIZE:
            prompt = f"Is text ka short summary do:\n\n{text}"
            reply = await ask_claude(user_id, prompt, "Tu ek expert summarizer hai. Concise summary do.")

        elif mode == MODE_IDEAS:
            prompt = f"'{text}' topic pe 5 creative aur unique ideas do with brief explanation."
            reply = await ask_claude(user_id, prompt, "Tu ek creative idea generator hai. Numbered list mein ideas do.")

        elif mode == MODE_QNA:
            prompt = f"Is sawaal ka detailed aur helpful jawab do:\n\n{text}"
            reply = await ask_claude(user_id, prompt, "Tu ek knowledgeable expert hai. Detailed explanation do.")

        else:
            # Default chat mode
            reply = await ask_claude(user_id, text)

        await update.message.reply_text(reply)

    except Exception as e:
        logger.error(f"Error: {e}")
        await update.message.reply_text(
            "❌ Kuch error aa gayi!\n"
            "Thodi der baad try karo ya /start karo.",
            reply_markup=main_keyboard()
        )

# =====================================================
# MAIN
# =====================================================

def main():
    print("🤖 AI Chatbot Starting...")
    print("━━━━━━━━━━━━━━━━━━━━━")

    app = Application.builder().token(BOT_TOKEN).build()

    app.add_handler(CommandHandler("start", start))
    app.add_handler(CommandHandler("help", help_command))
    app.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, handle_message))

    print("✅ Bot is running! Press Ctrl+C to stop.")
    app.run_polling(poll_interval=1.0)

if __name__ == "__main__":
    main()
