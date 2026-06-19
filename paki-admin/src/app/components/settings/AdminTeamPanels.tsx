import type { Dispatch, SetStateAction } from 'react';
import { X, UserCheck, Users, UserPlus, Edit3, UserMinus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import type { AdminRequestRecord, EditableUser, UserRecord } from './adminTeam';

/**
 * Theme tokens that differ between the PakiPark and PakiShip settings screens.
 * Everything structural is shared; only these class fragments vary per app.
 */
export interface SettingsTheme {
  modalOverlay: string;
  rejectOverlay: string;
  rejectZ: string;
  titleStrong: string;
  bodyText: string;
  mutedText60: string;
  mutedText55: string;
  fieldLabel: string;
  fieldLabel50: string;
  fieldInput: string;
  rejectTextarea: string;
  primaryButton: string;
  cancelButton: string;
  closeHoverPlain: string;
  closeHoverSoft: string;
  card: string;
  cardHeaderBorder: string;
  iconWrap: string;
  accentText: string;
  cardDescription: string;
  tableHead: string;
  tableDivide: string;
  rowHover: string;
  roleBadge: string;
  roleBadgeSuper: string;
  roleBadgeDefault: string;
  addUserButton: string;
  editHover: string;
}

interface AddEditUserModalProps {
  show: boolean;
  isAddMode: boolean;
  newUser: EditableUser;
  setNewUser: Dispatch<SetStateAction<EditableUser>>;
  currentUser: UserRecord | null;
  setCurrentUser: Dispatch<SetStateAction<UserRecord | null>>;
  roleOptions: string[];
  onClose: () => void;
  onSubmit: () => void;
  theme: SettingsTheme;
  copy: { addTitle: string; addButton: string };
}

export function AddEditUserModal({
  show,
  isAddMode,
  newUser,
  setNewUser,
  currentUser,
  setCurrentUser,
  roleOptions,
  onClose,
  onSubmit,
  theme,
  copy,
}: AddEditUserModalProps) {
  if (!show) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className={`absolute inset-0 ${theme.modalOverlay} backdrop-blur-sm`} onClick={onClose}></div>
      <Card className="relative w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl border-none animate-in zoom-in-95 duration-200">
        <CardContent className="p-8">
          <div className="flex justify-between items-center mb-6">
            <h3 className={`text-xl font-bold ${theme.titleStrong}`}>{isAddMode ? copy.addTitle : 'Edit Staff Profile'}</h3>
            <button onClick={onClose} className={`p-2 ${theme.closeHoverPlain} rounded-full`}>
              <X size={20} className="text-gray-400" />
            </button>
          </div>
          <div className="space-y-4">
            <div className="space-y-1">
              <label className={`text-[10px] font-bold ${theme.fieldLabel} uppercase ml-1`}>Full Name</label>
              <input
                type="text"
                className={`w-full px-4 py-3 rounded-xl border ${theme.fieldInput} outline-none focus:bg-white transition-all font-bold`}
                value={isAddMode ? newUser.name : currentUser?.name}
                onChange={(e) =>
                  isAddMode
                    ? setNewUser({ ...newUser, name: e.target.value })
                    : setCurrentUser(currentUser ? { ...currentUser, name: e.target.value } : null)
                }
              />
            </div>
            <div className="space-y-1">
              <label className={`text-[10px] font-bold ${theme.fieldLabel} uppercase ml-1`}>Work Email</label>
              <input
                type="email"
                className={`w-full px-4 py-3 rounded-xl border ${theme.fieldInput} outline-none focus:bg-white transition-all font-bold`}
                value={isAddMode ? newUser.email : currentUser?.email}
                onChange={(e) =>
                  isAddMode
                    ? setNewUser({ ...newUser, email: e.target.value })
                    : setCurrentUser(currentUser ? { ...currentUser, email: e.target.value } : null)
                }
              />
            </div>
            <div className="space-y-1">
              <label className={`text-[10px] font-bold ${theme.fieldLabel} uppercase ml-1`}>System Role</label>
              <select
                className={`w-full px-4 py-3 rounded-xl border ${theme.fieldInput} outline-none focus:bg-white transition-all font-bold appearance-none`}
                value={isAddMode ? newUser.role : currentUser?.role}
                onChange={(e) =>
                  isAddMode
                    ? setNewUser({ ...newUser, role: e.target.value })
                    : setCurrentUser(currentUser ? { ...currentUser, role: e.target.value } : null)
                }
              >
                {roleOptions.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>
            </div>
            <Button
              onClick={onSubmit}
              className={`w-full ${theme.primaryButton} text-white rounded-xl py-6 font-bold mt-4 uppercase text-[10px] tracking-widest shadow-lg`}
            >
              {isAddMode ? copy.addButton : 'Update Permissions'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

interface RejectRequestModalProps {
  request: AdminRequestRecord | null;
  reason: string;
  setReason: (value: string) => void;
  onClose: () => void;
  onConfirm: () => void;
  theme: SettingsTheme;
  copy: { description: (name: string) => string; placeholder: string; helper: string };
}

export function RejectRequestModal({ request, reason, setReason, onClose, onConfirm, theme, copy }: RejectRequestModalProps) {
  if (!request) {
    return null;
  }

  return (
    <div className={`fixed inset-0 ${theme.rejectZ} flex items-center justify-center p-4`}>
      <div className={`absolute inset-0 ${theme.rejectOverlay} backdrop-blur-sm`} onClick={onClose}></div>
      <Card className="relative w-full max-w-lg bg-white rounded-[2.5rem] shadow-2xl border-none animate-in zoom-in-95 duration-200">
        <CardContent className="p-8">
          <div className="flex items-start justify-between mb-6 gap-4">
            <div>
              <h3 className={`text-xl font-bold ${theme.titleStrong}`}>Reject Admin Request</h3>
              <p className={`text-sm ${theme.mutedText60} font-medium mt-1`}>{copy.description(request.name)}</p>
            </div>
            <button onClick={onClose} className={`p-2 ${theme.closeHoverSoft} rounded-full transition-colors`}>
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>

          <div className="space-y-3">
            <label className={`text-[10px] font-bold ${theme.fieldLabel50} uppercase tracking-widest ml-1`}>Rejection Reason</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={copy.placeholder}
              className={`w-full min-h-32 rounded-2xl border ${theme.rejectTextarea} px-4 py-3 outline-none transition-all text-sm font-medium resize-none`}
            />
            <p className={`text-xs ${theme.mutedText55} font-medium`}>{copy.helper}</p>
          </div>

          <div className="mt-6 flex items-center justify-end gap-3">
            <Button variant="outline" onClick={onClose} className={`rounded-xl ${theme.cancelButton}`}>
              Cancel
            </Button>
            <Button
              onClick={onConfirm}
              disabled={!reason.trim()}
              className="rounded-xl bg-red-500 hover:bg-red-600 text-white disabled:opacity-50"
            >
              Confirm Rejection
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

interface TeamManagementCardProps {
  users: UserRecord[];
  onAddUser: () => void;
  onEditUser: (user: UserRecord) => void;
  onToggleStatus: (id: number) => void;
  theme: SettingsTheme;
}

export function TeamManagementCard({ users, onAddUser, onEditUser, onToggleStatus, theme }: TeamManagementCardProps) {
  return (
    <Card className={`bg-white rounded-[2.5rem] ${theme.card} shadow-sm overflow-hidden flex flex-col h-[500px]`}>
      <CardHeader className={`p-8 border-b ${theme.cardHeaderBorder} bg-white flex-shrink-0`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-3 ${theme.iconWrap} rounded-2xl`}>
              <Users className={`w-5 h-5 ${theme.accentText}`} />
            </div>
            <div>
              <CardTitle className={`text-xl font-bold ${theme.titleStrong}`}>Team Management</CardTitle>
              <CardDescription className={`text-xs font-medium ${theme.cardDescription}`}>Add, edit or deactivate system users</CardDescription>
            </div>
          </div>
          <Button onClick={onAddUser} className={`${theme.addUserButton} text-white rounded-xl font-bold h-12 px-5 transition-all shadow-lg`}>
            <UserPlus className="w-4 h-4 mr-2" /> Add User
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0 overflow-y-auto flex-1 custom-scrollbar">
        <table className="w-full text-left border-collapse">
          <thead className={`${theme.tableHead} border-b text-[10px] uppercase font-bold sticky top-0 z-10`}>
            <tr>
              <th className="px-8 py-4">User</th>
              <th className="px-8 py-4">Role</th>
              <th className="px-8 py-4">Status</th>
              <th className="px-8 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className={`divide-y ${theme.tableDivide}`}>
            {users.map((u) => (
              <tr key={u.id} className={`${theme.rowHover} transition-colors group`}>
                <td className="px-8 py-5">
                  <p className={`font-bold text-sm ${theme.titleStrong}`}>{u.name}</p>
                  <p className="text-xs text-gray-400 font-medium">{u.email}</p>
                </td>
                <td className="px-8 py-5">
                  <span
                    className={`text-[10px] font-bold px-3 py-1 bg-white border rounded-lg uppercase tracking-wider ${
                      u.role === 'Super Admin' ? theme.roleBadgeSuper : theme.roleBadgeDefault
                    }`}
                  >
                    {u.role}
                  </span>
                </td>
                <td className="px-8 py-5">
                  <div className={`flex items-center gap-1.5 text-xs font-bold ${u.status === 'Active' ? 'text-emerald-500' : 'text-gray-400'}`}>
                    <div className={`w-1.5 h-1.5 rounded-full ${u.status === 'Active' ? 'bg-emerald-500' : 'bg-gray-400'}`} />
                    {u.status}
                  </div>
                </td>
                <td className="px-8 py-5 text-right">
                  <div className="flex justify-end gap-2">
                    <button onClick={() => onEditUser(u)} className={`p-2 hover:bg-white rounded-lg text-gray-400 ${theme.editHover} transition-all`}>
                      <Edit3 size={16} />
                    </button>
                    <button
                      onClick={() => onToggleStatus(u.id)}
                      className={`p-2 hover:bg-white rounded-lg transition-all ${u.status === 'Active' ? 'text-red-400 hover:text-red-500' : 'text-emerald-400'}`}
                    >
                      {u.status === 'Active' ? <UserMinus size={16} /> : <UserPlus size={16} />}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}

interface AdminRequestsCardProps {
  requests: AdminRequestRecord[];
  onApprove: (id: string) => void;
  onReject: (request: AdminRequestRecord) => void;
  theme: SettingsTheme;
  copy: { emptyDescription: string };
}

export function AdminRequestsCard({ requests, onApprove, onReject, theme, copy }: AdminRequestsCardProps) {
  return (
    <Card className={`bg-white rounded-[2.5rem] ${theme.card} shadow-sm overflow-hidden`}>
      <CardHeader className={`p-8 border-b ${theme.cardHeaderBorder} bg-white`}>
        <div className="flex items-center gap-3">
          <div className={`p-3 ${theme.iconWrap} rounded-2xl`}>
            <UserCheck className={`w-5 h-5 ${theme.accentText}`} />
          </div>
          <div>
            <CardTitle className={`text-xl font-bold ${theme.titleStrong}`}>Admin Requests</CardTitle>
            <CardDescription className={`text-xs font-medium ${theme.cardDescription}`}>
              Review pending admin signup requests and decide whether to approve or reject them.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {requests.length === 0 ? (
          <div className="px-8 py-16 text-center">
            <p className={`text-lg font-bold ${theme.titleStrong}`}>No pending admin requests</p>
            <p className={`mt-2 text-sm ${theme.mutedText60} font-medium`}>{copy.emptyDescription}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className={`${theme.tableHead} border-b text-[10px] uppercase font-bold`}>
                <tr>
                  <th className="px-8 py-4">Applicant</th>
                  <th className="px-8 py-4">Requested Role</th>
                  <th className="px-8 py-4">Request Date</th>
                  <th className="px-8 py-4">Status</th>
                  <th className="px-8 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${theme.tableDivide}`}>
                {requests.map((request) => (
                  <tr key={request.id} className={`${theme.rowHover} transition-colors`}>
                    <td className="px-8 py-5">
                      <p className={`font-bold text-sm ${theme.titleStrong}`}>{request.name}</p>
                      <p className="text-xs text-gray-400 font-medium">{request.email}</p>
                    </td>
                    <td className="px-8 py-5">
                      <span className={`inline-flex rounded-lg border ${theme.roleBadge} bg-white px-3 py-1 text-[10px] font-bold uppercase tracking-wider`}>
                        {request.requestedRole}
                      </span>
                    </td>
                    <td className={`px-8 py-5 text-sm font-semibold ${theme.bodyText}`}>{request.requestDate}</td>
                    <td className="px-8 py-5">
                      <span className="inline-flex rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-700">
                        Pending
                      </span>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex justify-end gap-3">
                        <Button onClick={() => onApprove(request.id)} className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl h-10 px-4">
                          Approve
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => onReject(request)}
                          className="rounded-xl border-red-200 text-red-500 hover:bg-red-50 hover:text-red-600"
                        >
                          Reject
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
