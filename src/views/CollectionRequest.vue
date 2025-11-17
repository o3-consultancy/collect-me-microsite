<template>
  <div class="min-h-screen bg-gradient-to-br from-primary-blue to-primary-blue-shade p-5">
    <!-- Loading State -->
    <div v-if="initializing" class="flex flex-col items-center justify-center min-h-[80vh] text-white">
      <div class="spinner border-4 border-white/30 border-t-white rounded-full w-12 h-12 animate-spin mb-5"></div>
      <p class="text-lg font-medium">Verifying container...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="initError" class="bg-white rounded-3xl p-10 text-center max-w-lg mx-auto my-12 shadow-soft animate-floatUp">
      <div class="text-6xl mb-5">⚠️</div>
      <h2 class="text-accent-coral text-2xl font-bold mb-3">Invalid QR Code</h2>
      <p class="text-neutral-dark-2 mb-2">{{ initError }}</p>
      <p class="text-neutral-dark-2 text-sm mt-5">Please scan a valid container QR code or contact support.</p>
    </div>

    <!-- Main Content -->
    <div v-else class="max-w-lg mx-auto animate-floatUp">
      <!-- Header -->
      <div class="text-center text-white mb-8">
        <div class="flex items-center justify-center mb-5">
          <svg class="w-32 h-32" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="50" cy="50" r="45" fill="white" opacity="0.1"/>
            <circle cx="50" cy="50" r="35" fill="#B2D235"/>
            <path d="M50 25 L65 40 L65 65 L50 75 L35 65 L35 40 Z" fill="white"/>
          </svg>
        </div>
        <h1 class="text-3xl font-bold mb-2">Request Collection</h1>
        <p class="text-white/90">Neutral Fuels - Waste Oil Collection</p>
      </div>

      <!-- Container Info -->
      <div class="bg-white rounded-xl2 p-6 text-center mb-5 shadow-soft">
        <div class="text-5xl mb-3">🛢️</div>
        <p class="text-neutral-dark-2 text-xs uppercase tracking-widest mb-1 font-semibold">Container ID</p>
        <p class="text-neutral-dark-1 text-lg font-bold font-mono">{{ containerIdShort }}</p>
      </div>

      <!-- Pending Request Notice -->
      <div v-if="hasPending" class="bg-primary-green-tint/20 border-2 border-primary-green rounded-xl2 p-6 text-center mb-5 shadow-soft">
        <div class="text-5xl mb-4">⏳</div>
        <h3 class="text-primary-blue-shade text-xl font-bold mb-2">Collection Request Pending</h3>
        <p class="text-neutral-dark-1 mb-1">Your collection request has been received. Our team will assign a collection window soon.</p>
        <p class="text-neutral-dark-2 text-sm mt-4">You will be contacted when collection is scheduled.</p>
      </div>

      <!-- Success Message -->
      <div v-else-if="requestSuccess" class="bg-primary-green/10 border-2 border-primary-green rounded-xl2 p-6 text-center mb-5 shadow-soft">
        <div class="text-5xl mb-4">✅</div>
        <h3 class="text-primary-blue-shade text-xl font-bold mb-2">Request Submitted!</h3>
        <p class="text-neutral-dark-1 mb-1">Your collection request has been successfully created.</p>
        <p class="text-neutral-dark-2 text-sm mt-4">Our team will contact you with a collection schedule.</p>
      </div>

      <!-- Request Button -->
      <div v-else class="bg-white rounded-xl2 p-8 mb-5 shadow-soft">
        <p class="text-neutral-dark-2 leading-relaxed mb-6 text-center">
          Click the button below to request a collection. Our team will contact you to schedule a collection time.
        </p>

        <button
          @click="handleRequestCollection"
          :disabled="loading || hasPending"
          class="w-full bg-primary-green hover:bg-primary-green-shade text-white border-none rounded-xl py-5 text-lg font-bold cursor-pointer transition-all duration-300 shadow-soft hover:shadow-xl disabled:opacity-60 disabled:cursor-not-allowed hover:enabled:-translate-y-1 active:enabled:translate-y-0"
        >
          <span v-if="loading" class="flex items-center justify-center">
            <div class="button-spinner border-3 border-white/30 border-t-white rounded-full w-5 h-5 animate-spin mr-3"></div>
            Submitting...
          </span>
          <span v-else>Request Collection</span>
        </button>

        <!-- Error Message -->
        <div v-if="requestError" class="bg-accent-coral/10 border border-accent-coral rounded-lg p-3 mt-4 text-accent-coral text-sm text-center font-medium">
          {{ requestError }}
        </div>
      </div>

      <!-- Footer Info -->
      <div class="bg-white/10 backdrop-blur-md rounded-xl2 p-5 text-center shadow-soft">
        <p class="text-white text-sm my-2">🕐 Collection requests are processed during business hours</p>
        <p class="text-white text-sm my-2">📞 For urgent matters, contact: +971 XXX XXXX</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { getContainerIdFromUrl } from '@/utils/urlParams'
import { useContainerVerification } from '@/composables/useContainerVerification'
import { usePendingCheck } from '@/composables/usePendingCheck'
import { useCollectionRequest } from '@/composables/useCollectionRequest'

// State
const initializing = ref(true)
const initError = ref(null)
const containerId = ref(null)

// Composables
const { signature, householdId, signQrAction } = useContainerVerification()
const { hasPending, checkPending } = usePendingCheck()
const {
  loading,
  error: requestError,
  success: requestSuccess,
  createRequest
} = useCollectionRequest()

// Computed
const containerIdShort = computed(() => {
  if (!containerId.value) return ''
  // Show last 8 characters for display
  return '...' + containerId.value.slice(-8)
})

// Methods
const initialize = async () => {
  initializing.value = true
  initError.value = null

  try {
    // 1. Get container ID from URL
    const containerIdFromUrl = getContainerIdFromUrl()
    if (!containerIdFromUrl) {
      initError.value = 'No container ID found in URL. Please scan a valid QR code.'
      return
    }
    containerId.value = containerIdFromUrl

    // 2. Sign QR action (verify container exists and get household ID)
    await signQrAction(containerIdFromUrl)

    // 3. Check for pending requests
    await checkPending(containerIdFromUrl, householdId.value)

  } catch (err) {
    console.error('Initialization error:', err)
    if (!initError.value) {
      initError.value = 'Failed to load container information. Please try again.'
    }
  } finally {
    initializing.value = false
  }
}

const handleRequestCollection = async () => {
  if (!containerId.value || !signature.value) {
    requestError.value = 'Invalid session. Please scan the QR code again.'
    return
  }

  if (!householdId.value) {
    requestError.value = 'Container not assigned to a household. Please contact support.'
    return
  }

  try {
    await createRequest(containerId.value, householdId.value, signature.value)

    // Update pending status
    hasPending.value = true
  } catch (err) {
    console.error('Request creation failed:', err)
  }
}

// Lifecycle
onMounted(() => {
  initialize()
})
</script>

<style scoped>
@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.spinner,
.button-spinner {
  animation: spin 1s linear infinite;
}
</style>
