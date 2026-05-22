/**
 * Extracts plain text preview from the doc's content JSONB field
 * Content is an array of tabs, each with a TipTap JSONContent node tree
 */
const extractDocPreview = (content, maxLength = 120) => {
    if (!content || !Array.isArray(content) || content.length === 0) {
      return "No content yet.";
    }
  
    const texts = [];
  
    const extractText = (node) => {
      if (!node) return;
      if (node.type === "text" && node.text) {
        texts.push(node.text);
      }
      if (node.content && Array.isArray(node.content)) {
        node.content.forEach(extractText);
      }
    };
  
    // go through each tab's content
    content.forEach((tab) => {
      if (tab.content) {
        extractText(tab.content);
      }
    });
  
    const fullText = texts.join(" ").trim();
    if (!fullText) return "No content yet.";
  
    return fullText.length > maxLength
      ? fullText.slice(0, maxLength) + "..."
      : fullText;
  };
  
  module.exports = { extractDocPreview };