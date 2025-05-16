/**
 * Utility functions for formatting data
 */

/**
 * Masks an email address for privacy
 * @param {string} email - The email address to mask
 * @returns {string} - The masked email address (e.g., j***e@example.com)
 */
export const maskEmail = (email) => {
  if (!email) return '';
  
  const [username, domain] = email.split('@');
  
  if (!username || !domain) return email;
  
  let maskedUsername;
  if (username.length <= 2) {
    maskedUsername = username[0] + '*'.repeat(username.length - 1);
  } else {
    maskedUsername = username[0] + '*'.repeat(username.length - 2) + username[username.length - 1];
  }
  
  return `${maskedUsername}@${domain}`;
};

/**
 * Shortens a blockchain address for display
 * @param {string} address - The blockchain address to shorten
 * @param {number} chars - Number of characters to show at start and end (default: 4)
 * @returns {string} - The shortened address (e.g., 0x1234...5678)
 */
export const shortenAddress = (address, chars = 4) => {
  if (!address) return '';
  
  if (address.length <= chars * 2 + 3) return address;
  
  return `${address.substring(0, chars)}...${address.substring(address.length - chars)}`;
}; 