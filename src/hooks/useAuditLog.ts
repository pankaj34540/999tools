// ============================================
// useAuditLog — Reusable hook for staff action logging
// ============================================
import { useCallback } from 'react';
import { Staff, AuditLog } from '../types';
import { logAuditAction } from '../services/staffService';

export const useAuditLog = (staff?: Staff | null) => {
  const log = useCallback(
    async (
      action: string,
      targetType: AuditLog['targetType'],
      targetId?: string,
      targetName?: string,
      details?: string
    ) => {
      // Only log if staff is present (owner's own actions don't need audit trail)
      if (!staff) {
        console.log('ℹ️ Skipping audit log — no staff context (owner mode)');
        return;
      }

      await logAuditAction(staff, action, targetType, targetId, targetName, details);
    },
    [staff]
  );

  return { log };
};
