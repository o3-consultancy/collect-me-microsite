import { ref } from 'vue'
import apiClient from '@/services/api'

export function usePendingCheck() {
  const hasPending = ref(false)
  const loading = ref(false)
  const error = ref(null)

  /**
   * Check if a pending collection request exists
   * @param {string} containerId - Container ID
   * @param {string} householdId - Household ID (optional)
   * @returns {Promise<boolean>}
   */
  const checkPending = async (containerId, householdId = null) => {
    loading.value = true
    error.value = null

    try {
      const params = { containerId }
      if (householdId) {
        params.householdId = householdId
      }

      const response = await apiClient.get('/collection-requests/check-pending', {
        params
      })

      hasPending.value = response.data.pending
      return response.data.pending
    } catch (err) {
      error.value = 'Failed to check pending requests'
      console.error('Check pending error:', err)
      return false
    } finally {
      loading.value = false
    }
  }

  return {
    hasPending,
    loading,
    error,
    checkPending
  }
}
