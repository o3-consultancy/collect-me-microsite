# Collect Me Microsite – Development Guide

**Document Version:** 1.0
**API Version:** Current (as of 2025-11-11)
**Prepared for:** Frontend Development Team
**Production API:** <https://homebase-api.neutralfuels.net>

---

## Executive Summary

This guide provides complete specifications for building the "Collect Me" microsite - a customer-facing application that allows households to request waste oil collection by scanning QR codes on their deployed containers.

### Key Features

- ✅ QR code-based container verification
- ✅ One-click collection request creation
- ✅ View pending collection status
- ✅ View scheduled collection dates
- ✅ Prevent duplicate requests
- ✅ No authentication required (public access)

---

## Table of Contents

1. [Overview](#overview)
2. [User Flow](#user-flow)
3. [Technical Architecture](#technical-architecture)
4. [API Endpoints Reference](#api-endpoints-reference)
5. [Implementation Guide](#implementation-guide)
6. [UI/UX Specifications](#uiux-specifications)
7. [Error Handling](#error-handling)
8. [Testing](#testing)
9. [Deployment](#deployment)

---

## Overview

### Purpose

The Collect Me microsite enables customers to request waste oil collection by scanning a QR code on their deployed container. The application provides a simple, mobile-friendly interface accessible directly from the QR code without requiring user authentication.

### URL Structure

Each container has a unique QR code that links to:

```
https://homebase-collect-me.neutralfuels.com/details?containerId=container_eb84bb6c34b14f8480ce1f76baa60ccb
```

**URL Parameters:**

- `containerId` (required) - Unique identifier for the container (e.g., `container_eb84bb6c34b14f8480ce1f76baa60ccb`)

### User Scenarios

#### Scenario 1: First-time Collection Request

1. Customer scans QR code on container
2. App loads with container details
3. Customer clicks "Request Collection"
4. Success message displayed
5. Button disabled (request pending)

#### Scenario 2: Pending Request Already Exists

1. Customer scans QR code
2. App shows "Collection request pending"
3. Button is disabled
4. Expected collection window displayed

#### Scenario 3: Scheduled Collection

1. Customer scans QR code
2. App shows "Collection scheduled for [date]"
3. Customer sees scheduled date/time
4. Button is disabled

---

## User Flow

```
┌─────────────────────────────────────────────────────────────┐
│ 1. Customer scans QR code on container                     │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. App extracts containerId from URL query parameter       │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. App calls GET /qr/sign?containerId={containerId}        │
│    → Receives signature (sig) and validates container      │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. App calls GET /collection-requests/check-pending        │
│    → Checks if request already exists for this container   │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
           ┌─────────┴──────────┐
           │                    │
     Pending exists?       No pending request
           │                    │
           ▼                    ▼
   ┌───────────────┐    ┌──────────────────┐
   │ Show pending  │    │ Enable "Request  │
   │ status        │    │ Collection" btn  │
   │ Disable btn   │    └────────┬─────────┘
   └───────────────┘             │
                                 ▼
                        ┌──────────────────┐
                        │ User clicks btn  │
                        └────────┬─────────┘
                                 │
                                 ▼
                   ┌──────────────────────────────┐
                   │ POST /collection-requests    │
                   │ with sig parameter           │
                   └────────┬─────────────────────┘
                            │
                            ▼
                   ┌──────────────────────────────┐
                   │ Show success message         │
                   │ Disable button               │
                   │ Update UI with pending info  │
                   └──────────────────────────────┘
```

---

## Technical Architecture

### Technology Stack (Recommended)

**Frontend Framework:**

- Vue.js 3 (Composition API) or React
- Mobile-first responsive design
- Progressive Web App (PWA) capabilities

**State Management:**

- Vue: Pinia or Composition API
- React: Context API or Zustand

**HTTP Client:**

- Axios for API calls

**UI Framework:**

- Tailwind CSS or Vuetify/Material-UI
- Mobile-optimized components

### Application Structure

```
src/
├── views/
│   └── CollectionRequest.vue        # Main collection request view
├── components/
│   ├── ContainerInfo.vue            # Display container details
│   ├── RequestButton.vue            # Request collection button
│   ├── PendingStatus.vue            # Show pending request status
│   └── ErrorMessage.vue             # Error display component
├── composables/
│   ├── useCollectionRequest.js      # Collection request logic
│   ├── useContainerVerification.js  # QR verification logic
│   └── usePendingCheck.js           # Pending request check
├── services/
│   └── api.js                       # API client configuration
└── utils/
    ├── urlParams.js                 # URL parameter extraction
    └── dateFormatter.js             # Date formatting utilities
```

---

## API Endpoints Reference

### Base URL

```
Production: https://homebase-api.neutralfuels.net/api
```

### Required Endpoints

#### 1. Sign QR Action (Public)

**Endpoint:** `GET /qr/sign`

**Purpose:** Generate a short-lived signature for container verification

**Authentication:** ❌ **Public endpoint** (no API key required)

**Query Parameters:**

- `containerId` (required) - Container ID from QR code URL

**Request Example:**

```javascript
GET https://homebase-api.neutralfuels.net/api/qr/sign?containerId=container_eb84bb6c34b14f8480ce1f76baa60ccb
```

**Response (200 OK):**

```json
{
  "containerId": "container_eb84bb6c34b14f8480ce1f76baa60ccb",
  "sig": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Error Responses:**

- `404 Not Found` - Container doesn't exist
- `400 Bad Request` - Invalid containerId format

**Usage:**

- Call immediately when page loads with containerId from URL
- Store signature for subsequent API calls
- Signature is time-limited (typically 5-10 minutes)

---

#### 2. Verify QR Signature (Public)

**Endpoint:** `GET /qr/verify`

**Purpose:** Verify that a signature is valid (optional, for additional validation)

**Authentication:** ❌ **Public endpoint**

**Query Parameters:**

- `containerId` (required)
- `sig` (required) - Signature from `/qr/sign`

**Request Example:**

```javascript
GET https://homebase-api.neutralfuels.net/api/qr/verify?containerId=container_eb84bb6c34b14f8480ce1f76baa60ccb&sig=eyJhbGc...
```

**Response (200 OK):**

```json
{
  "valid": true
}
```

**Usage:**

- Optional validation step
- Can be used to verify signature before making requests

---

#### 3. Check Pending Collection Request (Public)

**Endpoint:** `GET /collection-requests/check-pending`

**Purpose:** Check if a pending collection request already exists for this container

**Authentication:** ❌ **Public endpoint**

**Query Parameters:**

- `containerId` (required)
- `householdId` (optional) - If known, provide for more accurate check

**Request Example:**

```javascript
GET https://homebase-api.neutralfuels.net/api/collection-requests/check-pending?containerId=container_eb84bb6c34b14f8480ce1f76baa60ccb
```

**Response (200 OK):**

```json
{
  "pending": true
}
```

**Or if no pending request:**

```json
{
  "pending": false
}
```

**Usage:**

- Call after getting signature to check if request already exists
- Disable "Request Collection" button if `pending: true`
- Call periodically to update status (optional)

---

#### 4. Get Container Details (Optional Enhancement)

**Endpoint:** `GET /containers/{containerId}`

**Purpose:** Get container details to display to user

**Authentication:** ⚠️ **Requires API key** (may need backend proxy)

**Alternative Approach:**

- Backend can create a public endpoint that returns limited container info
- Or include basic info in `/qr/sign` response

---

#### 5. Create Collection Request (Public)

**Endpoint:** `POST /collection-requests`

**Purpose:** Create a new collection request

**Authentication:** ❌ **Public endpoint** (but requires valid signature)

**Query Parameters:**

- `sig` (required) - Signature from `/qr/sign` endpoint

**Request Body:**

```json
{
  "containerId": "container_eb84bb6c34b14f8480ce1f76baa60ccb",
  "householdId": "hh_123",
  "geoAtRequest": {
    "latitude": 25.2048,
    "longitude": 55.2708
  }
}
```

**Field Descriptions:**

- `containerId` - Container ID from QR code
- `householdId` - Associated household ID (can be retrieved from container lookup)
- `geoAtRequest` - User's current location (optional but recommended)

**Request Example:**

```javascript
POST https://homebase-api.neutralfuels.net/api/collection-requests?sig=eyJhbGc...

Body:
{
  "containerId": "container_eb84bb6c34b14f8480ce1f76baa60ccb",
  "householdId": "hh_123",
  "geoAtRequest": {
    "latitude": 25.2048,
    "longitude": 55.2708
  }
}
```

**Response (200 OK):**

```json
{
  "id": "req_abc123",
  "status": "requested"
}
```

**Error Responses:**

- `400 Bad Request` - Invalid data or missing required fields
- `401 Unauthorized` - Invalid or expired signature
- `409 Conflict` - Collection request already exists (pending)

**Usage:**

- Call when user clicks "Request Collection" button
- Include signature from `/qr/sign` as query parameter
- Get user's geolocation if permission granted
- Handle errors appropriately

---

#### 6. List Collection Requests (Optional)

**Endpoint:** `GET /collection-requests`

**Purpose:** Get list of collection requests for a container/household

**Authentication:** ⚠️ **Requires API key**

**Query Parameters:**

- `containerId` (optional)
- `householdId` (optional)
- `status` (optional) - Filter by status: `requested`, `completed`, `any`

**Alternative:** This endpoint may need a public version or backend proxy for customer access

---

## Implementation Guide

### Phase 1: Project Setup

#### 1.1 Create Vue/React Project

```bash
# Vue
npm create vue@latest collect-me-microsite
cd collect-me-microsite
npm install axios

# React
npx create-react-app collect-me-microsite
cd collect-me-microsite
npm install axios
```

#### 1.2 Configure API Client

**File:** `src/services/api.js`

```javascript
import axios from 'axios';

const API_BASE_URL = 'https://homebase-api.neutralfuels.net/api';

// Create axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Response interceptor for error handling
apiClient.interceptors.response.use(
  response => response,
  error => {
    const message = error.response?.data?.detail || 'An error occurred';
    console.error('API Error:', message);
    return Promise.reject(error);
  }
);

export default apiClient;
```

---

### Phase 2: Core Functionality

#### 2.1 Extract Container ID from URL

**File:** `src/utils/urlParams.js`

```javascript
/**
 * Extract containerId from URL query parameters
 * @returns {string|null} Container ID or null if not found
 */
export function getContainerIdFromUrl() {
  const urlParams = new URLSearchParams(window.location.search);
  const containerId = urlParams.get('containerId');

  if (!containerId) {
    console.error('No containerId found in URL');
    return null;
  }

  // Validate format (optional)
  if (!containerId.startsWith('container_')) {
    console.error('Invalid containerId format');
    return null;
  }

  return containerId;
}
```

**Usage:**

```javascript
import { getContainerIdFromUrl } from '@/utils/urlParams';

const containerId = getContainerIdFromUrl();
if (!containerId) {
  // Show error: Invalid QR code or missing container ID
}
```

---

#### 2.2 QR Verification Service

**File:** `src/composables/useContainerVerification.js` (Vue)

```javascript
import { ref } from 'vue';
import apiClient from '@/services/api';

export function useContainerVerification() {
  const signature = ref(null);
  const containerId = ref(null);
  const loading = ref(false);
  const error = ref(null);

  /**
   * Sign QR action and get signature
   * @param {string} containerIdParam - Container ID from URL
   * @returns {Promise<string>} Signature
   */
  const signQrAction = async (containerIdParam) => {
    loading.value = true;
    error.value = null;

    try {
      const response = await apiClient.get('/qr/sign', {
        params: { containerId: containerIdParam }
      });

      containerId.value = response.data.containerId;
      signature.value = response.data.sig;

      return signature.value;
    } catch (err) {
      if (err.response?.status === 404) {
        error.value = 'Container not found. Please check the QR code.';
      } else {
        error.value = 'Failed to verify container. Please try again.';
      }
      throw err;
    } finally {
      loading.value = false;
    }
  };

  /**
   * Verify signature (optional validation)
   * @returns {Promise<boolean>}
   */
  const verifySignature = async () => {
    if (!signature.value || !containerId.value) {
      throw new Error('No signature to verify');
    }

    try {
      const response = await apiClient.get('/qr/verify', {
        params: {
          containerId: containerId.value,
          sig: signature.value
        }
      });

      return response.data.valid;
    } catch (err) {
      console.error('Signature verification failed:', err);
      return false;
    }
  };

  return {
    signature,
    containerId,
    loading,
    error,
    signQrAction,
    verifySignature
  };
}
```

**React Version:** `src/hooks/useContainerVerification.js`

```javascript
import { useState } from 'react';
import apiClient from '../services/api';

export function useContainerVerification() {
  const [signature, setSignature] = useState(null);
  const [containerId, setContainerId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const signQrAction = async (containerIdParam) => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.get('/qr/sign', {
        params: { containerId: containerIdParam }
      });

      setContainerId(response.data.containerId);
      setSignature(response.data.sig);

      return response.data.sig;
    } catch (err) {
      if (err.response?.status === 404) {
        setError('Container not found. Please check the QR code.');
      } else {
        setError('Failed to verify container. Please try again.');
      }
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    signature,
    containerId,
    loading,
    error,
    signQrAction
  };
}
```

---

#### 2.3 Check Pending Collection Requests

**File:** `src/composables/usePendingCheck.js` (Vue)

```javascript
import { ref } from 'vue';
import apiClient from '@/services/api';

export function usePendingCheck() {
  const hasPending = ref(false);
  const loading = ref(false);
  const error = ref(null);

  /**
   * Check if a pending collection request exists
   * @param {string} containerId - Container ID
   * @param {string} householdId - Household ID (optional)
   * @returns {Promise<boolean>}
   */
  const checkPending = async (containerId, householdId = null) => {
    loading.value = true;
    error.value = null;

    try {
      const params = { containerId };
      if (householdId) {
        params.householdId = householdId;
      }

      const response = await apiClient.get('/collection-requests/check-pending', {
        params
      });

      hasPending.value = response.data.pending;
      return response.data.pending;
    } catch (err) {
      error.value = 'Failed to check pending requests';
      console.error('Check pending error:', err);
      return false;
    } finally {
      loading.value = false;
    }
  };

  return {
    hasPending,
    loading,
    error,
    checkPending
  };
}
```

---

#### 2.4 Create Collection Request

**File:** `src/composables/useCollectionRequest.js` (Vue)

```javascript
import { ref } from 'vue';
import apiClient from '@/services/api';

export function useCollectionRequest() {
  const requestId = ref(null);
  const loading = ref(false);
  const error = ref(null);
  const success = ref(false);

  /**
   * Get user's current geolocation
   * @returns {Promise<object|null>}
   */
  const getUserLocation = async () => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        console.warn('Geolocation not supported');
        resolve(null);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
        },
        (error) => {
          console.warn('Geolocation error:', error);
          resolve(null);
        },
        {
          timeout: 5000,
          maximumAge: 60000
        }
      );
    });
  };

  /**
   * Create a collection request
   * @param {string} containerId - Container ID
   * @param {string} householdId - Household ID
   * @param {string} signature - Signature from QR sign
   * @returns {Promise<string>} Request ID
   */
  const createRequest = async (containerId, householdId, signature) => {
    loading.value = true;
    error.value = null;
    success.value = false;

    try {
      // Get user location (optional)
      const geoAtRequest = await getUserLocation();

      const requestBody = {
        containerId,
        householdId,
        geoAtRequest: geoAtRequest || {
          latitude: 0,
          longitude: 0
        }
      };

      const response = await apiClient.post('/collection-requests', requestBody, {
        params: { sig: signature }
      });

      requestId.value = response.data.id;
      success.value = true;

      return response.data.id;
    } catch (err) {
      if (err.response?.status === 409) {
        error.value = 'A collection request for this container is already pending.';
      } else if (err.response?.status === 401) {
        error.value = 'Session expired. Please scan the QR code again.';
      } else {
        error.value = 'Failed to create collection request. Please try again.';
      }
      throw err;
    } finally {
      loading.value = false;
    }
  };

  return {
    requestId,
    loading,
    error,
    success,
    createRequest
  };
}
```

---

### Phase 3: Main Collection Request View

**File:** `src/views/CollectionRequest.vue` (Vue)

```vue
<template>
  <div class="collection-request-container">
    <!-- Loading State -->
    <div v-if="initializing" class="loading-state">
      <div class="spinner"></div>
      <p>Verifying container...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="initError" class="error-state">
      <div class="error-icon">⚠️</div>
      <h2>Invalid QR Code</h2>
      <p>{{ initError }}</p>
      <p class="help-text">Please scan a valid container QR code or contact support.</p>
    </div>

    <!-- Main Content -->
    <div v-else class="main-content">
      <!-- Header -->
      <div class="header">
        <img src="@/assets/logo.png" alt="Neutral Fuels" class="logo" />
        <h1>Request Collection</h1>
      </div>

      <!-- Container Info -->
      <div class="container-info">
        <div class="info-icon">🛢️</div>
        <p class="container-label">Container ID</p>
        <p class="container-id">{{ containerIdShort }}</p>
      </div>

      <!-- Pending Request Notice -->
      <div v-if="hasPending" class="pending-notice">
        <div class="notice-icon">⏳</div>
        <h3>Collection Request Pending</h3>
        <p>Your collection request has been received. Our team will assign a collection window soon.</p>
        <p class="info-text">You will be contacted when collection is scheduled.</p>
      </div>

      <!-- Success Message -->
      <div v-else-if="requestSuccess" class="success-message">
        <div class="success-icon">✅</div>
        <h3>Request Submitted!</h3>
        <p>Your collection request has been successfully created.</p>
        <p class="info-text">Our team will contact you with a collection schedule.</p>
      </div>

      <!-- Request Button -->
      <div v-else class="request-section">
        <p class="description">
          Click the button below to request a collection. Our team will contact you to schedule a collection time.
        </p>

        <button
          @click="handleRequestCollection"
          :disabled="loading || hasPending"
          class="request-button"
          :class="{ 'loading': loading }"
        >
          <span v-if="loading">
            <div class="button-spinner"></div>
            Submitting...
          </span>
          <span v-else>Request Collection</span>
        </button>

        <!-- Error Message -->
        <div v-if="requestError" class="error-message">
          {{ requestError }}
        </div>
      </div>

      <!-- Footer Info -->
      <div class="footer-info">
        <p>🕐 Collection requests are processed during business hours</p>
        <p>📞 For urgent matters, contact: +971 XXX XXXX</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { getContainerIdFromUrl } from '@/utils/urlParams';
import { useContainerVerification } from '@/composables/useContainerVerification';
import { usePendingCheck } from '@/composables/usePendingCheck';
import { useCollectionRequest } from '@/composables/useCollectionRequest';

// State
const initializing = ref(true);
const initError = ref(null);
const containerId = ref(null);
const householdId = ref(null); // TODO: Get from container lookup

// Composables
const { signature, signQrAction } = useContainerVerification();
const { hasPending, checkPending } = usePendingCheck();
const {
  loading,
  error: requestError,
  success: requestSuccess,
  createRequest
} = useCollectionRequest();

// Computed
const containerIdShort = computed(() => {
  if (!containerId.value) return '';
  // Show last 8 characters for display
  return '...' + containerId.value.slice(-8);
});

// Methods
const initialize = async () => {
  initializing.value = true;
  initError.value = null;

  try {
    // 1. Get container ID from URL
    const containerIdFromUrl = getContainerIdFromUrl();
    if (!containerIdFromUrl) {
      initError.value = 'No container ID found in URL. Please scan a valid QR code.';
      return;
    }
    containerId.value = containerIdFromUrl;

    // 2. Sign QR action (verify container exists)
    await signQrAction(containerIdFromUrl);

    // 3. Check for pending requests
    await checkPending(containerIdFromUrl);

    // TODO: Get household ID from container lookup
    // For now, we'll need to add an endpoint or include it in /qr/sign response

  } catch (err) {
    console.error('Initialization error:', err);
    if (!initError.value) {
      initError.value = 'Failed to load container information. Please try again.';
    }
  } finally {
    initializing.value = false;
  }
};

const handleRequestCollection = async () => {
  if (!containerId.value || !signature.value) {
    requestError.value = 'Invalid session. Please scan the QR code again.';
    return;
  }

  try {
    // TODO: Get householdId from container lookup
    // For now, using containerId as placeholder
    await createRequest(containerId.value, householdId.value || 'hh_unknown', signature.value);

    // Update pending status
    hasPending.value = true;
  } catch (err) {
    console.error('Request creation failed:', err);
  }
};

// Lifecycle
onMounted(() => {
  initialize();
});
</script>

<style scoped>
.collection-request-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}

/* Loading State */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 80vh;
  color: white;
}

.spinner {
  border: 4px solid rgba(255, 255, 255, 0.3);
  border-top: 4px solid white;
  border-radius: 50%;
  width: 50px;
  height: 50px;
  animation: spin 1s linear infinite;
  margin-bottom: 20px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Error State */
.error-state {
  background: white;
  border-radius: 20px;
  padding: 40px 30px;
  text-align: center;
  max-width: 500px;
  margin: 50px auto;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.error-icon {
  font-size: 64px;
  margin-bottom: 20px;
}

.error-state h2 {
  color: #e53e3e;
  margin-bottom: 10px;
}

.help-text {
  color: #718096;
  font-size: 14px;
  margin-top: 20px;
}

/* Main Content */
.main-content {
  max-width: 500px;
  margin: 0 auto;
}

.header {
  text-align: center;
  color: white;
  margin-bottom: 30px;
}

.logo {
  width: 120px;
  margin-bottom: 20px;
}

.header h1 {
  font-size: 28px;
  font-weight: 700;
  margin: 0;
}

/* Container Info */
.container-info {
  background: white;
  border-radius: 15px;
  padding: 25px;
  text-align: center;
  margin-bottom: 20px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
}

.info-icon {
  font-size: 48px;
  margin-bottom: 10px;
}

.container-label {
  color: #718096;
  font-size: 14px;
  margin: 0 0 5px 0;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.container-id {
  color: #2d3748;
  font-size: 18px;
  font-weight: 600;
  margin: 0;
  font-family: 'Courier New', monospace;
}

/* Pending Notice */
.pending-notice {
  background: #fef3c7;
  border: 2px solid #f59e0b;
  border-radius: 15px;
  padding: 25px;
  text-align: center;
  margin-bottom: 20px;
}

.notice-icon {
  font-size: 48px;
  margin-bottom: 15px;
}

.pending-notice h3 {
  color: #92400e;
  margin: 0 0 10px 0;
}

.pending-notice p {
  color: #78350f;
  margin: 5px 0;
}

.info-text {
  font-size: 14px;
  color: #a16207;
  margin-top: 15px !important;
}

/* Success Message */
.success-message {
  background: #d1fae5;
  border: 2px solid #10b981;
  border-radius: 15px;
  padding: 25px;
  text-align: center;
  margin-bottom: 20px;
}

.success-icon {
  font-size: 48px;
  margin-bottom: 15px;
}

.success-message h3 {
  color: #065f46;
  margin: 0 0 10px 0;
}

.success-message p {
  color: #047857;
  margin: 5px 0;
}

/* Request Section */
.request-section {
  background: white;
  border-radius: 15px;
  padding: 30px;
  margin-bottom: 20px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
}

.description {
  color: #4a5568;
  line-height: 1.6;
  margin-bottom: 25px;
  text-align: center;
}

.request-button {
  width: 100%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 12px;
  padding: 18px;
  font-size: 18px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
}

.request-button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.6);
}

.request-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.request-button.loading {
  position: relative;
}

.button-spinner {
  display: inline-block;
  border: 3px solid rgba(255, 255, 255, 0.3);
  border-top: 3px solid white;
  border-radius: 50%;
  width: 20px;
  height: 20px;
  animation: spin 1s linear infinite;
  margin-right: 10px;
  vertical-align: middle;
}

.error-message {
  background: #fee;
  border: 1px solid #fcc;
  border-radius: 8px;
  padding: 12px;
  margin-top: 15px;
  color: #c53030;
  font-size: 14px;
  text-align: center;
}

/* Footer Info */
.footer-info {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 20px;
  text-align: center;
  backdrop-filter: blur(10px);
}

.footer-info p {
  color: white;
  margin: 8px 0;
  font-size: 14px;
}

/* Mobile Responsive */
@media (max-width: 600px) {
  .collection-request-container {
    padding: 15px;
  }

  .header h1 {
    font-size: 24px;
  }

  .request-button {
    font-size: 16px;
    padding: 16px;
  }
}
</style>
```

---

## UI/UX Specifications

### Design Requirements

#### 1. Mobile-First Design

- Primary target: Mobile phones (QR scanning)
- Responsive for tablets and desktop
- Touch-friendly button sizes (min 44x44px)
- Large, readable text

#### 2. Color Scheme

- **Primary:** Neutral Fuels brand colors
- **Success:** Green (#10b981)
- **Warning:** Amber (#f59e0b)
- **Error:** Red (#e53e3e)
- **Background:** Gradient or brand colors

#### 3. Loading States

- Show spinner when:
  - Initial page load (verifying container)
  - Checking pending requests
  - Submitting collection request
- Disable buttons during loading
- Clear loading messages

#### 4. Error States

- **Invalid QR Code:**
  - Clear error icon
  - Friendly message
  - Suggestion to rescan or contact support

- **Network Errors:**
  - "Connection failed" message
  - Retry button

- **Duplicate Request:**
  - Explain that request already exists
  - Show pending status

#### 5. Success States

- **Request Created:**
  - Checkmark icon
  - "Success!" message
  - Next steps information
  - Disable request button

#### 6. Button States

```css
/* Normal State */
.request-button {
  background: gradient;
  cursor: pointer;
}

/* Hover State */
.request-button:hover {
  transform: translateY(-2px);
  box-shadow: enhanced;
}

/* Disabled State (Pending) */
.request-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  background: gray;
}

/* Loading State */
.request-button.loading {
  position: relative;
  /* Show spinner */
}
```

---

## Error Handling

### Error Scenarios and Handling

#### 1. Invalid or Missing Container ID

**Scenario:** URL doesn't contain `containerId` parameter

**Handling:**

```javascript
if (!containerId) {
  showError('Invalid QR code. Please scan a valid container QR code.');
  // Show contact support information
}
```

**UI:**

- Display error icon
- Message: "Invalid QR Code"
- Subtext: "Please scan a valid container QR code or contact support"

---

#### 2. Container Not Found (404)

**Scenario:** Container ID doesn't exist in database

**API Response:** `404 Not Found`

**Handling:**

```javascript
if (error.response?.status === 404) {
  showError('Container not found. This QR code may be invalid or the container is not registered.');
}
```

**UI:**

- Error state
- Message: "Container Not Found"
- Action: Contact support with container ID

---

#### 3. Expired Signature (401)

**Scenario:** User takes too long to submit request, signature expires

**API Response:** `401 Unauthorized`

**Handling:**

```javascript
if (error.response?.status === 401) {
  showError('Session expired. Please scan the QR code again.');
  // Optionally: Auto-refresh signature
}
```

**UI:**

- Message: "Session Expired"
- Action: "Scan QR code again" or auto-reload

---

#### 4. Duplicate Request (409)

**Scenario:** Collection request already exists for this container

**API Response:** `409 Conflict`

**Handling:**

```javascript
if (error.response?.status === 409) {
  showInfo('A collection request is already pending for this container.');
  hasPending.value = true;
}
```

**UI:**

- Show pending status
- Disable request button
- Display expected collection window

---

#### 5. Network Error

**Scenario:** No internet connection or server unreachable

**Handling:**

```javascript
if (!error.response) {
  showError('Connection failed. Please check your internet connection and try again.');
  // Show retry button
}
```

**UI:**

- Offline icon
- Friendly message
- Retry button

---

#### 6. Geolocation Permission Denied

**Scenario:** User denies location permission

**Handling:**

```javascript
// Geolocation is optional, proceed without it
navigator.geolocation.getCurrentPosition(
  (position) => { /* use location */ },
  (error) => {
    console.warn('Geolocation denied, proceeding without location');
    // Continue with request creation
  }
);
```

**UI:**

- No error shown to user
- Request proceeds without location

---

## Testing

### Test Scenarios

#### 1. Happy Path

**Test:** User scans QR code and creates collection request successfully

**Steps:**

1. Navigate to URL with valid containerId
2. Verify container loading state shows
3. Verify container info displays
4. Verify "Request Collection" button is enabled
5. Click "Request Collection"
6. Verify loading state during submission
7. Verify success message appears
8. Verify button is disabled after success

**Expected Result:** ✅ Request created, button disabled, success message shown

---

#### 2. Pending Request Exists

**Test:** User scans QR code for container with existing pending request

**Steps:**

1. Navigate to URL with containerId that has pending request
2. Wait for page to load
3. Verify pending notice is displayed
4. Verify "Request Collection" button is disabled

**Expected Result:** ✅ Pending notice shown, button disabled

---

#### 3. Invalid Container ID

**Test:** User navigates to URL with non-existent containerId

**Steps:**

1. Navigate to URL with invalid/non-existent containerId
2. Wait for API call

**Expected Result:** ❌ Error state shown with 404 message

---

#### 4. Missing Container ID Parameter

**Test:** User navigates to URL without containerId parameter

**Steps:**

1. Navigate to base URL without query parameters
2. Verify error state

**Expected Result:** ❌ Error message: "No container ID found"

---

#### 5. Network Offline

**Test:** User attempts to load page while offline

**Steps:**

1. Disable network connection
2. Navigate to URL with valid containerId
3. Verify error handling

**Expected Result:** ❌ Network error message, retry option

---

#### 6. Signature Expiry

**Test:** User waits too long before submitting request

**Steps:**

1. Load page successfully
2. Wait for signature to expire (5-10 minutes)
3. Click "Request Collection"

**Expected Result:** ❌ 401 error, message to rescan QR code

---

### Manual Testing Checklist

- [ ] QR code scanning works on mobile devices
- [ ] Page loads correctly on iOS Safari
- [ ] Page loads correctly on Android Chrome
- [ ] Responsive design works on all screen sizes
- [ ] Loading spinners display correctly
- [ ] Error messages are clear and helpful
- [ ] Success state displays properly
- [ ] Buttons have proper disabled states
- [ ] Geolocation permission prompt appears (if implemented)
- [ ] Network errors are handled gracefully
- [ ] Back button behavior is correct
- [ ] Page reload preserves state (or shows error appropriately)

---

## Deployment

### Environment Configuration

**File:** `.env.production`

```bash
VITE_API_BASE_URL=https://homebase-api.neutralfuels.net/api
VITE_APP_TITLE=Collect Me - Neutral Fuels
```

### Build Configuration

**Vue (Vite):**

```javascript
// vite.config.js
export default {
  base: '/',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    // Optimize for mobile
    target: 'es2015',
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true
      }
    }
  }
}
```

### Build Commands

```bash
# Development
npm run dev

