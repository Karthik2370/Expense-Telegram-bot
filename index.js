require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');

// Get token from environment variables
const token = process.env.BOT_TOKEN;

// Create a bot that uses 'polling' to fetch new updates
const bot = new TelegramBot(token, { polling: true });

// Store expenses in memory (in a real app, you'd use a database)
const userExpenses = new Map();

// Helper function to format currency
const formatCurrency = (amount) => {
  return `₹${amount.toFixed(2)}`;
};

// Listen for '/start' command
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  const welcomeMessage = `Welcome to Expense Tracker Bot! 💰\n\n` +
    `Here are the available commands:\n` +
    `/add <amount> <description> - Add an expense\n` +
    `/list - View all your expenses\n` +
    `/total - Get total expenses\n` +
    `/delete <expense_number> - Delete an expense\n` +
    `/help - Show this help message`;
  bot.sendMessage(chatId, welcomeMessage);
});

// Add expense
bot.onText(/\/add (.+)/, (msg, match) => {
  const chatId = msg.chat.id;
  const params = match[1].split(' ');
  
  if (params.length < 2) {
    return bot.sendMessage(chatId, 'Please use format: /add <amount> <description>');
  }

  const amount = parseFloat(params[0]);
  if (isNaN(amount)) {
    return bot.sendMessage(chatId, 'Please enter a valid amount');
  }

  const description = params.slice(1).join(' ');
  const expense = {
    amount,
    description,
    date: new Date()
  };

  if (!userExpenses.has(chatId)) {
    userExpenses.set(chatId, []);
  }
  userExpenses.get(chatId).push(expense);

  bot.sendMessage(chatId, `✅ Added expense:\nAmount: ${formatCurrency(amount)}\nDescription: ${description}`);
});

// List expenses
bot.onText(/\/list/, (msg) => {
  const chatId = msg.chat.id;
  const expenses = userExpenses.get(chatId) || [];

  if (expenses.length === 0) {
    return bot.sendMessage(chatId, 'No expenses recorded yet.');
  }

  const expenseList = expenses.map((exp, index) => 
    `${index + 1}. ${formatCurrency(exp.amount)} - ${exp.description}\n   ${exp.date.toLocaleDateString()}`
  ).join('\n\n');

  bot.sendMessage(chatId, `📋 Your expenses:\n\n${expenseList}`);
});

// Get total
bot.onText(/\/total/, (msg) => {
  const chatId = msg.chat.id;
  const expenses = userExpenses.get(chatId) || [];
  
  if (expenses.length === 0) {
    return bot.sendMessage(chatId, 'No expenses recorded yet.');
  }

  const total = expenses.reduce((sum, exp) => sum + exp.amount, 0);
  bot.sendMessage(chatId, `💰 Total expenses: ${formatCurrency(total)}`);
});

// Delete expense
bot.onText(/\/delete (.+)/, (msg, match) => {
  const chatId = msg.chat.id;
  const expenseNumber = parseInt(match[1]);
  const expenses = userExpenses.get(chatId) || [];

  if (isNaN(expenseNumber)) {
    return bot.sendMessage(chatId, 'Please provide a valid expense number');
  }

  if (expenseNumber < 1 || expenseNumber > expenses.length) {
    return bot.sendMessage(chatId, 'Invalid expense number. Use /list to see your expenses.');
  }

  const deletedExpense = expenses.splice(expenseNumber - 1, 1)[0];
  bot.sendMessage(chatId, 
    `🗑️ Deleted expense:\n` +
    `Amount: ${formatCurrency(deletedExpense.amount)}\n` +
    `Description: ${deletedExpense.description}`
  );
});

// Help command
bot.onText(/\/help/, (msg) => {
  const chatId = msg.chat.id;
  const helpMessage = `Available commands:\n\n` +
    `/add <amount> <description> - Add an expense\n` +
    `/list - View all your expenses\n` +
    `/total - Get total expenses\n` +
    `/delete <expense_number> - Delete an expense\n` +
    `/help - Show this help message\n\n` +
    `Example: /add 500 Lunch at restaurant`;
  bot.sendMessage(chatId, helpMessage);
});

// Handle unknown commands
bot.on('message', (msg) => {
  const chatId = msg.chat.id;
  const receivedText = msg.text;

  // Only show unknown command message if it starts with / but isn't a known command
  if (receivedText && receivedText.startsWith('/') && 
      !['/start', '/add', '/list', '/total', '/delete', '/help'].some(cmd => receivedText.startsWith(cmd))) {
    bot.sendMessage(chatId, 'Unknown command. Use /help to see available commands.');
  }
});
