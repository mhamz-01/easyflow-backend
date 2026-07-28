// Vercel serverless entry point — wraps the Express app as a request handler.
//
// TEMP DIAGNOSTIC: app.js is required inside a try/catch so that if it throws
// during module load (missing env var, bad require, etc.), we surface the
// real error in the HTTP response and console instead of a bare
// FUNCTION_INVOCATION_FAILED with no detail. Remove this wrapper once the
// deployment is stable — a raw `module.exports = require("../app.js")` is
// the normal/permanent form.
let app;
let loadError;

try {
  app = require("../app.js");
} catch (err) {
  loadError = err;
  console.error("Fatal error while loading app.js:", err);
}

module.exports = app
  ? app
  : (req, res) => {
      res.status(500).json({
        message: "Server failed to initialize",
        error: loadError?.message,
        name: loadError?.name,
      });
    };