import React, { useState, useEffect } from 'react';
import {
  getAdminUsers,
  updateAdminUser,
  getAdminLocations,
  getAdminDepartments,
  getAssignments,
  createAssignment,
  deleteAssignment,
  createLocation,
  updateLocation,
  deleteLocation,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  User,
  Location,
  Department,
  Assignment
} from '../services/api';

const AdminSettings: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'users' | 'org'>('users');
  const [users, setUsers] = useState<User[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // New item states
  const [newLocationName, setNewLocationName] = useState('');
  const [newDepartmentName, setNewDepartmentName] = useState('');

  // Editing states
  const [editingLocId, setEditingLocId] = useState<string | null>(null);
  const [editLocName, setEditLocName] = useState('');
  const [editingDeptId, setEditingDeptId] = useState<string | null>(null);
  const [editDeptName, setEditDeptName] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [u, l, d, a] = await Promise.all([
        getAdminUsers(),
        getAdminLocations(),
        getAdminDepartments(),
        getAssignments(),
      ]);
      setUsers(u);
      setLocations(l);
      setDepartments(d);
      setAssignments(a);
      setError(null);
    } catch (err) {
      setError('データの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const showSuccess = (msg: string) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(null), 3000);
  };

  const handleUserUpdate = async (userId: string, updates: any) => {
    try {
      await updateAdminUser(userId, updates);
      showSuccess('ユーザー情報を更新しました');
      fetchData();
    } catch (err) {
      setError('更新に失敗しました');
    }
  };

  const handleAddLocation = async () => {
    if (!newLocationName.trim()) {
      setError('拠点名を入力してください');
      return;
    }
    try {
      await createLocation(newLocationName);
      setNewLocationName('');
      showSuccess('拠点を追加しました');
      fetchData();
    } catch (err) {
      setError('拠点の追加に失敗しました');
    }
  };

  const handleUpdateLocation = async (id: string) => {
    if (!editLocName.trim()) {
      setError('拠点名を入力してください');
      return;
    }
    try {
      await updateLocation(id, editLocName);
      setEditingLocId(null);
      showSuccess('拠点を更新しました');
      fetchData();
    } catch (err) {
      setError('拠点の更新に失敗しました');
    }
  };

  const handleDeleteLocation = async (id: string) => {
    if (!window.confirm('この拠点を削除しますか？')) return;
    try {
      await deleteLocation(id);
      showSuccess('拠点を削除しました');
      fetchData();
    } catch (err) {
      setError('拠点の削除に失敗しました');
    }
  };

  const handleAddDepartment = async () => {
    if (!newDepartmentName.trim()) {
      setError('部署名を入力してください');
      return;
    }
    try {
      await createDepartment(newDepartmentName);
      setNewDepartmentName('');
      showSuccess('部署を追加しました');
      fetchData();
    } catch (err) {
      setError('部署の追加に失敗しました');
    }
  };

  const handleUpdateDepartment = async (id: string) => {
    if (!editDeptName.trim()) {
      setError('部署名を入力してください');
      return;
    }
    try {
      await updateDepartment(id, editDeptName);
      setEditingDeptId(null);
      showSuccess('部署を更新しました');
      fetchData();
    } catch (err) {
      setError('部署の更新に失敗しました');
    }
  };

  const handleDeleteDepartment = async (id: string) => {
    if (!window.confirm('この部署を削除しますか？')) return;
    try {
      await deleteDepartment(id);
      showSuccess('部署を削除しました');
      fetchData();
    } catch (err) {
      setError('部署の削除に失敗しました');
    }
  };

  const handleAddAssignment = async (deptId: string, managerId: string) => {
    if (!managerId) return;
    try {
      await createAssignment(deptId, managerId);
      showSuccess('管理者を割り当てました');
      fetchData();
    } catch (err) {
      setError('管理者の割当に失敗しました');
    }
  };

  const handleDeleteAssignment = async (id: string) => {
    try {
      await deleteAssignment(id);
      showSuccess('割当を解除しました');
      fetchData();
    } catch (err) {
      setError('解除に失敗しました');
    }
  };

  if (loading) return <div className="dashboard-container">読み込み中...</div>;

  return (
    <div className="card-base dashboard-container">
      <div className="admin-header">
        <h2>システム設定</h2>
      </div>

      {error && <div className="alert-error">{error}</div>}
      {success && <div className="alert-success">{success}</div>}

      <div className="admin-tabs">
        <button
          onClick={() => setActiveTab('users')}
          className={`admin-tab ${activeTab === 'users' ? 'active' : ''}`}
        >
          アカウント管理
        </button>
        <button
          onClick={() => setActiveTab('org')}
          className={`admin-tab ${activeTab === 'org' ? 'active' : ''}`}
        >
          拠点・部署管理
        </button>
      </div>

      {activeTab === 'users' && (
        <div className="admin-card">
          <div className="table-container">
            <table className="history-table">
              <thead>
                <tr className="table-header-row">
                  <th className="table-header-cell">氏名</th>
                  <th className="table-header-cell">メールアドレス</th>
                  <th className="table-header-cell">権限</th>
                  <th className="table-header-cell">拠点</th>
                  <th className="table-header-cell">部署</th>
                  <th className="table-header-cell">アカウント停止</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user: User) => (
                  <tr key={user.id} className="table-body-row">
                    <td className="table-body-cell">{user.name || '-'}</td>
                    <td className="table-body-cell" style={{ fontSize: '0.8rem' }}>{user.email}</td>
                    <td className="table-body-cell">
                      <select
                        value={user.role}
                        onChange={(e) => handleUserUpdate(user.id, { role: e.target.value })}
                        className="form-select"
                        style={{ padding: '4px', fontSize: '0.8rem' }}
                      >
                        <option value="employee">従業員</option>
                        <option value="manager">管理者</option>
                        <option value="admin">システム管理者</option>
                      </select>
                    </td>
                    <td className="table-body-cell">
                      <select
                        value={user.location_id || ''}
                        onChange={(e) => handleUserUpdate(user.id, { location_id: e.target.value || null })}
                        className="form-select"
                        style={{ padding: '4px', fontSize: '0.8rem' }}
                      >
                        <option value="">未設定</option>
                        {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                      </select>
                    </td>
                    <td className="table-body-cell">
                      <select
                        value={user.department_id || ''}
                        onChange={(e) => handleUserUpdate(user.id, { department_id: e.target.value || null })}
                        className="form-select"
                        style={{ padding: '4px', fontSize: '0.8rem' }}
                      >
                        <option value="">未設定</option>
                        {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                      </select>
                    </td>
                    <td className="table-body-cell">
                      <button
                        onClick={() => handleUserUpdate(user.id, { is_active: !!user.deleted_at })}
                        className={user.deleted_at ? "edit-button" : "delete-button"}
                        style={{ fontSize: '0.7rem' }}
                      >
                        {user.deleted_at ? '有効' : '停止'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'org' && (
        <div className="admin-grid">
          {/* Department Management */}
          <div className="admin-card">
            <h3>部署管理</h3>
            <div className="input-group">
              <input
                type="text"
                placeholder="新しい部署名"
                value={newDepartmentName}
                onChange={(e) => setNewDepartmentName(e.target.value)}
              />
              <button className="modal-save-button" onClick={handleAddDepartment}>追加</button>
            </div>
            <div className="table-container">
              <table className="history-table org-table">
                <thead>
                  <tr className="table-header-row">
                    <th className="table-header-cell col-name">部署名</th>
                    <th className="table-header-cell col-middle">管理者</th>
                    <th className="table-header-cell col-actions">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {departments.map(dept => {
                    const deptAssignments = assignments.filter(a => a.department_id === dept.id);
                    return (
                      <tr key={dept.id} className="table-body-row">
                        <td className="table-body-cell col-name">
                          {editingDeptId === dept.id ? (
                            <input
                              type="text"
                              className="form-input"
                              style={{ padding: '4px 8px' }}
                              value={editDeptName}
                              onChange={(e) => setEditDeptName(e.target.value)}
                            />
                          ) : dept.name}
                        </td>
                        <td className="table-body-cell col-middle">
                          <div className="badge-list">
                            {deptAssignments.map(a => {
                              const manager = users.find(u => u.id === a.manager_id);
                              return (
                                <div key={a.id} className="badge-item">
                                  <span>{manager?.name || manager?.email || 'Unknown'}</span>
                                  <button
                                    className="badge-remove"
                                    onClick={() => handleDeleteAssignment(a.id)}
                                  >
                                    ×
                                  </button>
                                </div>
                              );
                            })}
                            <select
                              className="form-select"
                              style={{ padding: '2px', fontSize: '0.8rem' }}
                              onChange={(e) => handleAddAssignment(dept.id, e.target.value)}
                              value=""
                            >
                              <option value="">管理者を追加...</option>
                              {users.filter(u => u.role !== 'employee').map(u => (
                                <option key={u.id} value={u.id}>{u.name || u.email}</option>
                              ))}
                            </select>
                          </div>
                        </td>
                        <td className="table-body-cell">
                          <div className="table-actions">
                            {editingDeptId === dept.id ? (
                              <>
                                <button className="edit-button" onClick={() => handleUpdateDepartment(dept.id)}>保存</button>
                                <button className="modal-cancel-button" style={{ padding: '4px 8px' }} onClick={() => setEditingDeptId(null)}>取消</button>
                              </>
                            ) : (
                              <>
                                <button className="edit-button" onClick={() => {
                                  setEditingDeptId(dept.id);
                                  setEditDeptName(dept.name);
                                }}>編集</button>
                                <button className="delete-button" onClick={() => handleDeleteDepartment(dept.id)}>削除</button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
          {/* Location Management */}
          <div className="admin-card">
            <h3>拠点管理</h3>
            <div className="input-group">
              <input
                type="text"
                placeholder="新しい拠点名"
                value={newLocationName}
                onChange={(e) => setNewLocationName(e.target.value)}
              />
              <button className="modal-save-button" onClick={handleAddLocation}>追加</button>
            </div>
            <div className="table-container">
              <table className="history-table org-table">
                <thead>
                  <tr className="table-header-row">
                    <th className="table-header-cell col-name">拠点名</th>
                    <th className="table-header-cell col-middle"></th>
                    <th className="table-header-cell col-actions">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {locations.map((loc: Location) => (
                    <tr key={loc.id} className="table-body-row">
                      <td className="table-body-cell col-name">
                        {editingLocId === loc.id ? (
                          <input
                            type="text"
                            className="form-input"
                            style={{ padding: '4px 8px' }}
                            value={editLocName}
                            onChange={(e) => setEditLocName(e.target.value)}
                          />
                        ) : loc.name}
                      </td>
                      <td className="table-body-cell col-middle"></td>
                      <td className="table-body-cell col-actions">
                        <div className="table-actions">
                          {editingLocId === loc.id ? (
                            <>
                              <button className="edit-button" onClick={() => handleUpdateLocation(loc.id)}>保存</button>
                              <button className="modal-cancel-button" style={{ padding: '4px 8px' }} onClick={() => setEditingLocId(null)}>取消</button>
                            </>
                          ) : (
                            <>
                              <button className="edit-button" onClick={() => {
                                setEditingLocId(loc.id);
                                setEditLocName(loc.name);
                              }}>編集</button>
                              <button className="delete-button" onClick={() => handleDeleteLocation(loc.id)}>削除</button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}
    </div>
  );
};

export default AdminSettings;
