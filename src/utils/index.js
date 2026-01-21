// generate a slug using string
const createSlug = (value) => {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-") // replace spaces and symbols with hyphens
    .replace(/^-+|-+$/g, ""); // remove leading/trailing hyphens
};

const generateRandomColor = () => {};

module.exports = { createSlug };
