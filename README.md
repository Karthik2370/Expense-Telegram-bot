# 💰 Expensso - Telegram Expense Tracker Bot

Expensso is a simple Telegram bot to track your personal expenses directly inside Telegram. You can add expenses, set your budget, view your balance, delete records, and get alerts when you're close to overspending — all directly through chat.

---

## Features

- Add expenses with descriptions  
- List all your expenses with dates  
- Set available money (budget)  
- Get remaining balance summary  
- Delete any expense by its number  
- Budget alerts when you're close to or over your budget  
- Share bot invite link  
- Simple help commands for easy usage

---

## Tech Stack

- Node.js  
- node-telegram-bot-api  
- dotenv (for environment variables)

---

### Start the Bot

Send `/start` to your Telegram bot.

### Available Commands

| Command | Description | Example |
| ------- | ----------- | ------- |
| `/add <amount> <description>` | Add a new expense | `/add 500 Dinner` |
| `/list` | List all expenses | |
| `/total` | Show total expenses and balance summary | |
| `/delete <expense_number>` | Delete an expense by its number | `/delete 2` |
| `/money <amount>` | Set available money (budget) | `/money 10000` |
| `/balance` | Check remaining balance | |
| `/invite` | Get bot invite link | |
| `/help` | Show help message | |

---

## Note

- This is a demo project for learning purposes.
- All data is stored in memory. Once you stop the bot, your data will be lost.
- For production, you can easily extend it to use a database like MongoDB or SQLite.
- Some Future implementations are 
1. Reminders - /remindme, reminders to log your expenses daily
2. Monthly Summary — Like /summary to show total spent this month, maybe with a pie chart (using an API like QuickChart).
3. Export Feature — /export to send a CSV or text summary of your expenses.
