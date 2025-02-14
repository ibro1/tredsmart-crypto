import util from "util"

export function debugCode(code: string | object, isShown: boolean = true) {
  // eslint-disable-next-line node/no-process-env
  if (process.env.NODE_ENV !== "development" || isShown !== true) return null
  console.info(util.inspect(code, false, null, true))
}

/**
 * Generates a username from email and fullname
 * Removes special characters and spaces, converts to lowercase
 */
export function generateUsername(email: string, fullname: string): string {
  // Get the part before @ from email
  const emailName = email.split('@')[0]
  
  // Clean and format the full name
  const cleanName = fullname
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '') // Remove special characters
    .slice(0, 10) // Limit length
  
  // Combine email and name
  const baseUsername = `${cleanName}${emailName.slice(0, 5)}`
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .slice(0, 15) // Keep reasonable length
  
  return baseUsername
}
