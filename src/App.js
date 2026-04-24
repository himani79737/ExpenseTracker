import { useState, useEffect, useMemo } from "react";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";

const CATEGORIES = [
  { name: "Food", icon: "🍔", color: "#FF6B6B" },
  { name: "Transport", icon: "🚗", color: "#4ECDC4" },
  { name: "Shopping", icon: "🛍️", color: "#FFE66D" },
  { name: "Entertainment", icon: "🎬", color: "#A78BFA" },
  { name: "Health", icon: "💊", color: "#6EE7B7" },
  { name: "Bills", icon: "📄", color: "#F97316" },
  { name: "Education", icon: "📚", color: "#60A5FA" },
  { name: "Other", icon: "💡", color: "#F472B6" },
];

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function generateId() {
  return Math.random().toString(36).substr(2, 9);
}

function getMonth(dateStr) {
  return new Date(dateStr).getMonth();
}

export default function ExpenseTracker() {
  const [expenses, setExpenses] = useState(() => {
    try {
      const saved = localStorage.getItem("expenses_v1");
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  const [form, setForm] = useState({ title: "", amount: "", category: "Food", date: new Date().toISOString().split("T")[0], note: "" });
  const [filterCategory, setFilterCategory] = useState("All");
  const [filterMonth, setFilterMonth] = useState("All");
  const [activeChart, setActiveChart] = useState("pie");
  const [showForm, setShowForm] = useState(false);
  const [budget, setBudget] = useState(() => parseFloat(localStorage.getItem("budget_v1") || "0"));
  const [editingBudget, setEditingBudget] = useState(false);
  const [budgetInput, setBudgetInput] = useState("");
  const [deleteId, setDeleteId] = useState(null);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    localStorage.setItem("expenses_v1", JSON.stringify(expenses));
  }, [expenses]);

  useEffect(() => {
    localStorage.setItem("budget_v1", budget.toString());
  }, [budget]);

  function showToast(msg, type = "success") {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2500);
  }

  function handleAdd(e) {
    e.preventDefault();
    if (!form.title.trim() || !form.amount || parseFloat(form.amount) <= 0) return;
    const newExp = { id: generateId(), ...form, amount: parseFloat(form.amount) };
    setExpenses(prev => [newExp, ...prev]);
    setForm({ title: "", amount: "", category: "Food", date: new Date().toISOString().split("T")[0], note: "" });
    setShowForm(false);
    showToast("Expense added!");
  }

  function handleDelete(id) {
    setExpenses(prev => prev.filter(e => e.id !== id));
    setDeleteId(null);
    showToast("Expense deleted.", "error");
  }

  const filtered = useMemo(() => {
    return expenses.filter(e => {
      const catOk = filterCategory === "All" || e.category === filterCategory;
      const monOk = filterMonth === "All" || getMonth(e.date) === parseInt(filterMonth);
      return catOk && monOk;
    });
  }, [expenses, filterCategory, filterMonth]);

  const totalSpent = filtered.reduce((s, e) => s + e.amount, 0);

  const pieData = useMemo(() => {
    const map = {};
    filtered.forEach(e => { map[e.category] = (map[e.category] || 0) + e.amount; });
    return Object.entries(map).map(([name, value]) => ({
      name, value, color: CATEGORIES.find(c => c.name === name)?.color || "#ccc"
    }));
  }, [filtered]);

  const barData = useMemo(() => {
    const map = {};
    expenses.forEach(e => {
      const m = MONTHS[getMonth(e.date)];
      map[m] = (map[m] || 0) + e.amount;
    });
    return MONTHS.map(m => ({ month: m, amount: map[m] || 0 }));
  }, [expenses]);

  const catForFilter = CATEGORIES.map(c => c.name);
  const budgetPercent = budget > 0 ? Math.min((totalSpent / budget) * 100, 100) : 0;
  const overBudget = budget > 0 && totalSpent > budget;

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #0f0c29, #302b63, #24243e)",
      fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
      color: "#fff",
      padding: "0",
    }}>
      {/* Toast */}
      {toast && (
        <div style={{
          position: "fixed", top: 24, right: 24, zIndex: 9999,
          background: toast.type === "error" ? "#FF6B6B" : "#6EE7B7",
          color: "#111", padding: "12px 22px", borderRadius: 12,
          fontWeight: 700, fontSize: 14, boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
          animation: "fadeIn 0.3s ease",
        }}>{toast.msg}</div>
      )}

      {/* Delete Confirm */}
      {deleteId && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 9998,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <div style={{
            background: "#1e1b4b", borderRadius: 20, padding: "36px 40px",
            textAlign: "center", boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
            border: "1px solid rgba(255,255,255,0.1)",
          }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🗑️</div>
            <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Delete this expense?</div>
            <div style={{ color: "#aaa", marginBottom: 24, fontSize: 14 }}>This action cannot be undone.</div>
            <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
              <button onClick={() => setDeleteId(null)} style={{ padding: "10px 24px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.2)", background: "transparent", color: "#fff", cursor: "pointer", fontWeight: 600 }}>Cancel</button>
              <button onClick={() => handleDelete(deleteId)} style={{ padding: "10px 24px", borderRadius: 10, border: "none", background: "#FF6B6B", color: "#fff", cursor: "pointer", fontWeight: 700 }}>Delete</button>
            </div>
          </div>
        </div>
      )}

      <div style={{ maxWidth: 980, margin: "0 auto", padding: "32px 16px" }}>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32 }}>
          <div>
            <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: "-0.5px" }}>💸 SpendSmart</div>
            <div style={{ color: "#a78bfa", fontSize: 13, marginTop: 2 }}>Track every rupee, every day</div>
          </div>
          <button onClick={() => setShowForm(v => !v)} style={{
            background: "linear-gradient(135deg, #a78bfa, #6d28d9)",
            border: "none", color: "#fff", padding: "12px 22px",
            borderRadius: 14, cursor: "pointer", fontWeight: 700, fontSize: 15,
            boxShadow: "0 4px 20px rgba(167,139,250,0.4)",
            display: "flex", alignItems: "center", gap: 8,
          }}>
            {showForm ? "✕ Close" : "+ Add Expense"}
          </button>
        </div>

        {/* Add Expense Form */}
        {showForm && (
          <div style={{
            background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 20, padding: "28px", marginBottom: 28,
            backdropFilter: "blur(10px)",
          }}>
            <div style={{ fontSize: 17, fontWeight: 700, marginBottom: 20 }}>New Expense</div>
            <form onSubmit={handleAdd}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <div>
                  <label style={{ fontSize: 12, color: "#a78bfa", fontWeight: 600, display: "block", marginBottom: 6 }}>TITLE *</label>
                  <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                    placeholder="e.g. Zomato order"
                    required style={inputStyle} />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: "#a78bfa", fontWeight: 600, display: "block", marginBottom: 6 }}>AMOUNT (₹) *</label>
                  <input type="number" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                    placeholder="0.00" min="0.01" step="0.01" required style={inputStyle} />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: "#a78bfa", fontWeight: 600, display: "block", marginBottom: 6 }}>CATEGORY</label>
                  <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} style={inputStyle}>
                    {CATEGORIES.map(c => <option key={c.name} value={c.name}>{c.icon} {c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 12, color: "#a78bfa", fontWeight: 600, display: "block", marginBottom: 6 }}>DATE</label>
                  <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} style={inputStyle} />
                </div>
                <div style={{ gridColumn: "1 / -1" }}>
                  <label style={{ fontSize: 12, color: "#a78bfa", fontWeight: 600, display: "block", marginBottom: 6 }}>NOTE (optional)</label>
                  <input value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))}
                    placeholder="Any extra details..." style={inputStyle} />
                </div>
              </div>
              <button type="submit" style={{
                marginTop: 18, width: "100%", padding: "14px",
                background: "linear-gradient(135deg, #a78bfa, #6d28d9)",
                border: "none", borderRadius: 12, color: "#fff",
                fontWeight: 700, fontSize: 16, cursor: "pointer",
                boxShadow: "0 4px 20px rgba(167,139,250,0.35)",
              }}>Add Expense ✓</button>
            </form>
          </div>
        )}

        {/* Stats Row */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 24 }}>
          <StatCard label="Total Spent" value={`₹${totalSpent.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`} icon="💰" color="#a78bfa" />
          <StatCard label="Transactions" value={filtered.length} icon="📋" color="#4ECDC4" />
          <StatCard label="Avg per Entry" value={filtered.length ? `₹${(totalSpent / filtered.length).toFixed(0)}` : "—"} icon="📊" color="#FFE66D" />
        </div>

        {/* Budget Bar */}
        <div style={{
          background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: 18, padding: "20px 24px", marginBottom: 24,
          backdropFilter: "blur(10px)",
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <div style={{ fontWeight: 700 }}>Monthly Budget</div>
            {editingBudget ? (
              <div style={{ display: "flex", gap: 8 }}>
                <input type="number" value={budgetInput} onChange={e => setBudgetInput(e.target.value)}
                  placeholder="Enter budget" style={{ ...inputStyle, width: 140, padding: "6px 12px" }} />
                <button onClick={() => { setBudget(parseFloat(budgetInput) || 0); setEditingBudget(false); }}
                  style={{ padding: "6px 14px", background: "#a78bfa", border: "none", borderRadius: 8, color: "#fff", cursor: "pointer", fontWeight: 700 }}>Set</button>
              </div>
            ) : (
              <button onClick={() => { setEditingBudget(true); setBudgetInput(budget || ""); }}
                style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.2)", color: "#aaa", padding: "6px 14px", borderRadius: 8, cursor: "pointer", fontSize: 13 }}>
                {budget ? `₹${budget.toLocaleString("en-IN")}` : "Set Budget"}
              </button>
            )}
          </div>
          {budget > 0 && (
            <>
              <div style={{ background: "rgba(255,255,255,0.1)", borderRadius: 999, height: 10, overflow: "hidden" }}>
                <div style={{
                  height: "100%", borderRadius: 999,
                  width: `${budgetPercent}%`,
                  background: overBudget ? "#FF6B6B" : "linear-gradient(90deg, #a78bfa, #6d28d9)",
                  transition: "width 0.5s ease",
                }} />
              </div>
              <div style={{ marginTop: 8, fontSize: 13, color: overBudget ? "#FF6B6B" : "#aaa" }}>
                {overBudget
                  ? `⚠️ Over budget by ₹${(totalSpent - budget).toFixed(2)}`
                  : `₹${(budget - totalSpent).toFixed(2)} remaining (${budgetPercent.toFixed(0)}% used)`}
              </div>
            </>
          )}
        </div>

        {/* Charts */}
        <div style={{
          background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: 20, padding: "24px", marginBottom: 24,
          backdropFilter: "blur(10px)",
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <div style={{ fontWeight: 700, fontSize: 16 }}>Spending Overview</div>
            <div style={{ display: "flex", gap: 8 }}>
              {["pie", "bar"].map(t => (
                <button key={t} onClick={() => setActiveChart(t)} style={{
                  padding: "6px 16px", borderRadius: 8, border: "none", cursor: "pointer",
                  background: activeChart === t ? "#a78bfa" : "rgba(255,255,255,0.1)",
                  color: "#fff", fontWeight: 600, fontSize: 13,
                }}>{t === "pie" ? "🍕 Pie" : "📊 Bar"}</button>
              ))}
            </div>
          </div>

          {activeChart === "pie" ? (
            pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={110} innerRadius={55} paddingAngle={3}>
                    {pieData.map((entry, i) => <Cell key={i} fill={entry.color} stroke="transparent" />)}
                  </Pie>
                  <Tooltip formatter={(v) => `₹${v.toFixed(2)}`} contentStyle={{ background: "#1e1b4b", border: "none", borderRadius: 10 }} />
                  <Legend formatter={(v) => <span style={{ color: "#fff", fontSize: 13 }}>{v}</span>} />
                </PieChart>
              </ResponsiveContainer>
            ) : <EmptyChart />
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={barData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <XAxis dataKey="month" tick={{ fill: "#aaa", fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#aaa", fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip formatter={(v) => `₹${v.toFixed(2)}`} contentStyle={{ background: "#1e1b4b", border: "none", borderRadius: 10 }} />
                <Bar dataKey="amount" fill="#a78bfa" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Filters */}
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 18 }}>
          <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)} style={{ ...inputStyle, width: "auto", padding: "8px 14px" }}>
            <option value="All">All Categories</option>
            {catForFilter.map(c => <option key={c}>{c}</option>)}
          </select>
          <select value={filterMonth} onChange={e => setFilterMonth(e.target.value)} style={{ ...inputStyle, width: "auto", padding: "8px 14px" }}>
            <option value="All">All Months</option>
            {MONTHS.map((m, i) => <option key={m} value={i}>{m}</option>)}
          </select>
          {(filterCategory !== "All" || filterMonth !== "All") && (
            <button onClick={() => { setFilterCategory("All"); setFilterMonth("All"); }}
              style={{ padding: "8px 14px", borderRadius: 10, border: "1px solid #FF6B6B", background: "transparent", color: "#FF6B6B", cursor: "pointer", fontWeight: 600, fontSize: 13 }}>
              ✕ Clear
            </button>
          )}
        </div>

        {/* Expense List */}
        <div style={{
          background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: 20, overflow: "hidden", backdropFilter: "blur(10px)",
        }}>
          <div style={{ padding: "20px 24px", borderBottom: "1px solid rgba(255,255,255,0.08)", fontWeight: 700, fontSize: 16 }}>
            Transactions {filtered.length > 0 && <span style={{ color: "#a78bfa", fontSize: 13, marginLeft: 8 }}>({filtered.length})</span>}
          </div>
          {filtered.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px 20px", color: "#666" }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>🪹</div>
              <div style={{ fontWeight: 600 }}>No expenses found</div>
              <div style={{ fontSize: 13, marginTop: 6 }}>Add your first expense to get started!</div>
            </div>
          ) : (
            filtered.map((exp, i) => {
              const cat = CATEGORIES.find(c => c.name === exp.category);
              return (
                <div key={exp.id} style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "16px 24px",
                  borderBottom: i < filtered.length - 1 ? "1px solid rgba(255,255,255,0.06)" : "none",
                  transition: "background 0.2s",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                    <div style={{
                      width: 44, height: 44, borderRadius: 12,
                      background: `${cat?.color}22`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 20, flexShrink: 0,
                      border: `1px solid ${cat?.color}44`,
                    }}>{cat?.icon}</div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 15 }}>{exp.title}</div>
                      <div style={{ fontSize: 12, color: "#888", marginTop: 2 }}>
                        <span style={{ color: cat?.color }}>{exp.category}</span>
                        {" · "}{new Date(exp.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                        {exp.note && <span style={{ color: "#666" }}> · {exp.note}</span>}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                    <div style={{ fontWeight: 800, fontSize: 16, color: "#FF6B6B" }}>
                      -₹{exp.amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </div>
                    <button onClick={() => setDeleteId(exp.id)} style={{
                      background: "rgba(255,107,107,0.1)", border: "1px solid rgba(255,107,107,0.2)",
                      color: "#FF6B6B", width: 34, height: 34, borderRadius: 8,
                      cursor: "pointer", fontSize: 15, display: "flex", alignItems: "center", justifyContent: "center",
                    }}>🗑</button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div style={{ textAlign: "center", marginTop: 28, color: "#444", fontSize: 12 }}>
          Built with React + localStorage · SpendSmart 2025
        </div>
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
        input[type="date"]::-webkit-calendar-picker-indicator { filter: invert(1); }
        select option { background: #1e1b4b; }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #a78bfa44; border-radius: 99px; }
      `}</style>
    </div>
  );
}

function StatCard({ label, value, icon, color }) {
  return (
    <div style={{
      background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
      borderRadius: 18, padding: "20px", backdropFilter: "blur(10px)",
    }}>
      <div style={{ fontSize: 24, marginBottom: 8 }}>{icon}</div>
      <div style={{ fontSize: 22, fontWeight: 800, color }}>{value}</div>
      <div style={{ fontSize: 12, color: "#888", marginTop: 4 }}>{label}</div>
    </div>
  );
}

function EmptyChart() {
  return (
    <div style={{ textAlign: "center", padding: "60px 0", color: "#555" }}>
      <div style={{ fontSize: 36, marginBottom: 8 }}>📉</div>
      <div>No data to display yet</div>
    </div>
  );
}

const inputStyle = {
  width: "100%", padding: "11px 14px",
  background: "rgba(255,255,255,0.07)",
  border: "1px solid rgba(255,255,255,0.12)",
  borderRadius: 10, color: "#fff",
  fontSize: 14, outline: "none",
};