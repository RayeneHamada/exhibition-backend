module.exports.convertToKebabCase = (text) => {
    // Replace any non-alphanumeric characters with a hyphen
    const kebabCaseText = text.replace(/[^a-zA-Z0-9]/g, '-');
    // Replace any consecutive hyphens with a single hyphen
    return kebabCaseText.replace(/-{2,}/g, '-').toLowerCase();
  }