# Production build
npm run build

# Preview production build
npm run preview
```

### Hosting Requirements

**Recommended Hosting:**

- Firebase Hosting
- Netlify
- Vercel
- AWS S3 + CloudFront

**Requirements:**

- HTTPS (required for geolocation API)
- Custom domain: `homebase-collect-me.neutralfuels.com`
- Fast CDN for mobile users
- Support for SPA routing

### Firebase Hosting Example

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login
firebase login

# Initialize
firebase init hosting

# Deploy
npm run build
firebase deploy --only hosting
```

**firebase.json:**

```json
{
  "hosting": {
    "public": "dist",
    "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ],
    "headers": [
      {
        "source": "**/*.@(jpg|jpeg|gif|png|svg|webp)",
        "headers": [
          {
            "key": "Cache-Control",
            "value": "max-age=31536000"
          }
        ]
      }
    ]
  }
}
```

---

## Additional Features (Optional)

### 1. Request History

Allow users to see their previous collection requests:

```javascript
// Add to composables
const fetchRequestHistory = async (containerId) => {
  const response = await apiClient.get('/collection-requests', {
    params: {
      containerId,
      limit: 5
    }
  });
  return response.data;
};
```

### 2. Scheduled Collection Display

Show when collection is scheduled:

```javascript
// Check if request has scheduledDate
if (request.scheduledDate) {
  showScheduledDate(request.scheduledDate);
}
```

