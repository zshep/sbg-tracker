// app/components/Dashboard/NavBar.jsx
import { useMemo, useState } from "react";
import { NavLink } from "react-router-dom";

export default function NavBar() {
  const [collapsed, setCollapsed] = useState(false);

  const links = useMemo(
    () => [
      { to: "/dashboard", label: "Classes", icon: "🏫" },
      { to: "/standards", label: "Standards", icon: "🎯" },
      { to: "/evidence", label: "Evidence", icon: "🧾" },
      { to: "/studentlist", label: "Students", icon: "👥" },
    ],
    []
  );

  return (
    <aside style={{ ...styles.sidebar, width: collapsed ? 64 : 220 }}>
      <div style={styles.topRow}>
        <div style={styles.brand}>
          <span style={styles.brandIcon}>SBG</span>
          {!collapsed && <span style={styles.brandText}>Tracker</span>}
        </div>

        <button
          type="button"
          onClick={() => setCollapsed((v) => !v)}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          style={styles.collapseBtn}
        >
          {collapsed ? "➡️" : "⬅️"}
        </button>
      </div>

      <nav style={styles.nav}>
        {links.map((l) => (
          <NavLink
            key={l.to}
            to={l.to}
            style={({ isActive }) => ({
              ...styles.link,
              ...(isActive ? styles.linkActive : null),
              justifyContent: collapsed ? "center" : "flex-start",
            })}
          >
            <span style={styles.icon} aria-hidden="true">
              {l.icon}
            </span>
            {!collapsed && <span style={styles.label}>{l.label}</span>}
          </NavLink>
        ))}
      </nav>

      <div style={styles.footer}>
        {!collapsed && <p style={styles.footerText}>v1 • teacher-only</p>}
      </div>
    </aside>
  );
}

const styles = {
  sidebar: {
    height: "100vh",
    position: "sticky",
    top: 0,
    borderRight: "1px solid #e5e7eb",
    background: "#fff",
    display: "flex",
    flexDirection: "column",
    padding: 12,
    boxSizing: "border-box",
  },
  topRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    marginBottom: 12,
  },
  brand: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    minWidth: 0,
  },
  brandIcon: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: 36,
    height: 36,
    borderRadius: 10,
    background: "#111827",
    color: "#fff",
    fontWeight: 700,
    fontSize: 12,
    letterSpacing: 0.5,
  },
  brandText: {
    fontWeight: 700,
    color: "#111827",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  collapseBtn: {
    border: "1px solid #e5e7eb",
    background: "#fff",
    borderRadius: 10,
    width: 36,
    height: 36,
    cursor: "pointer",
  },
  nav: {
    display: "flex",
    flexDirection: "column",
    gap: 6,
    marginTop: 8,
  },
  link: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "10px 10px",
    borderRadius: 12,
    textDecoration: "none",
    color: "#111827",
    border: "1px solid transparent",
  },
  linkActive: {
    background: "#f3f4f6",
    border: "1px solid #e5e7eb",
  },
  icon: {
    width: 22,
    display: "inline-flex",
    justifyContent: "center",
  },
  label: {
    fontSize: 14,
    fontWeight: 600,
  },
  footer: {
    marginTop: "auto",
    paddingTop: 12,
  },
  footerText: {
    margin: 0,
    fontSize: 12,
    color: "#6b7280",
  },
};