import React, { useState, useEffect } from 'react';
import { usersAPI } from '../api/client';
import { Users as UsersIcon, Shield, Check, X, UserX, UserCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Users() {
  const { isAdmin } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // New user form
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ username: '', email: '', password: '', role: 'VIEWER' });
  const [formError, setFormError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const data = await usersAPI.getUsers();
      setUsers(data);
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (isAdmin) {
      fetchUsers();
    }
  }, [isAdmin]);

  if (!isAdmin) {
    return <div className="p-8 text-center text-danger font-bold">Unauthorized. Administrators only.</div>;
  }

  const handleCreate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError(null);
    try {
      await usersAPI.createUser(formData);
      setFormData({ username: '', email: '', password: '', role: 'VIEWER' });
      setShowForm(false);
      fetchUsers();
    } catch (err) {
      setFormError(err.message);
    }
    setSubmitting(false);
  };

  const toggleStatus = async (id) => {
    try {
      await usersAPI.toggleActive(id);
      fetchUsers();
    } catch (err) {
      alert("Failed to toggle status: " + err.message);
    }
  };

  const changeRole = async (id, newRole) => {
    try {
      await usersAPI.updateRole(id, newRole);
      fetchUsers();
    } catch (err) {
      alert("Failed to update role: " + err.message);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-6xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-text-primary flex items-center gap-2">
            <UsersIcon size={20} className="text-primary" /> User Management
          </h2>
          <p className="text-sm text-text-secondary mt-1">Manage platform access, roles, and analyst accounts.</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary">
          {showForm ? 'Cancel' : 'Create User'}
        </button>
      </div>

      {showForm && (
        <div className="card mb-6 border-primary/20 bg-primary/5">
          <h3 className="text-sm font-bold mb-4">Create New Account</h3>
          {formError && <div className="text-xs text-danger mb-4">{formError}</div>}
          <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div>
              <label className="input-label">Username</label>
              <input required value={formData.username} onChange={e => setFormData({ ...formData, username: e.target.value })} className="input w-full mt-1" />
            </div>
            <div>
              <label className="input-label">Email</label>
              <input required type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} className="input w-full mt-1" />
            </div>
            <div>
              <label className="input-label">Password</label>
              <input required type="password" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} className="input w-full mt-1" />
            </div>
            <div>
              <label className="input-label">Role</label>
              <select value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value })} className="input w-full mt-1">
                <option value="VIEWER">Viewer</option>
                <option value="ANALYST">Analyst</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>
            <div className="md:col-span-4 flex justify-end mt-2">
              <button type="submit" disabled={submitting} className="btn-primary">
                {submitting ? 'Creating...' : 'Create Account'}
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="text-text-muted text-sm">Loading users...</div>
      ) : error ? (
        <div className="text-danger text-sm">{error}</div>
      ) : (
        <div className="card p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="bg-surface border-b border-border text-text-secondary">
                  <th className="p-4 font-semibold">User</th>
                  <th className="p-4 font-semibold">Role</th>
                  <th className="p-4 font-semibold">Status</th>
                  <th className="p-4 font-semibold">Last Login</th>
                  <th className="p-4 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id} className="border-b border-border hover:bg-surface-hover transition-colors">
                    <td className="p-4">
                      <div className="font-medium text-text-primary">{u.username}</div>
                      <div className="text-xs text-text-muted">{u.email}</div>
                    </td>
                    <td className="p-4">
                      <select
                        value={u.role}
                        onChange={(e) => changeRole(u.id, e.target.value)}
                        className="input text-xs py-1 px-2 h-auto w-auto"
                      >
                        <option value="ADMIN">ADMIN</option>
                        <option value="ANALYST">ANALYST</option>
                        <option value="VIEWER">VIEWER</option>
                      </select>
                    </td>
                    <td className="p-4">
                      {u.is_active ? (
                        <span className="inline-flex items-center gap-1 text-[10px] uppercase font-bold text-safe bg-safe/10 px-2 py-1 rounded">
                          <Check size={10} /> Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] uppercase font-bold text-danger bg-danger/10 px-2 py-1 rounded">
                          <X size={10} /> Inactive
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-xs text-text-muted">
                      {u.last_login ? new Date(u.last_login).toLocaleString() : 'Never'}
                    </td>
                    <td className="p-4">
                      <button
                        onClick={() => toggleStatus(u.id)}
                        className={`text-xs p-1.5 rounded flex items-center gap-1 transition-colors ${u.is_active ? 'text-danger hover:bg-danger/10' : 'text-safe hover:bg-safe/10'}`}
                      >
                        {u.is_active ? <UserX size={14} /> : <UserCheck size={14} />}
                        {u.is_active ? 'Deactivate' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