**UI:**

```vue
<div v-if="scheduledDate" class="scheduled-info">
  <h3>Collection Scheduled</h3>
  <p class="date">{{ formatDate(scheduledDate) }}</p>
  <p>Our team will arrive during the scheduled window.</p>
</div>
```

### 3. Push Notifications (PWA)

Enable push notifications for collection updates:

```javascript
// Request notification permission
const requestNotificationPermission = async () => {
  if ('Notification' in window) {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }
  return false;
};
```

### 4. Offline Support (PWA)

Cache API responses for offline viewing:

```javascript
// service-worker.js
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
```

---

## API Enhancement Recommendations

### 1. Include Household ID in QR Sign Response

**Current:** `/qr/sign` returns only `containerId` and `sig`

**Recommended:** Include household ID to avoid additional lookups

```json
{
  "containerId": "container_123",
  "householdId": "hh_456",
  "sig": "eyJhbGc..."
}
```

### 2. Include Pending Request Details

**Enhancement:** `/collection-requests/check-pending` could return request details

```json
{
  "pending": true,
  "requestId": "req_789",
  "requestedAt": "2024-01-15T10:30:00Z",
  "status": "requested",
  "scheduledDate": "2024-01-20"  // if scheduled
}
```

### 3. Public Container Details Endpoint

