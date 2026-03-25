// generate a slug using string
const createSlug = (value) => {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-") // replace spaces and symbols with hyphens
    .replace(/^-+|-+$/g, ""); // remove leading/trailing hyphens
};
const sendSuccess = (res, data, statusCode = 200, message = "Success") =>
  res.status(statusCode).json({ success: true, message, data });

module.exports = { createSlug, sendSuccess };
