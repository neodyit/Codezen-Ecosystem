import { useState, useEffect } from "react";
import {
  Shield,
  Check,
  Save,
  RotateCcw,
  CheckSquare,
  Square,
  Users,
  Layers,
  Sparkles,
  RefreshCw
} from "lucide-react";
import { apiFetch } from "@/config/api";

interface PermissionItem {
  key: string;
  label: string;
  description: string;
}

interface ModuleCatalog {
  module: string;
  description: string;
  permissions: PermissionItem[];
}

interface RbacData {
  roles: string[];
  catalog: ModuleCatalog[];
  role_permissions: Record<string, string[]>;
}

export default function RBACTab() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedRole, setSelectedRole] = useState<string>("Admin");
  const [roles, setRoles] = useState<string[]>([]);
  const [catalog, setCatalog] = useState<ModuleCatalog[]>([]);
  const [permissionMatrix, setPermissionMatrix] = useState<Record<string, string[]>>({});
  const [feedback, setFeedback] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");

  const showFeedback = (msg: string) => {
    setFeedback(msg);
    setTimeout(() => setFeedback(""), 4000);
  };

  const loadRbacData = async (force: boolean = false) => {
    setLoading(true);
    try {
      const res = await apiFetch("/admin/rbac/permissions", { skipCache: force });
      const data: { success: boolean } & RbacData = await res.json();
      if (res.ok && data.success) {
        setRoles(data.roles || []);
        setCatalog(data.catalog || []);
        setPermissionMatrix(data.role_permissions || {});
        if (data.roles && data.roles.length > 0 && !selectedRole) {
          setSelectedRole(data.roles[0]);
        }
      } else {
        showFeedback("Failed to load RBAC permissions catalog.");
      }
    } catch {
      showFeedback("Network error loading RBAC permissions.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRbacData();
  }, []);

  const activePermissions = permissionMatrix[selectedRole] || [];

  const isGranted = (permKey: string) => activePermissions.includes(permKey);

  const togglePermission = (permKey: string) => {
    setPermissionMatrix((prev) => {
      const current = prev[selectedRole] || [];
      const updated = current.includes(permKey)
        ? current.filter((k) => k !== permKey)
        : [...current, permKey];
      return { ...prev, [selectedRole]: updated };
    });
  };

  const toggleAllInModule = (modulePerms: PermissionItem[]) => {
    const keys = modulePerms.map((p) => p.key);
    const allSelected = keys.every((k) => activePermissions.includes(k));

    setPermissionMatrix((prev) => {
      const current = prev[selectedRole] || [];
      let updated: string[];
      if (allSelected) {
        // Deselect all in module
        updated = current.filter((k) => !keys.includes(k));
      } else {
        // Grant all in module
        updated = Array.from(new Set([...current, ...keys]));
      }
      return { ...prev, [selectedRole]: updated };
    });
  };

  const grantAllRole = () => {
    const allKeys = catalog.flatMap((m) => m.permissions.map((p) => p.key));
    setPermissionMatrix((prev) => ({ ...prev, [selectedRole]: allKeys }));
  };

  const revokeAllRole = () => {
    setPermissionMatrix((prev) => ({ ...prev, [selectedRole]: [] }));
  };

  const savePermissionsSubmit = async () => {
    setSaving(true);
    try {
      const res = await apiFetch("/admin/rbac/permissions", {
        method: "POST",
        body: JSON.stringify({
          role_name: selectedRole,
          permissions: activePermissions,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        showFeedback(data.message || `Permissions for ${selectedRole} saved.`);
      } else {
        showFeedback(data.error || "Failed to update role permissions.");
      }
    } catch {
      showFeedback("Network error updating role permissions.");
    } finally {
      setSaving(false);
    }
  };

  // Filter modules based on search
  const filteredCatalog = catalog.map((m) => {
    if (!searchTerm.trim()) return m;
    const term = searchTerm.toLowerCase();
    const matchedPerms = m.permissions.filter(
      (p) =>
        p.label.toLowerCase().includes(term) ||
        p.key.toLowerCase().includes(term) ||
        p.description.toLowerCase().includes(term)
    );
    const moduleMatches = m.module.toLowerCase().includes(term);
    return {
      ...m,
      permissions: moduleMatches ? m.permissions : matchedPerms,
    };
  }).filter((m) => m.permissions.length > 0);

  return (
    <div className="space-y-5">
      {/* Feedback Toast */}
      {feedback && (
        <div className="fixed top-4 right-4 z-50 px-4 py-2.5 bg-white text-black font-bold text-xs shadow-2xl border border-black flex items-center gap-2">
          <Check size={14} className="text-black" />
          <span>{feedback}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-800">
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wider text-white flex items-center gap-2">
            <Shield size={16} className="text-white" />
            <span>Role-Based Access Control (RBAC)</span>
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Configure system capabilities, module privileges, and action permissions across all ecosystem roles.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => loadRbacData(true)}
            className="p-2 border border-zinc-800 hover:border-zinc-700 bg-zinc-900 text-zinc-400 hover:text-white rounded transition-colors"
            title="Reload Permissions"
          >
            <RotateCcw size={14} />
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={savePermissionsSubmit}
            className="px-4 py-1.5 bg-white hover:bg-zinc-200 text-black text-xs font-bold uppercase rounded flex items-center gap-1.5 transition-colors disabled:opacity-50 shadow"
          >
            {saving ? <RefreshCw size={13} className="animate-spin" /> : <Save size={13} />}
            <span>{saving ? "Saving..." : "Save"}</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-24 text-center border border-zinc-800 bg-zinc-950 rounded-xl text-zinc-400 font-mono text-xs">
          <RefreshCw size={20} className="animate-spin mx-auto mb-2 text-white" />
          <span>Loading RBAC Configuration...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          
          {/* LEFT COLUMN: Role Selector & Quick Actions (4 cols) */}
          <div className="lg:col-span-4 space-y-4">
            
            {/* Role List Selection */}
            <div className="border border-zinc-800 bg-zinc-950 rounded-xl p-4">
              <span className="text-[10px] uppercase font-mono tracking-widest text-zinc-500 block mb-2 font-bold">
                Target Ecosystem Role
              </span>

              <div className="space-y-1">
                {roles.map((role) => {
                  const isSelected = selectedRole === role;
                  const permCount = (permissionMatrix[role] || []).length;
                  return (
                    <button
                      key={role}
                      type="button"
                      onClick={() => setSelectedRole(role)}
                      className={`w-full text-left px-3.5 py-2.5 rounded-lg text-xs transition-all flex items-center justify-between border ${
                        isSelected
                          ? "bg-white text-black font-bold border-white shadow-md"
                          : "bg-zinc-900/60 hover:bg-zinc-900 border-zinc-800 text-zinc-300 hover:text-white"
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <Users size={14} className={isSelected ? "text-black" : "text-zinc-500"} />
                        <span className="truncate">{role}</span>
                      </div>
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
                          isSelected ? "bg-black text-white" : "bg-zinc-800 text-zinc-400"
                        }`}
                      >
                        {permCount} grants
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Quick Bulk Presets */}
            <div className="border border-zinc-800 bg-zinc-950 rounded-xl p-4 space-y-3">
              <span className="text-[10px] uppercase font-mono tracking-widest text-zinc-500 block font-bold">
                Quick Actions
              </span>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  type="button"
                  onClick={grantAllRole}
                  className="p-2 border border-emerald-500/30 hover:border-emerald-500/60 bg-emerald-500/10 text-emerald-400 font-semibold rounded text-[11px] transition-colors"
                >
                  Grant All Access
                </button>
                <button
                  type="button"
                  onClick={revokeAllRole}
                  className="p-2 border border-rose-500/30 hover:border-rose-500/60 bg-rose-500/10 text-rose-400 font-semibold rounded text-[11px] transition-colors"
                >
                  Revoke All
                </button>
              </div>

              <div className="pt-2 border-t border-zinc-850 text-[11px] text-zinc-400 space-y-1 leading-relaxed">
                <p>
                  Editing capabilities assigned to <span className="font-bold text-white">{selectedRole}</span>.
                </p>
                <p className="text-[10px] text-zinc-500">
                  Users holding this role will immediately inherit these capabilities across the portal.
                </p>
              </div>
            </div>

            {/* Role Summary Insight Card */}
            <div className="border border-zinc-850 bg-gradient-to-br from-zinc-900 to-zinc-950 p-4 rounded-xl text-xs space-y-2">
              <div className="flex items-center gap-1.5 text-zinc-300 font-bold uppercase text-[11px]">
                <Sparkles size={13} className="text-emerald-400" />
                <span>Security Governance</span>
              </div>
              <p className="text-[11px] text-zinc-400 leading-relaxed">
                Permissions are validated both client-side and server-side across all endpoints to guarantee zero unauthorized operations.
              </p>
            </div>
          </div>

          {/* RIGHT COLUMN: Granular Permission Modules & Checkboxes (8 cols) */}
          <div className="lg:col-span-8 space-y-4">
            
            {/* Search filter for permissions */}
            <div className="border border-zinc-800 bg-zinc-950 rounded-xl p-3 flex items-center justify-between gap-3">
              <input
                type="text"
                placeholder="Search permissions or modules..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-transparent text-xs text-white placeholder:text-zinc-500 outline-none font-mono"
              />
              <span className="text-[11px] font-mono text-zinc-500 shrink-0">
                {activePermissions.length} Active for {selectedRole}
              </span>
            </div>

            {/* Modules Accordion List */}
            <div className="space-y-3">
              {filteredCatalog.map((mod) => {
                const keys = mod.permissions.map((p) => p.key);
                const allSelected = keys.every((k) => activePermissions.includes(k));

                return (
                  <div
                    key={mod.module}
                    className="border border-zinc-800 bg-zinc-950 rounded-xl overflow-hidden transition-all shadow-sm"
                  >
                    {/* Module Header Bar */}
                    <div className="p-3.5 bg-zinc-900/60 border-b border-zinc-850/80 flex items-center justify-between gap-3">
                      <div>
                        <h3 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-2">
                          <Layers size={13} className="text-zinc-400" />
                          <span>{mod.module}</span>
                        </h3>
                        <p className="text-[10px] text-zinc-500 mt-0.5">{mod.description}</p>
                      </div>

                      {/* Select All in this Module */}
                      <button
                        type="button"
                        onClick={() => toggleAllInModule(mod.permissions)}
                        className={`text-[10px] font-mono uppercase font-bold px-2 py-1 rounded border transition-colors flex items-center gap-1.5 ${
                          allSelected
                            ? "bg-white text-black border-white"
                            : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white"
                        }`}
                      >
                        {allSelected ? <CheckSquare size={12} /> : <Square size={12} />}
                        <span>{allSelected ? "Module Granted" : "Grant Module"}</span>
                      </button>
                    </div>

                    {/* Permissions Grid inside Module */}
                    <div className="p-3 grid grid-cols-1 md:grid-cols-2 gap-2.5">
                      {mod.permissions.map((perm) => {
                        const checked = isGranted(perm.key);
                        return (
                          <div
                            key={perm.key}
                            onClick={() => togglePermission(perm.key)}
                            className={`p-2.5 rounded-lg border cursor-pointer transition-all flex items-start gap-3 select-none ${
                              checked
                                ? "bg-zinc-900 border-zinc-700 hover:border-zinc-500"
                                : "bg-black/40 border-zinc-900 hover:border-zinc-800 opacity-70 hover:opacity-100"
                            }`}
                          >
                            <div className="mt-0.5 text-zinc-400">
                              {checked ? (
                                <CheckSquare size={15} className="text-white" />
                              ) : (
                                <Square size={15} />
                              )}
                            </div>

                            <div className="overflow-hidden">
                              <span className="font-bold text-white text-xs block leading-tight">
                                {perm.label}
                              </span>
                              <span className="text-[10px] text-zinc-500 block truncate mt-0.5 leading-snug">
                                {perm.description}
                              </span>
                              <span className="text-[9px] font-mono text-zinc-600 block mt-1">
                                {perm.key}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
