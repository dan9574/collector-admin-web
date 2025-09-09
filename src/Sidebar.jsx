import { Link, useLocation } from "react-router-dom";


export default function Sidebar({ onLogout, realName = "周明远", position = "高级数据工程师" }) {
  const location = useLocation();

  // 注销点击事件，优先用props
  const handleLogout = () => {
    if (onLogout) onLogout();
    // fallback: window.location.href = "/login";
  };

  return (
    <div
      style={{
        width: 300,
        background: "#181e29",
        color: "#fff",
        height: "100vh",
        position: 'fixed',
        top: 0,
        left: 0,
        zIndex: 100,
        boxShadow: '2px 0 8px 0 rgba(0,0,0,0.04)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
      }}
    >
      <div>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          padding: '20px',
          borderBottom: '1px solid #232a3a',
          height: 64,
          boxSizing: 'border-box',
        }}>
          <div style={{
            width: 32,
            height: 32,
            background: '#2563eb',
            borderRadius: 4,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <i className="fas fa-spider" style={{ color: '#fff', fontSize: 20 }} />
          </div>
          <span style={{
            marginLeft: 8,
            fontFamily: 'Pacifico, cursive',
            fontSize: 24,
            color: '#fff',
            letterSpacing: 1,
          }}>
            logo
          </span>
        </div>
        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {[
            { path: "/templates", label: "模板中心", icon: "fas fa-th-large" },
            { path: "/tasks", label: "任务管理", icon: "fas fa-tasks" },
            { path: "/system", label: "系统管理", icon: "fas fa-cog" },
          ].map((menu, idx, arr) => {
            const active = location.pathname.startsWith(menu.path);
            const isLast = idx === arr.length - 1;
            return (
              <li key={menu.path}>
                <Link
                  to={menu.path}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    padding: "12px 24px",
                    color: active ? "#fff" : "#b0b8c9",
                    background: active ? "#232a3a" : "transparent",
                    textDecoration: "none",
                    fontSize: 16,
                    fontWeight: 500,
                    borderRadius: 8,
                    marginBottom: isLast ? 0 : 16,
                    transition: "all 0.2s",
                  }}
                  onMouseEnter={e => {
                    if (!active) e.currentTarget.style.background = '#232a3a';
                    e.currentTarget.style.color = '#fff';
                  }}
                  onMouseLeave={e => {
                    if (!active) e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = active ? '#fff' : '#b0b8c9';
                  }}
                >
                  <i className={menu.icon} style={{ width: 24, textAlign: 'center', marginRight: 12, fontSize: 18 }} />
                  <span>{menu.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
      {/* 底部用户信息+注销 */}
      <div
        style={{
          padding: '16px',
          borderTop: '1px solid #232a3a',
          background: '#181e29',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            position: 'relative',
          }}
          className="sidebar-userinfo-group"
        >
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{
              width: 40,
              height: 40,
              borderRadius: '50%',
              background: '#232a3a',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <i className="fas fa-user-circle" style={{ color: '#fff', fontSize: 28 }} />
            </div>
            <div style={{ marginLeft: 12 }}>
              <div style={{ fontSize: 16, fontWeight: 500, color: '#fff', lineHeight: 1 }}>{realName}</div>
              <div style={{ fontSize: 13, color: '#b0b8c9', lineHeight: 1.5 }}>{position}</div>
            </div>
          </div>
          <button
            className="sidebar-logout-btn"
            style={{
              marginLeft: 16,
              background: 'transparent',
              border: 'none',
              color: '#2563eb',
              fontSize: 16,
              fontWeight: 500,
              cursor: 'pointer',
              opacity: 0,
              transition: 'opacity 0.2s',
            }}
            onClick={handleLogout}
            tabIndex={-1}
          >
            注销
          </button>
        </div>
        <style>{`
          .sidebar-userinfo-group:hover .sidebar-logout-btn {
            opacity: 1 !important;
          }
        `}</style>
      </div>
    </div>
  );
}
