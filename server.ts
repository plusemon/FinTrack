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
    type TEXT NOT NULL, -- 'income', 'expense', 'transfer', 'due'
    amount REAL NOT NULL,
    date TEXT NOT NULL,
    category_id INTEGER,
    account_id INTEGER NOT NULL,
    to_account_id INTEGER,
    notes TEXT,
    status TEXT DEFAULT 'paid', -- 'paid', 'unpaid'
    due_date TEXT,
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

  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
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

// Ensure default settings
const currencySetting = db.prepare("SELECT * FROM settings WHERE key = ?").get("currency");
if (!currencySetting) {
  db.prepare("INSERT INTO settings (key, value) VALUES (?, ?)").run("currency", "BDT");
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // API Routes
  app.get("/api/summary", (req, res) => {
    try {
      const totalBalance = db.prepare("SELECT SUM(balance) as total FROM accounts").get() as { total: number | null };
      const currentMonth = new Date().toISOString().slice(0, 7);
      const monthlyIncome = db.prepare("SELECT SUM(amount) as total FROM transactions WHERE type = 'income' AND date LIKE ?").get(`${currentMonth}%`) as { total: number | null };
      const monthlyExpense = db.prepare("SELECT SUM(amount) as total FROM transactions WHERE (type = 'expense' OR (type = 'due' AND status = 'paid')) AND date LIKE ?").get(`${currentMonth}%`) as { total: number | null };
      
      res.json({
        totalBalance: totalBalance?.total || 0,
        monthlyIncome: monthlyIncome?.total || 0,
        monthlyExpense: monthlyExpense?.total || 0
      });
    } catch (error) {
      console.error("Error in /api/summary:", error);
      res.status(500).json({ error: "Failed to fetch summary" });
    }
  });

  app.get("/api/accounts", (req, res) => {
    try {
      const accounts = db.prepare("SELECT * FROM accounts").all();
      res.json(accounts);
    } catch (error) {
      console.error("Error in GET /api/accounts:", error);
      res.status(500).json({ error: "Failed to fetch accounts" });
    }
  });

  app.post("/api/accounts", (req, res) => {
    try {
      const { name, type, balance, icon, color } = req.body;
      const result = db.prepare("INSERT INTO accounts (name, type, balance, icon, color) VALUES (?, ?, ?, ?, ?)").run(name, type, balance, icon, color);
      res.json({ id: result.lastInsertRowid });
    } catch (error) {
      console.error("Error in POST /api/accounts:", error);
      res.status(500).json({ error: "Failed to add account" });
    }
  });

  app.get("/api/categories", (req, res) => {
    try {
      const categories = db.prepare("SELECT * FROM categories").all();
      res.json(categories);
    } catch (error) {
      console.error("Error in GET /api/categories:", error);
      res.status(500).json({ error: "Failed to fetch categories" });
    }
  });

  app.post("/api/categories", (req, res) => {
    try {
      const { name, parent_id, type, icon, color } = req.body;
      const result = db.prepare("INSERT INTO categories (name, parent_id, type, icon, color) VALUES (?, ?, ?, ?, ?)").run(name, parent_id, type, icon, color);
      res.json({ id: result.lastInsertRowid });
    } catch (error) {
      console.error("Error in POST /api/categories:", error);
      res.status(500).json({ error: "Failed to add category" });
    }
  });

  app.get("/api/transactions", (req, res) => {
    try {
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
    } catch (error) {
      console.error("Error in GET /api/transactions:", error);
      res.status(500).json({ error: "Failed to fetch transactions" });
    }
  });

  app.post("/api/transactions", (req, res) => {
    try {
      const { type, amount, date, category_id, account_id, to_account_id, notes, status, due_date } = req.body;
      
      const transaction = db.transaction(() => {
        const result = db.prepare("INSERT INTO transactions (type, amount, date, category_id, account_id, to_account_id, notes, status, due_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)").run(
          type, 
          amount, 
          date, 
          category_id || null, 
          account_id, 
          to_account_id || null, 
          notes || null, 
          status || 'paid', 
          due_date || null
        );
        
        if (status !== 'unpaid') {
          if (type === 'income') {
            db.prepare("UPDATE accounts SET balance = balance + ? WHERE id = ?").run(amount, account_id);
          } else if (type === 'expense' || type === 'due') {
            db.prepare("UPDATE accounts SET balance = balance - ? WHERE id = ?").run(amount, account_id);
          } else if (type === 'transfer') {
            db.prepare("UPDATE accounts SET balance = balance - ? WHERE id = ?").run(amount, account_id);
            db.prepare("UPDATE accounts SET balance = balance + ? WHERE id = ?").run(amount, to_account_id);
          }
        }
        
        return result.lastInsertRowid;
      });

      const id = transaction();
      res.json({ id });
    } catch (error) {
      console.error("Error in POST /api/transactions:", error);
      res.status(500).json({ error: "Failed to add transaction" });
    }
  });

  app.put("/api/transactions/:id", (req, res) => {
    try {
      const { id } = req.params;
      const { type, amount, date, category_id, account_id, to_account_id, notes, status, due_date } = req.body;

      const updateTransaction = db.transaction(() => {
        // 1. Get old transaction
        const old = db.prepare("SELECT * FROM transactions WHERE id = ?").get(id) as any;
        if (!old) return false;

        // 2. Reverse old transaction's effect on balances if it was paid
        if (old.status !== 'unpaid') {
          if (old.type === 'income') {
            db.prepare("UPDATE accounts SET balance = balance - ? WHERE id = ?").run(old.amount, old.account_id);
          } else if (old.type === 'expense' || old.type === 'due') {
            db.prepare("UPDATE accounts SET balance = balance + ? WHERE id = ?").run(old.amount, old.account_id);
          } else if (old.type === 'transfer') {
            db.prepare("UPDATE accounts SET balance = balance + ? WHERE id = ?").run(old.amount, old.account_id);
            db.prepare("UPDATE accounts SET balance = balance - ? WHERE id = ?").run(old.amount, old.to_account_id);
          }
        }

        // 3. Update transaction
        db.prepare(`
          UPDATE transactions 
          SET type = ?, amount = ?, date = ?, category_id = ?, account_id = ?, to_account_id = ?, notes = ?, status = ?, due_date = ?
          WHERE id = ?
        `).run(type, amount, date, category_id || null, account_id, to_account_id || null, notes || null, status || 'paid', due_date || null, id);

        // 4. Apply new transaction's effect on balances if it is paid
        if (status !== 'unpaid') {
          if (type === 'income') {
            db.prepare("UPDATE accounts SET balance = balance + ? WHERE id = ?").run(amount, account_id);
          } else if (type === 'expense' || type === 'due') {
            db.prepare("UPDATE accounts SET balance = balance - ? WHERE id = ?").run(amount, account_id);
          } else if (type === 'transfer') {
            db.prepare("UPDATE accounts SET balance = balance - ? WHERE id = ?").run(amount, account_id);
            db.prepare("UPDATE accounts SET balance = balance + ? WHERE id = ?").run(amount, to_account_id);
          }
        }

        return true;
      });

      const success = updateTransaction();
      if (success) {
        res.json({ success: true });
      } else {
        res.status(404).json({ error: "Transaction not found" });
      }
    } catch (error) {
      console.error("Error in PUT /api/transactions:", error);
      res.status(500).json({ error: "Failed to update transaction" });
    }
  });

  app.delete("/api/transactions/:id", (req, res) => {
    try {
      const { id } = req.params;

      const deleteTransaction = db.transaction(() => {
        const old = db.prepare("SELECT * FROM transactions WHERE id = ?").get(id) as any;
        if (!old) return false;

        if (old.status !== 'unpaid') {
          if (old.type === 'income') {
            db.prepare("UPDATE accounts SET balance = balance - ? WHERE id = ?").run(old.amount, old.account_id);
          } else if (old.type === 'expense' || old.type === 'due') {
            db.prepare("UPDATE accounts SET balance = balance + ? WHERE id = ?").run(old.amount, old.account_id);
          } else if (old.type === 'transfer') {
            db.prepare("UPDATE accounts SET balance = balance + ? WHERE id = ?").run(old.amount, old.account_id);
            db.prepare("UPDATE accounts SET balance = balance - ? WHERE id = ?").run(old.amount, old.to_account_id);
          }
        }

        db.prepare("DELETE FROM transactions WHERE id = ?").run(id);
        return true;
      });

      const success = deleteTransaction();
      if (success) {
        res.json({ success: true });
      } else {
        res.status(404).json({ error: "Transaction not found" });
      }
    } catch (error) {
      console.error("Error in DELETE /api/transactions:", error);
      res.status(500).json({ error: "Failed to delete transaction" });
    }
  });

  app.get("/api/budgets", (req, res) => {
    try {
      const budgets = db.prepare(`
        SELECT b.*, c.name as category_name, 
        (SELECT SUM(amount) FROM transactions WHERE (category_id = b.category_id OR (category_id IS NULL AND b.category_id IS NULL)) AND status = 'paid' AND date LIKE ?) as spent
        FROM budgets b
        LEFT JOIN categories c ON b.category_id = c.id
      `).all(`${new Date().toISOString().slice(0, 7)}%`);
      res.json(budgets);
    } catch (error) {
      console.error("Error in /api/budgets:", error);
      res.status(500).json({ error: "Failed to fetch budgets" });
    }
  });

  app.post("/api/budgets", (req, res) => {
    try {
      const { category_id, amount, period } = req.body;
      const result = db.prepare("INSERT INTO budgets (category_id, amount, period) VALUES (?, ?, ?)").run(category_id || null, amount, period);
      res.json({ id: result.lastInsertRowid });
    } catch (error) {
      console.error("Error in POST /api/budgets:", error);
      res.status(500).json({ error: "Failed to add budget" });
    }
  });

  app.get("/api/settings", (req, res) => {
    try {
      const settings = db.prepare("SELECT * FROM settings").all();
      const settingsObj = settings.reduce((acc: any, curr: any) => {
        acc[curr.key] = curr.value;
        return acc;
      }, {});
      res.json(settingsObj);
    } catch (error) {
      console.error("Error in GET /api/settings:", error);
      res.status(500).json({ error: "Failed to fetch settings" });
    }
  });

  app.post("/api/settings", (req, res) => {
    try {
      const { key, value } = req.body;
      db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)").run(key, value);
      res.json({ success: true });
    } catch (error) {
      console.error("Error in POST /api/settings:", error);
      res.status(500).json({ error: "Failed to update setting" });
    }
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
