import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database("fintrack.db");

// Initialize Database
db.exec(`
  CREATE TABLE IF NOT EXISTS accounts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    balance REAL DEFAULT 0,
    icon TEXT,
    color TEXT
  );

  CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    parent_id INTEGER,
    type TEXT NOT NULL, -- 'income' or 'expense'
    icon TEXT,
    color TEXT,
    FOREIGN KEY (parent_id) REFERENCES categories(id)
  );

  CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT NOT NULL, -- 'income', 'expense', 'transfer'
    amount REAL NOT NULL,
    date TEXT NOT NULL,
    category_id INTEGER,
    account_id INTEGER NOT NULL,
    to_account_id INTEGER,
    notes TEXT,
    FOREIGN KEY (category_id) REFERENCES categories(id),
    FOREIGN KEY (account_id) REFERENCES accounts(id),
    FOREIGN KEY (to_account_id) REFERENCES accounts(id)
  );

  CREATE TABLE IF NOT EXISTS budgets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category_id INTEGER, -- NULL for global budget
    amount REAL NOT NULL,
    period TEXT DEFAULT 'monthly',
    FOREIGN KEY (category_id) REFERENCES categories(id)
  );

  CREATE TABLE IF NOT EXISTS recurring_transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT NOT NULL,
    amount REAL NOT NULL,
    category_id INTEGER,
    account_id INTEGER NOT NULL,
    frequency TEXT NOT NULL, -- 'daily', 'weekly', 'monthly', 'yearly'
    next_date TEXT NOT NULL,
    FOREIGN KEY (category_id) REFERENCES categories(id),
    FOREIGN KEY (account_id) REFERENCES accounts(id)
  );
`);

// Seed initial data if empty
const accountCount = db.prepare("SELECT COUNT(*) as count FROM accounts").get() as { count: number };
if (accountCount.count === 0) {
  db.prepare("INSERT INTO accounts (name, type, balance, icon, color) VALUES (?, ?, ?, ?, ?)").run("Main Wallet", "cash", 1000, "Wallet", "#10b981");
  db.prepare("INSERT INTO accounts (name, type, balance, icon, color) VALUES (?, ?, ?, ?, ?)").run("Savings", "bank", 5000, "Landmark", "#3b82f6");
  
  db.prepare("INSERT INTO categories (name, type, icon, color) VALUES (?, ?, ?, ?)").run("Food & Drinks", "expense", "Utensils", "#ef4444");
  db.prepare("INSERT INTO categories (name, type, icon, color) VALUES (?, ?, ?, ?)").run("Salary", "income", "Banknote", "#10b981");
  db.prepare("INSERT INTO categories (name, type, icon, color) VALUES (?, ?, ?, ?)").run("Rent", "expense", "Home", "#f59e0b");
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.get("/api/summary", (req, res) => {
    const totalBalance = db.prepare("SELECT SUM(balance) as total FROM accounts").get() as { total: number };
    const currentMonth = new Date().toISOString().slice(0, 7);
    const monthlyIncome = db.prepare("SELECT SUM(amount) as total FROM transactions WHERE type = 'income' AND date LIKE ?").get(`${currentMonth}%`) as { total: number };
    const monthlyExpense = db.prepare("SELECT SUM(amount) as total FROM transactions WHERE type = 'expense' AND date LIKE ?").get(`${currentMonth}%`) as { total: number };
    
    res.json({
      totalBalance: totalBalance.total || 0,
      monthlyIncome: monthlyIncome.total || 0,
      monthlyExpense: monthlyExpense.total || 0
    });
  });

  app.get("/api/accounts", (req, res) => {
    const accounts = db.prepare("SELECT * FROM accounts").all();
    res.json(accounts);
  });

  app.post("/api/accounts", (req, res) => {
    const { name, type, balance, icon, color } = req.body;
    const result = db.prepare("INSERT INTO accounts (name, type, balance, icon, color) VALUES (?, ?, ?, ?, ?)").run(name, type, balance, icon, color);
    res.json({ id: result.lastInsertRowid });
  });

  app.get("/api/categories", (req, res) => {
    const categories = db.prepare("SELECT * FROM categories").all();
    res.json(categories);
  });

  app.post("/api/categories", (req, res) => {
    const { name, parent_id, type, icon, color } = req.body;
    const result = db.prepare("INSERT INTO categories (name, parent_id, type, icon, color) VALUES (?, ?, ?, ?, ?)").run(name, parent_id, type, icon, color);
    res.json({ id: result.lastInsertRowid });
  });

  app.get("/api/transactions", (req, res) => {
    const { startDate, endDate, categoryId, accountId } = req.query;
    let query = `
      SELECT t.*, c.name as category_name, a.name as account_name 
      FROM transactions t
      LEFT JOIN categories c ON t.category_id = c.id
      JOIN accounts a ON t.account_id = a.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (startDate) { query += " AND t.date >= ?"; params.push(startDate); }
    if (endDate) { query += " AND t.date <= ?"; params.push(endDate); }
    if (categoryId) { query += " AND t.category_id = ?"; params.push(categoryId); }
    if (accountId) { query += " AND t.account_id = ?"; params.push(accountId); }

    query += " ORDER BY t.date DESC, t.id DESC";
    const transactions = db.prepare(query).all(...params);
    res.json(transactions);
  });

  app.post("/api/transactions", (req, res) => {
    const { type, amount, date, category_id, account_id, to_account_id, notes } = req.body;
    
    const transaction = db.transaction(() => {
      const result = db.prepare("INSERT INTO transactions (type, amount, date, category_id, account_id, to_account_id, notes) VALUES (?, ?, ?, ?, ?, ?, ?)").run(type, amount, date, category_id, account_id, to_account_id, notes);
      
      if (type === 'income') {
        db.prepare("UPDATE accounts SET balance = balance + ? WHERE id = ?").run(amount, account_id);
      } else if (type === 'expense') {
        db.prepare("UPDATE accounts SET balance = balance - ? WHERE id = ?").run(amount, account_id);
      } else if (type === 'transfer') {
        db.prepare("UPDATE accounts SET balance = balance - ? WHERE id = ?").run(amount, account_id);
        db.prepare("UPDATE accounts SET balance = balance + ? WHERE id = ?").run(amount, to_account_id);
      }
      
      return result.lastInsertRowid;
    });

    const id = transaction();
    res.json({ id });
  });

  app.get("/api/budgets", (req, res) => {
    const budgets = db.prepare(`
      SELECT b.*, c.name as category_name, 
      (SELECT SUM(amount) FROM transactions WHERE category_id = b.category_id AND date LIKE ?) as spent
      FROM budgets b
      LEFT JOIN categories c ON b.category_id = c.id
    `).all(`${new Date().toISOString().slice(0, 7)}%`);
    res.json(budgets);
  });

  app.post("/api/budgets", (req, res) => {
    const { category_id, amount, period } = req.body;
    const result = db.prepare("INSERT INTO budgets (category_id, amount, period) VALUES (?, ?, ?)").run(category_id, amount, period);
    res.json({ id: result.lastInsertRowid });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
