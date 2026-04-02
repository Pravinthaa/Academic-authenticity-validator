import React from 'react';

const DashboardLayout = ({ sidebar, children }) => {
  return (
    <div className="dashboard-shell">
      <aside className="sidebar">{sidebar}</aside>
      <main className="dashboard-main">{children}</main>
    </div>
  );
};

export default DashboardLayout;
