// Admin initialization is handled server-side only for security
// No hardcoded credentials should be stored in frontend code

export const initializeAdminUser = async () => {
  // Admin provisioning is now handled entirely server-side
  // This function is kept for backwards compatibility but does nothing
  return { message: "Admin initialization is server-side only" };
};
