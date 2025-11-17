import { ref } from 'vue'
import apiClient from '@/services/api'

export function useCollectionRequest() {
  const requestId = ref(null)
  const loading = ref(false)
  const error = ref(null)
  const success = ref(false)

  /**
   * Get user's current geolocation
   * @returns {Promise<object|null>}
   */
  const getUserLocation = async () => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        console.warn('Geolocation not supported')
        resolve(null)
        return
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          })
        },
        (error) => {
          console.warn('Geolocation error:', error)
          resolve(null)
        },
        {
          timeout: 5000,
          maximumAge: 60000
        }
      )
    })
  }

  /**
   * Create a collection request
   * @param {string} containerId - Container ID
   * @param {string} householdId - Household ID
   * @param {string} signature - Signature from QR sign
   * @returns {Promise<string>} Request ID
   */
  const createRequest = async (containerId, householdId, signature) => {
    loading.value = true
    error.value = null
    success.value = false

    try {
      // Get user location (optional)
      const geoAtRequest = await getUserLocation()

      const requestBody = {
        containerId,
        householdId,
        geoAtRequest: geoAtRequest || {
          latitude: 0,
          longitude: 0
        }
      }

      const response = await apiClient.post('/collection-requests', requestBody, {
        params: { sig: signature }
      })

      requestId.value = response.data.id
      success.value = true

      return response.data.id
    } catch (err) {
      if (err.response?.status === 409) {
        error.value = 'A collection request for this container is already pending.'
      } else if (err.response?.status === 401) {
        error.value = 'Session expired. Please scan the QR code again.'
      } else {
        error.value = 'Failed to create collection request. Please try again.'
      }
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    requestId,
    loading,
    error,
    success,
    createRequest
  }
}
