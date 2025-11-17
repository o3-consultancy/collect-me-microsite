/**
 * Extract containerId from URL query parameters
 * @returns {string|null} Container ID or null if not found
 */
export function getContainerIdFromUrl() {
  const urlParams = new URLSearchParams(window.location.search)
  const containerId = urlParams.get('containerId')

  if (!containerId) {
    console.error('No containerId found in URL')
    return null
  }

  // Validate format (optional)
  if (!containerId.startsWith('container_')) {
    console.error('Invalid containerId format')
    return null
  }

  return containerId
}
