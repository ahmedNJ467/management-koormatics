export const handleAuthError = (error: Error) => {
  console.error("Auth error:", error.message);
  return error.message;
};
