# Collect Me Microsite

A customer-facing application that allows households to request waste oil collection by scanning QR codes on their deployed containers.

## Features

- ✅ QR code-based container verification
- ✅ One-click collection request creation
- ✅ View pending collection status
- ✅ View scheduled collection dates
- ✅ Prevent duplicate requests
- ✅ No authentication required (public access)
- ✅ Mobile-first responsive design with Tailwind CSS

## Tech Stack

- **Framework:** Vue 3 (Composition API)
- **Build Tool:** Vite
- **Styling:** Tailwind CSS
- **HTTP Client:** Axios
- **Router:** Vue Router

## Project Structure

```
src/
├── views/
│   └── CollectionRequest.vue        # Main collection request view
├── composables/
│   ├── useCollectionRequest.js      # Collection request logic
│   ├── useContainerVerification.js  # QR verification logic
│   └── usePendingCheck.js           # Pending request check
├── services/
│   └── api.js                       # API client configuration
├── utils/
│   └── urlParams.js                 # URL parameter extraction
├── router/
│   └── index.js                     # Vue Router configuration
└── assets/
    └── main.css                     # Tailwind CSS imports
```

## Getting Started

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

The application will be available at `http://localhost:5173`

### Build for Production

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

## Usage

The application is accessed via QR codes on containers. Each QR code links to:

```
http://localhost:5173/details?containerId=container_eb84bb6c34b14f8480ce1f76baa60ccb
```

### URL Parameters

- `containerId` (required) - Unique identifier for the container

## Environment Variables

Create `.env.development` and `.env.production` files:

```bash
VITE_API_BASE_URL=https://homebase-api.neutralfuels.net/api
VITE_APP_TITLE=Collect Me - Neutral Fuels
```

## API Endpoints

### Production API
`https://homebase-api.neutralfuels.net/api`

### Endpoints Used

| Endpoint | Method | Purpose | Auth |
|----------|--------|---------|------|
| `/qr/sign` | GET | Verify container & get signature | Public |
| `/qr/verify` | GET | Verify signature (optional) | Public |
| `/collection-requests/check-pending` | GET | Check if request pending | Public |
| `/collection-requests` | POST | Create collection request | Public (with sig) |

## User Flow

1. Customer scans QR code on container
2. App extracts containerId from URL
3. App verifies container using `/qr/sign`
4. App checks for pending requests
5. Customer clicks "Request Collection"
6. App creates collection request with geolocation
7. Success message displayed

## Development Notes

- Mobile-first responsive design
- Geolocation capture for collection requests
- Automatic signature management
- Error handling for all API calls
- Loading states for better UX

## Deployment

The application can be deployed to:
- Firebase Hosting
- Netlify
- Vercel
- AWS S3 + CloudFront

### Requirements
- HTTPS (required for geolocation API)
- Custom domain: `homebase-collect-me.neutralfuels.com`
- Support for SPA routing

## Testing

For testing, use a URL with a valid containerId:

```
http://localhost:5173/details?containerId=container_eb84bb6c34b14f8480ce1f76baa60ccb
```

## Support

For questions or issues, please refer to the `COLLECT_ME_MICROSITE_GUIDE.md` document.
