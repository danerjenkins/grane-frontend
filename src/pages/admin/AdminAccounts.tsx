/**
 * Admin Accounts Page
 *
 * IDENTITY STANDARD:
 * ==================
 * - public.users is the profile table; id is the primary key
 * - auth.users contains authentication records (Supabase Auth)
 * - For authenticated users: public.users.id = auth.users.id (auth.uid())
 * - For guest users (from checkout): public.users has a generated UUID, no auth account
 * - Admin status is stored in user_roles table (role = 'admin'), NOT in public.users.is_admin
 *
 * PROFILE SYNC:
 * =============
 * - When a user logs in, ensureUserProfile() creates a public.users row if missing (api/auth.ts)
 * - On app init, ensureUserProfile() is called to sync any authenticated users
 * - Guest profiles are created during checkout and are never associated with auth accounts
 *
 * DATA FLOW:
 * ==========
 * - listUsers() returns all public.users rows (both guests and authenticated users)
 * - createUser() creates guest profiles (used by admin to manually add customers)
 * - updateUser() modifies profile fields (name, email, phone)
 * - deleteUserProfileCascade() safely deletes profiles and cascades to user_roles and orders
 * - getUserRolesByUserId() fetches roles from user_roles table (source of truth for admin status)
 *
 * NOTE: Manually created profiles in AdminAccounts are guest profiles (no auth accounts)
 * To create an admin user with auth, use Supabase Auth sign-up/creation flow
 */

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Edit2 } from 'lucide-react';
import {
  listUsers,
  getUserById,
  updateUser,
  deleteUserProfileCascade,
  countUserOrders,
  createUser,
} from '../../api/admin/usersAdmin';
import {
  grantAdminRole,
  revokeAdminRole,
  getUserRolesByUserId,
} from '../../api/admin/userRolesAdmin';
import { getSession } from '../../api/auth';
import type { UserRow } from '../../api/admin/types';

function shortId(id: string) {
  return id.slice(0, 8);
}