**New Endpoint:** `GET /containers/{containerId}/public`

**Purpose:** Get limited container info without API key

**Response:**

```json
{
  "containerId": "container_123",
  "serial": "C-0001",
  "type": "wheelieBin",
  "capacityL": 240,
  "householdId": "hh_456",
  "isAssigned": true
}
```

---

## Summary

### What Frontend Team Needs to Build

1. ✅ **Single-page application** (Vue/React)
2. ✅ **QR code parameter extraction** from URL
3. ✅ **Container verification** using `/qr/sign`
4. ✅ **Pending request check** using `/collection-requests/check-pending`
5. ✅ **Collection request creation** using `POST /collection-requests`
6. ✅ **Mobile-optimized UI** with loading/error/success states
7. ✅ **Geolocation capture** (optional)

### API Endpoints Used

| Endpoint | Method | Purpose | Auth |
|----------|--------|---------|------|
| `/qr/sign` | GET | Verify container & get signature | Public |
| `/qr/verify` | GET | Verify signature (optional) | Public |
| `/collection-requests/check-pending` | GET | Check if request pending | Public |
| `/collection-requests` | POST | Create collection request | Public (with sig) |

### Timeline Estimate

- **Week 1:** Project setup, API client, URL parameter handling
- **Week 2:** QR verification, pending check, request creation logic
- **Week 3:** UI/UX implementation, error handling
- **Week 4:** Testing, bug fixes, polish
- **Week 5:** Deployment, production testing

### Success Criteria

- ✅ Users can scan QR code and request collection in under 30 seconds
- ✅ Clear feedback for all states (loading, success, error, pending)
- ✅ Works on iOS and Android mobile browsers
- ✅ Handles network errors gracefully
- ✅ Prevents duplicate requests
- ✅ Accessible and user-friendly interface

---

**Document prepared by:** Backend Team
**Date:** 2025-11-11
**Status:** Ready for Frontend Development
**Questions:** Contact backend team for clarifications
