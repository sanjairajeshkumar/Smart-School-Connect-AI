/**
 * Tenant Security Guard: Enforces multi-tenant isolation
 * Ensures that non-super-admin users can only interact with their assigned school tenant.
 */
const tenantGuard = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Unauthenticated' });
  }

  // Super admins have cross-tenant platform visibility
  if (req.user.role === 'super_admin') {
    return next();
  }

  if (!req.schoolId) {
    return res.status(403).json({
      success: false,
      message: 'Access Denied: User is not linked to any active school tenant.',
    });
  }

  // If a schoolId query or body param was sent, ensure it matches user's tenant
  const targetSchoolId = req.params.schoolId || req.query.schoolId || req.body.schoolId;
  if (targetSchoolId && targetSchoolId.toString() !== req.schoolId.toString()) {
    return res.status(403).json({
      success: false,
      message: 'Security Violation: Cross-tenant access attempt blocked by tenant guard.',
    });
  }

  next();
};

module.exports = tenantGuard;
