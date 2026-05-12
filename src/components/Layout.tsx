import { NavLink, Outlet } from "react-router-dom";
import styles from "./Layout.module.css";

export default function Layout() {
  return (
    <div className={styles.app}>
      <nav className={styles.nav}>
        <div className={styles.brand}>
          <span className={styles.logo}>⚛️</span>
          <span>React Learn</span>
        </div>
        <div className={styles.links}>
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `${styles.link} ${isActive ? styles.linkActive : ""}`
            }
          >
            📚 Темы
          </NavLink>
          <NavLink
            to="/playground"
            className={({ isActive }) =>
              `${styles.link} ${isActive ? styles.linkActive : ""}`
            }
          >
            🛠️ Песочница
          </NavLink>
        </div>
      </nav>
      <main className={styles.main}>
        <Outlet />
      </main>
    </div>
  );
}
