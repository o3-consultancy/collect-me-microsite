import { ref } from 'vue'
import apiClient from '@/services/api'

export function useContainerVerification() {
  const signature = ref(null)
  const containerId = ref(null)
  const householdId = ref(null)
  const loading = ref(false)
  const error = ref(null)

  /**
   * Sign QR action and get signature
   * @param {string} containerIdParam - Container ID from URL
   * @returns {Promise<object>} Object with signature and householdId
   */
  const signQrAction = async (containerIdParam) => {
    loading.value = true
    error.value = null

    try {
      // Step 1: Get signature from public endpoint
      const signResponse = await apiClient.get('/qr/sign', {
        params: { containerId: containerIdParam }
      })

      containerId.value = signResponse.data.containerId
      signature.value = signResponse.data.sig

      // Step 2: Get container details to fetch householdId (requires API key)
      try {
        const containerResponse = await apiClient.get(`/containers/${containerIdParam}`)
        householdId.value = containerResponse.data.assignedHouseholdId || null
      } catch (containerErr) {
        console.warn('Could not fetch container details:', containerErr)
        // If we can't get household ID, we'll try to proceed without it
        householdId.value = null
      }

      return {
        signature: signature.value,
        householdId: householdId.value
      }
    } catch (err) {
      if (err.response?.status === 404) {
        error.value = 'Container not found. Please check the QR code.'
      } else {
        error.value = 'Failed to verify container. Please try again.'
      }
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Verify signature (optional validation)
   * @returns {Promise<boolean>}
   */
  const verifySignature = async () => {
    if (!signature.value || !containerId.value) {
      throw new Error('No signature to verify')
    }

    try {
      const response = await apiClient.get('/qr/verify', {
        params: {
          containerId: containerId.value,
          sig: signature.value
        }
      })

      return response.data.valid
    } catch (err) {
      console.error('Signature verification failed:', err)
      return false
    }
  }

  return {
    signature,
    containerId,
    householdId,
    loading,
    error,
    signQrAction,
    verifySignature
  }
}