function formatDate(dateString: string) {
  const parsed = new Date(dateString);
  if (Number.isNaN(parsed.getTime())) return dateString;
  return parsed.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function AdminAccounts() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<UserRow | null>(null);
  const [drawerLoading, setDrawerLoading] = useState(false);
  const [drawerError, setDrawerError] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Profile editing state
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [profileDirty, setProfileDirty] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);

  // Admin role state
  const [isAdmin, setIsAdmin] = useState(false);
  const [userRoles, setUserRoles] = useState<string[]>([]); // Track all roles from user_roles table
  const [userRolesMap, setUserRolesMap] = useState<Record<string, string[]>>({}); // Map of user ID to roles for table display
  const [adminToggling, setAdminToggling] = useState(false);

  // Delete profile state
  const [linkedOrderCount, setLinkedOrderCount] = useState<number | null>(null);
  const [deleteAck, setDeleteAck] = useState(false);
  const [deleteToken, setDeleteToken] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  // Create account state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: '',
    email: '',
    phone: '',
  });
  const [createError, setCreateError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    loadUsers();
    getCurrentUser();
  }, []);
  // Handle userId from URL query parameter
  useEffect(() => {
    const userIdFromUrl = searchParams.get('userId');
    if (userIdFromUrl && users.length > 0) {
      // Check if this user exists in the loaded users
      const userExists = users.some((u) => u.id === userIdFromUrl);
      if (userExists) {
        setSelectedUserId(userIdFromUrl);
        // Clear the query parameter after opening
        setSearchParams({});
      }
    }
  }, [searchParams, users, setSearchParams]);
  const getCurrentUser = async () => {
    try {
      const session = await getSession();
      if (session?.user?.id) {
        setCurrentUserId(session.user.id);
      }
    } catch (err) {
      console.error('Failed to get current user:', err);
    }
  };

  useEffect(() => {
    if (selectedUserId) {
      loadUserDetail(selectedUserId);
    } else {
      setSelectedUser(null);
      resetProfileForm();
    }
  }, [selectedUserId]);

  const resetProfileForm = () => {
    setEditName('');
    setEditEmail('');
    setEditPhone('');
    setProfileDirty(false);
    setIsAdmin(false);
    setUserRoles([]);
  };

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await listUsers();
      setUsers(data);

      // Fetch roles for each user to display admin status in table
      const rolesMap: Record<string, string[]> = {};
      for (const user of data) {
        try {
          const roles = await getUserRolesByUserId(user.id);
          rolesMap[user.id] = roles.map((role) => role.role);
        } catch (err) {
          console.error(`Failed to load roles for user ${user.id}:`, err);
          rolesMap[user.id] = [];
        }
      }
      setUserRolesMap(rolesMap);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const loadUserDetail = async (userId: string) => {
    try {
      setDrawerLoading(true);
      setDrawerError(null);
      const user = await getUserById(userId);
      setSelectedUser(user);
      setEditName(user.name || '');
      setEditEmail(user.email || '');
      setEditPhone(user.phone || '');
      setProfileDirty(false);

      // Fetch all roles from user_roles table
      const roles = await getUserRolesByUserId(userId);
      const roleNames = roles.map((role) => role.role);
      setUserRoles(roleNames);
      const isUserAdmin = roleNames.includes('admin');
      setIsAdmin(isUserAdmin);

      // Load linked order count
      const orderCount = await countUserOrders(userId);
      setLinkedOrderCount(orderCount);

      // Reset delete state
      setDeleteAck(false);
      setDeleteToken('');
    } catch (err) {
      setDrawerError(err instanceof Error ? err.message : 'Failed to load user details');
    } finally {
      setDrawerLoading(false);
    }
  };

  const filteredUsers = useMemo(() => {
    if (!searchQuery.trim()) return users;
    const query = searchQuery.toLowerCase();
    return users.filter(
      (u) =>
        u.id.toLowerCase().includes(query) ||
        u.name?.toLowerCase().includes(query) ||
        u.email?.toLowerCase().includes(query) ||
        u.phone?.toLowerCase().includes(query)
    );
  }, [users, searchQuery]);

  const closeDrawer = () => {
    setSelectedUserId(null);
    setSelectedUser(null);
    setDrawerError(null);
    resetProfileForm();
    setLinkedOrderCount(null);
    setDeleteAck(false);
    setDeleteToken('');
  };

  const handleProfileChange = (field: 'name' | 'email' | 'phone', value: string) => {
    if (field === 'name') setEditName(value);
    if (field === 'email') setEditEmail(value);
    if (field === 'phone') setEditPhone(value);
    setProfileDirty(true);
  };

  const handleSaveProfile = async () => {
    if (!selectedUserId) return;
    try {
      setProfileSaving(true);
      setDrawerError(null);
      await updateUser(selectedUserId, {
        name: editName || null,
        email: editEmail || null,
        phone: editPhone || null,
      });
      await loadUserDetail(selectedUserId);
      await loadUsers();
      setProfileDirty(false);
    } catch (err) {
      setDrawerError(err instanceof Error ? err.message : 'Failed to save profile');
    } finally {
      setProfileSaving(false);
    }
  };

  const handleToggleAdmin = async (shouldBeAdmin: boolean) => {
    if (!selectedUserId) return;

    // Prevent self-demotion
    if (!shouldBeAdmin && selectedUserId === currentUserId) {
      setDrawerError("You can't remove your own admin access.");
      return;
    }

    try {
      setAdminToggling(true);
      setDrawerError(null);

      if (shouldBeAdmin) {
        await grantAdminRole(selectedUserId);
      } else {
        await revokeAdminRole(selectedUserId);
      }

      setIsAdmin(shouldBeAdmin);
      await loadUserDetail(selectedUserId);
      await loadUsers();
    } catch (err) {
      setDrawerError(err instanceof Error ? err.message : 'Failed to update admin access');
      // Revert toggle on error
      setIsAdmin(!shouldBeAdmin);
    } finally {
      setAdminToggling(false);
    }
  };

  const handleDeleteProfileRow = async () => {
    if (!selectedUserId) return;

    if (
      !window.confirm(
        `Delete the profile row for ${selectedUser?.email || selectedUserId}? This cannot be undone.`
      )
    ) {
      return;
    }

    try {
      setIsDeleting(true);
      setDrawerError(null);
      await deleteUserProfileCascade(selectedUserId);
      // Close drawer and refresh list
      closeDrawer();
      await loadUsers();
    } catch (err) {
      setDrawerError(err instanceof Error ? err.message : 'Failed to delete profile row');
    } finally {
      setIsDeleting(false);
    }
  };

  // Check if delete button should be enabled
  const canDelete =
    selectedUserId &&
    selectedUserId !== currentUserId &&
    deleteAck &&
    deleteToken.trim() !== '' &&
    (deleteToken === selectedUserId || deleteToken === selectedUser?.email);

  const handleCreateAccount = async () => {
    if (!createForm.email.trim()) {
      setCreateError('Email is required');
      return;
    }

    try {
      setIsCreating(true);
      setCreateError(null);
      await createUser({
        email: createForm.email.trim(),
        name: createForm.name.trim() || null,
        phone: createForm.phone.trim() || null,
      });
      // Clear form and close modal
      setCreateForm({ name: '', email: '', phone: '' });
      setShowCreateModal(false);
      // Refresh users list
      await loadUsers();
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : 'Failed to create account');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <main className="min-h-screen bg-muted px-6 py-10">
      <div className="max-w-7xl mx-auto">
        {/* Error banner */}
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-900 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text">Accounts</h1>
            <p className="text-secondary mt-1">Manage customers and admins</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-brand-strong text-white rounded-lg hover:bg-brand font-medium transition-colors"
          >
            + Create Account
          </button>
        </div>

        {/* Search */}
        <div className="mb-6">
          <input
            type="text"
            placeholder="Search by name, email, phone, or user ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-strong"
          />
        </div>

        {/* Table */}
        <div className="bg-surface rounded-lg shadow-sm border border-neutral-200 overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-secondary">Loading users...</div>
          ) : filteredUsers.length === 0 ? (
            <div className="p-8 text-center text-secondary">
              {searchQuery ? 'No users match your search.' : 'No users yet.'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-neutral-100 border-b border-neutral-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider">
                      Phone
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider">
                      Roles
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-neutral-700 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200">
                  {filteredUsers.map((user) => (
                    <tr
                      key={user.id}
                      className="hover:bg-neutral-50 cursor-pointer"
                      onClick={() => setSelectedUserId(user.id)}
                    >
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text">{user.name || '—'}</div>
                        <div className="text-xs text-secondary">{shortId(user.id)}</div>
                      </td>
                      <td className="px-6 py-4 text-sm text-secondary">{user.email || '—'}</td>
                      <td className="px-6 py-4 text-sm text-secondary">{user.phone || '—'}</td>
                      <td className="px-6 py-4">
                        {(userRolesMap[user.id] || []).length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {(userRolesMap[user.id] || []).map((role) => (
                              <span
                                key={role}
                                className={`px-2 py-1 text-xs font-semibold rounded ${
                                  role === 'admin'
                                    ? 'bg-blue-100 text-blue-800'
                                    : 'bg-neutral-100 text-neutral-800'
                                }`}
                              >
                                {role}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-sm text-neutral-500">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-secondary">
                        {formatDate(user.created_at)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedUserId(user.id);
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 hover:text-neutral-900 rounded-md transition-colors"
                            title="View and edit user details"
                          >
                            <Edit2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Detail Drawer */}
      {selectedUserId && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-end z-50"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeDrawer();
          }}
        >
          <div className="bg-surface h-full w-full max-w-2xl overflow-y-auto shadow-xl">
            {/* Drawer Header */}
            <div className="sticky top-0 bg-surface border-b border-neutral-200 px-6 py-4 flex items-center justify-between z-10">
              <div>
                <h2 className="text-2xl font-bold text">User Details</h2>
                <p className="text-sm text-secondary">
                  {selectedUser ? shortId(selectedUser.id) : selectedUserId}
                </p>
              </div>
              <button
                onClick={closeDrawer}
                className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
              >
                <svg
                  className="w-6 h-6 text-neutral-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Drawer Content */}
            <div className="p-6 space-y-6">
              {drawerError && (
                <div className="bg-red-100 border border-red-400 text-red-800 px-4 py-3 rounded-lg">
                  {drawerError}
                </div>
              )}

              {drawerLoading ? (
                <div className="text-secondary">Loading user details...</div>
              ) : selectedUser ? (
                <>
                  {/* Basic Info Section - Editable */}
                  <div className="bg-neutral-50 rounded-lg p-4 space-y-3">
                    <h3 className="text-lg font-semibold text">Basic Information</h3>
                    <div className="grid grid-cols-1 gap-3">
                      <div>
                        <label className="block text-sm font-semibold text-secondary mb-1">
                          Name
                        </label>
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => handleProfileChange('name', e.target.value)}
                          className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-strong text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-secondary mb-1">
                          Email
                        </label>
                        <input
                          type="email"
                          value={editEmail}
                          onChange={(e) => handleProfileChange('email', e.target.value)}
                          className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-strong text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-secondary mb-1">
                          User ID
                        </label>
                        <div className="text-sm text">{selectedUser.id}</div>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-secondary mb-1">
                          Created
                        </label>
                        <div className="text-sm text">{formatDate(selectedUser.created_at)}</div>
                      </div>
                    </div>
                    <div className="flex justify-end pt-2">
                      <button
                        onClick={handleSaveProfile}
                        disabled={!profileDirty || profileSaving}
                        className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                          !profileDirty || profileSaving
                            ? 'bg-neutral-200 text-neutral-500 cursor-not-allowed'
                            : 'bg-brand-strong hover:bg-brand text-white'
                        }`}
                      >
                        {profileSaving ? 'Saving...' : 'Save Changes'}
                      </button>
                    </div>
                  </div>

                  {/* Admin Access Section */}
                  <div className="bg-neutral-50 rounded-lg p-4 space-y-3">
                    <h3 className="text-lg font-semibold text">Admin Access</h3>
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <label className="block text-sm font-semibold text-secondary mb-1">
                          Admin access
                        </label>
                        <p className="text-xs text-secondary">
                          {selectedUserId === currentUserId
                            ? isAdmin
                              ? 'You are an admin. You cannot remove your own access.'
                              : 'Grant this user admin access'
                            : isAdmin
                              ? 'This user has admin access'
                              : 'Grant this user admin access'}
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isAdmin}
                          onChange={(e) => handleToggleAdmin(e.target.checked)}
                          disabled={adminToggling || (selectedUserId === currentUserId && isAdmin)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-neutral-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-brand-soft rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-strong" />
                      </label>
                    </div>
                    {adminToggling && (
                      <p className="text-xs text-neutral-600">Updating admin access...</p>
                    )}
                  </div>

                  {/* Roles Section */}
                  <div className="bg-neutral-50 rounded-lg p-4 space-y-3">
                    <h3 className="text-lg font-semibold text">Roles</h3>
                    <div className="space-y-2">
                      {userRoles.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {userRoles.map((role) => (
                            <span
                              key={role}
                              className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium"
                            >
                              {role}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-secondary">No roles assigned</p>
                      )}
                    </div>
                  </div>

                  {/* Danger Zone Section */}
                  <div className="border-2 border-red-300 bg-red-50 rounded-lg p-4 space-y-4">
                    <h3 className="text-lg font-semibold text-red-900">Danger Zone</h3>

                    {selectedUserId === currentUserId ? (
                      <div className="bg-surface rounded p-3 border border-red-200">
                        <p className="text-sm text-red-700">
                          <strong>You can't delete your own profile row.</strong> Contact another
                          admin to remove your profile if needed.
                        </p>
                      </div>
                    ) : (
                      <>
                        <p className="text-sm text-neutral-700">
                          <strong>Delete User Profile Row</strong>
                          <br />
                          This permanently deletes the user's profile record from the database. It{' '}
                          <strong>does NOT</strong> delete their Supabase Auth login account.
                        </p>

                        {linkedOrderCount !== null && (
                          <div className="bg-surface rounded p-3 border border-orange-200">
                            <p className="text-sm text-orange-800">
                              <strong>Linked orders: {linkedOrderCount}</strong>
                              <br />
                              These orders will remain in the system but will be disassociated
                              (user_id set to null).
                            </p>
                          </div>
                        )}

                        <div className="space-y-3">
                          <label className="flex items-center space-x-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={deleteAck}
                              onChange={(e) => setDeleteAck(e.target.checked)}
                              disabled={isDeleting}
                              className="w-4 h-4 accent-red-600 cursor-pointer"
                            />
                            <span className="text-sm text-secondary">
                              I understand this is permanent and cannot be undone
                            </span>
                          </label>

                          <div>
                            <label className="block text-sm font-semibold text-secondary mb-2">
                              Confirm by entering:
                            </label>
                            <input
                              type="text"
                              placeholder={`User ID: ${selectedUser.id}`}
                              value={deleteToken}
                              onChange={(e) => setDeleteToken(e.target.value)}
                              disabled={isDeleting}
                              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
                            />
                            <p className="text-xs text-secondary mt-1">
                              Enter the user ID or email address to confirm
                            </p>
                          </div>

                          <button
                            onClick={handleDeleteProfileRow}
                            disabled={!canDelete || isDeleting}
                            className={`w-full py-2 rounded-lg font-medium text-sm transition-colors ${
                              !canDelete || isDeleting
                                ? 'bg-neutral-200 text-neutral-500 cursor-not-allowed'
                                : 'bg-red-600 hover:bg-red-700 text-white'
                            }`}
                          >
                            {isDeleting ? 'Deleting Profile...' : 'Delete User Profile Row'}
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </>
              ) : (
                <div className="text-neutral-600">No user data available.</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Create Account Modal */}
      {showCreateModal && (
        <div
          className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowCreateModal(false);
          }}
        >
          <div className="bg-surface rounded-lg shadow-2xl w-full max-w-md">
            <div className="p-4 border-b border-neutral-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text">Create Account</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-neutral-600 hover:text-neutral-900 px-3 py-1 rounded-lg hover:bg-neutral-100"
              >
                Close
              </button>
            </div>
            <div className="p-4 space-y-4">
              {createError && (
                <div className="bg-red-50 border border-red-200 text-red-900 px-3 py-2 rounded-lg text-sm">
                  {createError}
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-secondary mb-1">
                  Email <span className="text-red-600">*</span>
                </label>
                <input
                  type="email"
                  value={createForm.email}
                  onChange={(e) => setCreateForm((f) => ({ ...f, email: e.target.value }))}
                  placeholder="user@example.com"
                  disabled={isCreating}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-strong"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-secondary mb-1">Name</label>
                <input
                  type="text"
                  value={createForm.name}
                  onChange={(e) => setCreateForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="John Doe"
                  disabled={isCreating}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-strong"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-secondary mb-1">Phone</label>
                <input
                  type="tel"
                  value={createForm.phone}
                  onChange={(e) => setCreateForm((f) => ({ ...f, phone: e.target.value }))}
                  placeholder="(555) 123-4567"
                  disabled={isCreating}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-strong"
                />
                <button
                  onClick={() => setShowCreateModal(false)}
                  disabled={isCreating}
                  className="px-4 py-2 border border-neutral-300 rounded-lg text-neutral-700 hover:bg-neutral-100 font-medium transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateAccount}
                  disabled={isCreating || !createForm.email.trim()}
                  className="px-4 py-2 bg-brand-strong text-white rounded-lg hover:bg-brand font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isCreating ? 'Creating...' : 'Create Account'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
