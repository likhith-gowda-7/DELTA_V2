// Wrapper to catch async errors in controllers
export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Default export alias — supports legacy default-import call sites
// (e.g. callController.js) without touching the other files that
// use the named import.
export default asyncHandler;
