/**
 * Admin Dashboard Component
 * Manage users, errands, and view statistics
 */

import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

export default function AdminDashboard({ onLogout }) {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalAgents: 0,
    totalCustomers: 0,
    totalErrands: 0,
    activeErrands: 0,
    completedErrands: 0,
    cancelledErrands: 0,
    totalRevenue: 0,
  });
  const [allErrands, setAllErrands] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    loadAdminData();
  }, []);

  const loadAdminData = async () => {
    const { data: users } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });

    const { data: errands } = await supabase
      .from('errands')
      .select(
        `
         *,
         customer:users!errands_customer_id_fkey(name, phone_number),
         agent:users!errands_agent_id_fkey(name, phone_number)
       `
      )
      .order('created_at', { ascending: false });

    const agents = users?.filter((u) => u.user_type === 'agent').length || 0;
    const customers =
      users?.filter((u) => u.user_type === 'customer').length || 0;
    const active =
      errands?.filter(
        (e) => e.status !== 'completed' && e.status !== 'cancelled'
      ).length || 0;
    const completed =
      errands?.filter((e) => e.status === 'completed').length || 0;
    const cancelled =
      errands?.filter((e) => e.status === 'cancelled').length || 0;
    const revenue =
      errands
        ?.filter((e) => e.status === 'completed')
        .reduce((sum, e) => sum + (parseFloat(e.service_fee) || 0) * 0.15, 0) ||
      0;

    setStats({
      totalUsers: users?.length || 0,
      totalAgents: agents,
      totalCustomers: customers,
      totalErrands: errands?.length || 0,
      activeErrands: active,
      completedErrands: completed,
      cancelledErrands: cancelled,
      totalRevenue: revenue,
    });

    setAllErrands(errands || []);
    setAllUsers(users || []);
  };

  const deleteErrand = async (id) => {
    if (!confirm('Delete this errand?')) return;
    await supabase.from('errands').delete().eq('id', id);
    loadAdminData();
  };

  const deleteUser = async (id) => {
    if (!confirm('Delete this user?')) return;
    await supabase.from('users').delete().eq('id', id);
    loadAdminData();
  };

  return (
    <div className="admin-dashboard">
      <div className="admin-header">
        <div>
          <h1>⚙️ Admin Dashboard</h1>
          <p>Manage your Pabili App</p>
        </div>
        <button onClick={onLogout} className="logout-btn">
          Logout
        </button>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">👥</div>
          <div className="stat-info">
            <h3>{stats.totalUsers}</h3>
            <p>Total Users</p>
            <small>
              {stats.totalCustomers} customers, {stats.totalAgents} agents
            </small>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">📋</div>
          <div className="stat-info">
            <h3>{stats.totalErrands}</h3>
            <p>Total Errands</p>
            <small>
              {stats.activeErrands} active, {stats.completedErrands} completed,{' '}
              {stats.cancelledErrands} cancelled
            </small>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">💰</div>
          <div className="stat-info">
            <h3>₱{stats.totalRevenue.toFixed(2)}</h3>
            <p>Est. Commission (15%)</p>
            <small>From completed errands</small>
          </div>
        </div>
      </div>

      <div className="admin-tabs">
        <button
          className={activeTab === 'overview' ? 'active' : ''}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button
          className={activeTab === 'errands' ? 'active' : ''}
          onClick={() => setActiveTab('errands')}
        >
          All Errands
        </button>
        <button
          className={activeTab === 'users' ? 'active' : ''}
          onClick={() => setActiveTab('users')}
        >
          All Users
        </button>
      </div>

      {activeTab === 'overview' && (
        <div className="tab-content">
          <h2>Recent Activity</h2>
          <div className="activity-list">
            {allErrands.slice(0, 10).map((errand) => (
              <div key={errand.id} className="activity-item">
                <div className={`status-dot status-${errand.status}`}></div>
                <div className="activity-details">
                  <p>
                    <strong>{errand.customer?.name}</strong> -{' '}
                    {errand.description.substring(0, 50)}...
                  </p>
                  <small>
                    {errand.status.toUpperCase()} •
                    {errand.agent?.name
                      ? ` Agent: ${errand.agent.name} • `
                      : ' '}
                    {new Date(errand.created_at).toLocaleString()}
                  </small>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'errands' && (
        <div className="tab-content">
          <h2>All Errands ({allErrands.length})</h2>
          <div className="admin-table">
            {allErrands.map((errand) => (
              <div key={errand.id} className="table-row">
                <div className="table-cell">
                  <strong>{errand.description.substring(0, 60)}...</strong>
                  <br />
                  <small>
                    Customer: {errand.customer?.name} (
                    {errand.customer?.phone_number})
                    {errand.agent && ` • Agent: ${errand.agent.name}`}
                  </small>
                </div>
                <div className="table-cell">
                  <span className={`status status-${errand.status}`}>
                    {errand.status}
                  </span>
                </div>
                <div className="table-cell">
                  {errand.service_fee && `₱${errand.service_fee}`}
                </div>
                <div className="table-cell">
                  <button
                    onClick={() => deleteErrand(errand.id)}
                    className="delete-btn"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'users' && (
        <div className="tab-content">
          <h2>All Users ({allUsers.length})</h2>
          <div className="admin-table">
            {allUsers
              .filter((u) => u.user_type !== 'admin')
              .map((user) => (
                <div key={user.id} className="table-row">
                  <div className="table-cell">
                    <strong>{user.name}</strong>
                    <br />
                    <small>{user.phone_number}</small>
                  </div>
                  <div className="table-cell">
                    <span className={`badge badge-${user.user_type}`}>
                      {user.user_type}
                    </span>
                  </div>
                  <div className="table-cell">
                    Rating: {'⭐'.repeat(Math.round(user.average_rating || 5))}{' '}
                    {(user.average_rating || 5).toFixed(1)}
                    <br />
                    <small>
                      {user.total_ratings || 0} ratings •{' '}
                      {user.total_errands || 0} errands
                    </small>
                  </div>
                  <div className="table-cell">
                    <button
                      onClick={() => deleteUser(user.id)}
                      className="delete-btn"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
