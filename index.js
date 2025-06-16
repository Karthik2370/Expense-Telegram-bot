require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');

// Get token from environment variables
const token = process.env.BOT_TOKEN;

// Create a bot that uses 'polling' to fetch new updates
const bot = new TelegramBot(token, { polling: true });

// Store expenses and money in memory (in a real app, you'd use a database)
const userExpenses = new Map();
const userMoney = new Map();

// Helper function to format currency
const formatCurrency = (amount) => {
  return `₹${amount.toFixed(2)}`;
};

// Helper function to get balance message
const getBalanceMessage = (availableMoney, totalExpenses, remainingBalance) => {
  let message = '';
  
  if (remainingBalance < 0) {
    message = `⚠️ WARNING: You're overspending!\n` +
      `You've exceeded your budget by ${formatCurrency(Math.abs(remainingBalance))}\n\n`;
  } else if (remainingBalance < (availableMoney * 0.2)) { // Less than 20% remaining
    message = `⚠️ ALERT: You're close to your budget limit!\n` +
      `Only ${formatCurrency(remainingBalance)} remaining\n\n`;
  }

  message += `💰 Balance Summary:\n\n` +
    `Available Money: ${formatCurrency(availableMoney)}\n` +
    `Total Expenses: ${formatCurrency(totalExpenses)}\n` +
    `Remaining Balance: ${formatCurrency(remainingBalance)}`;

  return message;
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
    `/money <amount> - Set your available money\n` +
    `/balance - Check your remaining balance\n` +
    `/invite - Get bot invite link\n` +
    `/help - Show this help message\n\n` +
    `Example: /add 500 Lunch at restaurant`;
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

  // Update balance message
  const totalExpenses = userExpenses.get(chatId).reduce((sum, exp) => sum + exp.amount, 0);
  const availableMoney = userMoney.get(chatId) || 0;
  const remainingBalance = availableMoney - totalExpenses;

  let message = `✅ Added expense:\n` +
    `Amount: ${formatCurrency(amount)}\n` +
    `Description: ${description}\n\n`;

  if (remainingBalance < 0) {
    message += `⚠️ WARNING: You're overspending!\n` +
      `You've exceeded your budget by ${formatCurrency(Math.abs(remainingBalance))}\n\n`;
  } else if (remainingBalance < (availableMoney * 0.2)) {
    message += `⚠️ ALERT: You're close to your budget limit!\n` +
      `Only ${formatCurrency(remainingBalance)} remaining\n\n`;
  }

  message += `Remaining Balance: ${formatCurrency(remainingBalance)}`;
  bot.sendMessage(chatId, message);
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
  const availableMoney = userMoney.get(chatId) || 0;
  const remainingBalance = availableMoney - total;

  bot.sendMessage(chatId, getBalanceMessage(availableMoney, total, remainingBalance));
});

// Set money
bot.onText(/\/money (.+)/, (msg, match) => {
  const chatId = msg.chat.id;
  const amount = parseFloat(match[1]);

  if (isNaN(amount)) {
    return bot.sendMessage(chatId, 'Please enter a valid amount');
  }

  userMoney.set(chatId, amount);
  const totalExpenses = (userExpenses.get(chatId) || []).reduce((sum, exp) => sum + exp.amount, 0);
  const remainingBalance = amount - totalExpenses;

  bot.sendMessage(chatId, getBalanceMessage(amount, totalExpenses, remainingBalance));
});

// Check balance
bot.onText(/\/balance/, (msg) => {
  const chatId = msg.chat.id;
  const availableMoney = userMoney.get(chatId) || 0;
  const totalExpenses = (userExpenses.get(chatId) || []).reduce((sum, exp) => sum + exp.amount, 0);
  const remainingBalance = availableMoney - totalExpenses;

  if (availableMoney === 0) {
    return bot.sendMessage(chatId, 'Please set your available money first using /money <amount>');
  }

  bot.sendMessage(chatId, getBalanceMessage(availableMoney, totalExpenses, remainingBalance));
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
  const availableMoney = userMoney.get(chatId) || 0;
  const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);
  const remainingBalance = availableMoney - totalExpenses;

  let message = `🗑️ Deleted expense:\n` +
    `Amount: ${formatCurrency(deletedExpense.amount)}\n` +
    `Description: ${deletedExpense.description}\n\n`;

  if (remainingBalance < 0) {
    message += `⚠️ WARNING: You're still overspending!\n` +
      `You've exceeded your budget by ${formatCurrency(Math.abs(remainingBalance))}\n\n`;
  } else if (remainingBalance < (availableMoney * 0.2)) {
    message += `⚠️ ALERT: You're close to your budget limit!\n` +
      `Only ${formatCurrency(remainingBalance)} remaining\n\n`;
  }

  message += `Remaining Balance: ${formatCurrency(remainingBalance)}`;
  bot.sendMessage(chatId, message);
});

// Invite command
bot.onText(/\/invite/, (msg) => {
  const chatId = msg.chat.id;
  bot.getMe().then((botInfo) => {
    const inviteLink = `https://t.me/${botInfo.username}`;
    bot.sendMessage(chatId, 
      `🤖 Invite others to use this bot!\n\n` +
      `Share this link:\n${inviteLink}`
    );
  });
});

// Help command
bot.onText(/\/help/, (msg) => {
  const chatId = msg.chat.id;
  const helpMessage = `Available commands:\n\n` +
    `/add <amount> <description> - Add an expense\n` +
    `/list - View all your expenses\n` +
    `/total - Get total expenses\n` +
    `/delete <expense_number> - Delete an expense\n` +
    `/money <amount> - Set your available money\n` +
    `/balance - Check your remaining balance\n` +
    `/invite - Get bot invite link\n` +
    `/help - Show this help message\n\n` +
    `Example: /add 500 Lunch at restaurant`;
  bot.sendMessage(chatId, helpMessage);
});

// Handle all other messages
bot.on('message', (msg) => {
  const chatId = msg.chat.id;
  const receivedText = msg.text;

  if (receivedText && !receivedText.startsWith('/')) {
    // Show help menu for any non-command message
    const helpMessage = `Available commands:\n\n` +
      `/add <amount> <description> - Add an expense\n` +
      `/list - View all your expenses\n` +
      `/total - Get total expenses\n` +
      `/delete <expense_number> - Delete an expense\n` +
      `/money <amount> - Set your available money\n` +
      `/balance - Check your remaining balance\n` +
      `/invite - Get bot invite link\n` +
      `/help - Show this help message\n\n` +
      `Example: /add 500 Lunch at restaurant`;
    bot.sendMessage(chatId, helpMessage);
  }
});
