"use client";

import { useAdmin } from "./AdminProvider";

/** Which part of the network the admin lists show; the server checks the choice against the operator's roles. */
export function AdminScopePicker() {
  const { context, scope, scopeLabel, setScope } = useAdmin();
  if (context.scopeOptions.length <= 1) {
    return <p className="adm-scope">Phạm vi: <strong>{scopeLabel || "Toàn hệ thống"}</strong></p>;
  }
  return (
    <label className="adm-scope sh-field">
      Phạm vi
      <select value={scope} onChange={event => setScope(event.target.value)}>
        {context.scopeOptions.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>
    </label>
  );
}
