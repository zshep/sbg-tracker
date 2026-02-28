import { useMemo, useState } from "react";
import { NavLink } from "react-router-dom";

export default function NavBar() {
  const [collapsed, setCollapsed] = useState(false);

  const links = useMemo(
    () => [
      { to: "/dashboard", label: "Classes", icon: "🏫" },
      { to: "/standardslist", label: "Standards", icon: "🎯" },
      { to: "/studentlist", label: "Students", icon: "👥" },
    ],
    []
  );

  return (
    <aside className={`sidebar ${collapsed ? "is-collapsed" : ""}`}>
      <div className="sidebar__topRow">
        <div className="sidebar__brand">
          {/* hide this when collapsed */}
          {!collapsed && <span className="sidebar__brandIcon">SBG</span>}
          {!collapsed && <span className="sidebar__brandText">Tracker</span>}
        </div>

        <button
          type="button"
          onClick={() => setCollapsed((v) => !v)}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="sidebar__collapseBtn"
        >
          {collapsed ? "➡️" : "⬅️"}
        </button>
      </div>

      <nav className="sidebar__nav">
        {links.map((l) => (
          <NavLink
            key={l.to}
            to={l.to}
            className={({ isActive }) =>
              `sidebar__link ${isActive ? "is-active" : ""} ${
                collapsed ? "is-centered" : ""
              }`
            }
          >
            <span className="sidebar__icon" aria-hidden="true">
              {l.icon}
            </span>
            {!collapsed && <span className="sidebar__label">{l.label}</span>}
          </NavLink>
        ))}
      </nav>

      <div className="sidebar__footer">
        {!collapsed && <p className="sidebar__footerText">v1 • teacher-only</p>}
      </div>
    </aside>
  );
}