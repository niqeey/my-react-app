# MyPaceTracker Frontend (React SPA)

## 📋 Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Features](#features)
4. [Components](#components)
5. [Routing](#routing)
6. [State Management](#state-management)
7. [Authentication](#authentication)
8. [API Integration](#api-integration)
9. [Styling](#styling)
10. [Setup & Development](#setup--development)
11. [Build & Deployment](#build--deployment)
12. [Testing](#testing)
13. [Configuration](#configuration)

---

## 🎯 Overview

The MyPaceTracker frontend is a **React Single Page Application (SPA)** built with React 19.1.0. It provides a comprehensive user interface for race administrators to manage events, participants, and results, as well as public-facing leaderboards for race participants and spectators.

### Key Characteristics
- **Type**: Micro Frontend (MFE)
- **Framework**: React 19.1.0
- **Build Tool**: Create React App
- **Production Server**: Express.js with HTTPS support
- **Ports**: 
  - Development: 3000
  - Production: 7755

---

## 🏗️ Architecture

### Application Structure

```
src/
├── components/          # React components
│   ├── App.jsx         # Main app component with routing
│   ├── Login.jsx       # Authentication
│   ├── Dashboard.jsx   # Landing page after login
│   ├── EventListing.jsx            # Event management
│   ├── EventSetup.jsx              # Create/edit events
│   ├── EventPage.jsx               # Event details & results (MAIN)
│   ├── RaceSetup.jsx               # Configure categories
│   ├── PublicLeaderboard.jsx       # Public results (NET/OFFICIAL)
│   ├── LapLeaderboard.jsx          # Public results (LAP mode)
│   ├── StatisticPage.jsx           # Analytics
│   ├── TopEventPage.jsx            # Top performers
│   ├── FullResultingPage.jsx       # Complete results view
│   ├── ResultPage.jsx              # Result entry
│   ├── RunnerSetup.jsx             # Participant management
│   ├── Registered.jsx              # Status pages
│   ├── Started.jsx
│   ├── Finished.jsx
│   ├── DidNotStart.jsx
│   ├── DidNotFinish.jsx
│   ├── FalseStart.jsx
│   ├── NoStartButFinished.jsx
│   ├── Disqualified.jsx
│   ├── ProtectedRoute.jsx          # Route guard
│   ├── OrgContext.jsx              # Global state
│   └── PageWrapper.jsx             # Layout wrapper
├── utils/
│   └── authFetch.js                # Authenticated API calls
├── styles/
│   └── App.css                     # Global styles
├── apiBase.js                      # API configuration
└── index.js                        # Entry point
```

### Component Hierarchy

```
App (Router Provider)
├── NavBar (Dynamic based on auth)
├── Routes
│   ├── Home (/)
│   ├── Login (/login)
│   ├── Public Routes
│   │   ├── PublicLeaderboard (/public/leaderboard/:eventId)
│   │   └── LapLeaderboard (/public/lap-leaderboard/:eventId)
│   └── Protected Routes (ProtectedRoute wrapper)
│       ├── Dashboard (/dashboard)
│       ├── EventListing (/eventlisting)
│       ├── EventSetup (/eventsetup) - Admin only
│       ├── RaceSetup (/racesetup/:eventId)
│       ├── EventPage (/event/:eventId)
│       ├── TopEventPage (/topevent/:eventId/:category)
│       ├── StatisticPage (/statistic/:eventId)
│       └── Status Pages (/[status]/:eventId)
└── Footer (Fixed)
```

---

## ✨ Features

### 1. Authentication & Authorization
- **Session-based authentication**
- **2-hour session timeout**
- **Automatic session validation**
- **Auto-logout on expiry**
- **Role-based access** (admin/user)
- **Protected routes** for authenticated pages
- **Multi-tab logout support**

### 2. Dynamic Navigation
The navigation menu adapts based on:
- **Authentication state** (logged in/out)
- **User role** (admin/user)
- **Current route**

**Menu Structure**:
```
Not Authenticated:
  Home | Login

Authenticated (User):
  Dashboard | Event Listing | Logout

Authenticated (Admin):
  Dashboard | Event Listing | Event Setup | Logout
```

### 3. Event Management
- **Create events**: Name, date, location, country
- **List events**: Tabbed view (Upcoming/Archived)
- **Filter events**: By name, location, country, year
- **Archive/Unarchive** events
- **Delete events** (with confirmation)
- **CSV upload** for bulk participant registration

### 4. Race Configuration
- **Category setup**: Code, name, distance, gender
- **Race mode selection**: NET, OFFICIAL, LAP
- **LAP mode settings**:
  - Half-lap distance
  - Full-lap distance
  - Number of laps
  - Auto-calculated total distance
- **Gun time configuration**: Multiple gun times per category
- **Checkpoint definition**: CP list (CP1, CP2, CP3, etc.)

### 5. Result Management (EventPage)
The **EventPage** is the core result management interface:

**View Modes**:
- **Category View**: Results by race category (default)
- **Overall View**: All participants by distance and overall rank
- **Gender View**: Separate male/female rankings

**Display Features**:
- **Sticky rank column**: Always visible while scrolling
- **Sortable columns**: Click headers to sort
- **Medal indicators**: 🥇🥈🥉 for top 3
- **Golden text**: Top 3 ranks in gold color
- **Time formatting**: Multiple formats (Net, Official, Gun)
- **Checkpoint times**: Dynamic columns based on CP list
- **LAP mode support**: Shows lap count and best lap time

**Interactive Features**:
- **Bib search**: Quick find by bib number
- **Participant details modal**: 
  - View full participant information
  - Edit mode toggle
  - Update status (Finished, DNF, DQ, etc.)
  - Manual time entry
  - Save changes to database
- **Real-time updates**: Auto-refresh after edits
- **Print support**: Print-friendly layout

**Data Display** (varies by race mode):

*NET/OFFICIAL Mode*:
| Column | Description |
|--------|-------------|
| Rank Cat | Category rank |
| Rank Mix | Gender rank |
| Rank Tot | Overall rank |
| Bib | Bib number |
| Name | Participant name |
| Cat | Category code |
| Gender | M/F |
| Net Time | Chip time (finish - start) |
| Official Time | Gun time (finish - gun) |
| CPn | Checkpoint times |

*LAP Mode*:
| Column | Description |
|--------|-------------|
| Rank | Lap-based rank |
| Bib | Bib number |
| Name | Participant name |
| Laps | Laps completed |
| Best Lap | Best lap time |
| Total Time | Cumulative time |

### 6. Public Leaderboards

#### Standard Leaderboard (`/public/leaderboard/:eventId`)
- **No authentication required**
- **Category tabs**: Horizontal scrollable buttons
- **Auto-refresh**: Disabled (to be implemented)
- **Mobile responsive**: Adapts to screen size
- **Medal display**: 🥇🥈🥉 for top 3
- **Clean time format**: HH:MM:SS (no milliseconds)
- **Sticky rank**: First column stays visible

#### LAP Leaderboard (`/public/lap-leaderboard/:eventId`)
- **LAP categories only**: Filters out NET/OFFICIAL
- **Lap count prominent**: Shows total laps
- **Best lap time**: Highlights best lap
- **Category tabs**: Same as standard
- **Different layout**: Optimized for lap data

### 7. Statistics & Reports
- **Event statistics**: Participant counts, completion rates
- **Top performers**: Prize winners by category
- **Excel export**: Full results with all columns
- **Print support**: Browser-based printing

### 8. Participant Status Management
Dedicated pages for each status:
- **Registered** - Not yet started
- **Started** - Gun time crossed, no finish
- **Finished** - Successfully completed
- **Did Not Start (DNS)** - Registered but didn't start
- **Did Not Finish (DNF)** - Started but didn't finish
- **False Start** - Invalid start time
- **No Start But Finished** - Finish without start
- **Disqualified (DQ)** - Rule violations

Each page provides:
- Filterable participant list
- Key details (Bib, Name, Category, Gender)
- Status timestamps
- Quick actions

---

## 🧩 Components

### Core Components

#### App.jsx
**Purpose**: Main application component  
**Responsibilities**:
- Route configuration
- Navigation bar rendering
- Footer rendering
- Global context provider (OrgProvider)

**Key Features**:
- Dynamic NavBar based on authentication
- Flicker animation on home page
- Route protection via ProtectedRoute
- Session state management

#### Login.jsx
**Purpose**: User authentication  
**State**:
- `username`, `password`
- `error`, `loading`

**Process**:
1. Submit credentials to `/login` endpoint
2. Receive session ID and metadata
3. Store in sessionStorage:
   - `sessionId`
   - `sessionExpiryTime` (2 hours)
   - `username`
   - `orgId`
   - `role` (admin/user)
4. Redirect to `/dashboard`

**Error Handling**:
- Invalid credentials alert
- Network errors alert
- Loading state during submission

#### ProtectedRoute.jsx
**Purpose**: Guard authenticated routes  
**Logic**:
1. Check sessionStorage for:
   - `sessionId`
   - `sessionExpiryTime`
   - `username`
   - `orgId`
2. Validate session expiry (client-side)
3. If valid → Render children
4. If invalid → Redirect to `/login`

**Features**:
- Loading state while checking
- Preserves attempted URL (via state)
- Listens for storage changes (logout in other tab)

#### EventListing.jsx
**Purpose**: List and manage events  
**State**:
- `events` - Array of events
- `activeTab` - 'upcoming' | 'archived'
- Filter states: `filterName`, `filterLocation`, `filterCountry`, `filterYear`
- `showCreate` - Create modal visibility
- `showCsvUpload` - CSV upload modal visibility

**Features**:
1. **Tabbed Interface**:
   - Upcoming Events tab (default)
   - Archived Events tab

2. **Filters**:
   - Name search
   - Location search
   - Country search
   - Year filter

3. **Actions**:
   - Create new event (modal form)
   - Upload CSV (modal with file input)
   - Archive/Unarchive (with confirmation)
   - Delete (with confirmation)
   - Navigate to event details

4. **API Calls**:
   - `POST /org/event/list/upcoming` - Get active events
   - `POST /org/event/list/archived` - Get archived events
   - `POST /org/event/create` - Create new event
   - `POST /org/event/delete` - Delete event
   - `POST /org/event/archive` - Archive event
   - `POST /org/event/unarchive` - Unarchive event
   - `POST /org/event/upload-csv` - Bulk participant upload

#### EventPage.jsx
**Purpose**: Main result viewing and management page  
**State** (extensive):
- `categories` - Available categories
- `eventName` - Event title
- `selectedCatId`, `selectedCat` - Currently selected category
- `catDetail` - Category result data
- `viewMode` - 'category' | 'overall' | 'gender'
- `selectedDistance`, `selectedGender` - For overall/gender views
- `rankData` - Overall/gender rank data
- `bibInput` - Search input
- `participantDetails` - Selected participant
- `isModalVisible`, `isEditing` - Modal states
- `editedDetails` - Editable participant data
- `rankMode` - 'TIME' for sorting mode

**View Modes**:

1. **Category View** (Default):
   - Category tabs at top
   - Results for selected category
   - Sorted by category rank
   - Displays: Rank Cat, Mix, Tot, Bib, Name, Times, CPs

2. **Overall View**:
   - Distance selector dropdown
   - All participants by distance
   - Sorted by overall rank (Rank Tot)
   - Displays: Rank Tot, Bib, Name, Cat, Gender, Times

3. **Gender View**:
   - Distance selector + Gender toggle (M/F)
   - Filtered by gender
   - Sorted by gender rank (Rank Mix)
   - Displays: Rank Mix, Bib, Name, Cat, Times

**LAP Mode Differences**:
- Shows `Lap` column instead of standard times
- Best lap time display
- Different ranking logic
- Special leaderboard layout

**Participant Details Modal**:
- View mode: Read-only display
- Edit mode: Editable fields
  - Status dropdown
  - Time inputs
  - Lap count (LAP mode)
  - Save/Cancel buttons
- API call: `POST /participant/update`

**API Calls**:
- `POST /race/categories` - Get categories
- `POST /report/event/category` - Get category results
- `POST /report/event/distance` - Get overall results
- `POST /report/event/gender` - Get gender results
- `POST /participant/details` - Get participant details
- `POST /participant/update` - Update participant

**Features**:
- Auto-refresh after edits (silent fetch)
- Sticky rank column (CSS position: sticky)
- Responsive table (horizontal scroll)
- Medal icons for top 3
- Time formatting utilities
- Print support via react-to-print

#### RaceSetup.jsx
**Purpose**: Configure race categories  
**State**:
- `categories` - List of categories
- `newCat` - Form data for new category
  - `cat` - Code (A, B, C)
  - `category` - Full name
  - `distance` - Distance in meters
  - `race` - Race description
  - `gender` - All/Male/Female
  - `raceMode` - NET/OFFICIAL/LAP
  - `isLap` - Boolean toggle
  - `cplist` - Checkpoint list (e.g., "CP1,CP2,CP3")
  - Gun time fields
- `lapParams` - LAP mode parameters
  - `halflapDistance`
  - `fulllapDistance`
  - `numberOfLaps`

**Process**:
1. Load existing categories for event
2. Display category list
3. Create new category:
   - Fill form
   - Choose race mode (toggle LAP checkbox)
   - If LAP mode: Configure lap parameters
   - Auto-calculate total distance
   - Submit to `/race/category/create`
4. Edit existing category:
   - Load into form
   - Update fields
   - Submit to `/race/category/update`
5. Delete category (with confirmation)

**LAP Mode Logic**:
- Toggle `isLap` checkbox
- Set `raceMode = 'LAP'`
- Show lap parameter inputs
- Calculate: `distance = halflapDistance + (fulllapDistance * numberOfLaps)`

**API Calls**:
- `POST /race/categories` - List categories
- `POST /race/category/create` - Create category
- `POST /race/category/update` - Update category
- `POST /race/category/delete` - Delete category

#### PublicLeaderboard.jsx
**Purpose**: Public-facing leaderboard (NET/OFFICIAL modes)  
**State**:
- `categories` - All categories
- `catDetails` - Results for each category (keyed by catId)
- `eventName`
- `loading`, `catDetailsLoading`

**Features**:
- **No authentication**: Uses regular `fetch`, not `authFetch`
- **Category tabs**: Horizontal scroll on mobile
- **Auto-fetch all categories**: Parallel Promise.all()
- **Medal display**: Top 3 with icons and gold color
- **Time formatting**: Removes milliseconds, displays HH:MM:SS
- **Responsive design**: Table scrolls horizontally on small screens
- **Sticky rank**: First column always visible

**API Calls**:
- `POST /race/categories` - Get categories (no auth)
- `POST /public/leaderboard/{eventId}` - Get leaderboard (no auth)

**Layout**:
```
┌────────────────────────────────────┐
│  🏆 [Event Name] Leaderboard       │
├────────────────────────────────────┤
│  [Cat A] [Cat B] [Cat C] ...      │  ← Category tabs
├────────────────────────────────────┤
│  Rank | Bib | Name | Times | CPs  │  ← Table
│  🥇 1  | 101 | John | 01:23:45 |  │
│  🥈 2  | 102 | Jane | 01:24:12 |  │
│  🥉 3  | 103 | Bob  | 01:25:33 |  │
│     4  | 104 | Alice| 01:26:45 |  │
└────────────────────────────────────┘
```

#### LapLeaderboard.jsx
**Purpose**: Public-facing leaderboard for LAP mode  
**Similar to PublicLeaderboard** but:
- **Filters categories**: Only shows `raceMode === 'LAP'`
- **Different columns**: Rank, Bib, Name, Laps, Best Lap, Times
- **Different API**: `POST /public/leaderboard/lap/{eventId}`
- **Different layout**: Optimized for lap data

**LAP Data**:
- `lap` - Total laps completed
- `bestLapTime` - Best lap time
- `lastLapTime` - Most recent lap
- Ranked by: Total laps (desc) → Best lap time (asc)

#### StatisticPage.jsx
**Purpose**: Event analytics and statistics  
**Displays**:
- Total registered participants
- Total started
- Total finished
- DNF, DNS, DQ counts
- Completion percentage
- Average finish time by category
- Gender distribution
- Category distribution

**API**: `POST /statistic/event/{eventId}`

#### OrgContext.jsx
**Purpose**: Global state management  
**Provides**:
- `orgId` - Current organization ID
- `setOrgId` - Setter function

**Usage**: Wrap `<App>` with `<OrgProvider>`  
**Access**: `const { orgId, setOrgId } = useOrg();`

### Utility Functions

#### authFetch.js
**Purpose**: Wrapper around `fetch` to include authentication headers  
**Behavior**:
1. Retrieve session data from sessionStorage
2. Add headers:
   - `sessionId`
   - `sessionExpiryTime`
   - `username`
   - `orgId`
3. Make fetch request
4. Handle response:
   - If 401 → Clear session → Redirect to `/login`
   - If network error → Alert user
   - Otherwise → Return response

**Usage**:
```javascript
import { authFetch } from '../utils/authFetch';

authFetch('/api/endpoint', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ data })
})
.then(res => res.json())
.then(data => console.log(data));
```

---

## 🛣️ Routing

### Route Table

| Path | Component | Auth Required | Role | Description |
|------|-----------|---------------|------|-------------|
| `/` | Home | No | - | Landing page |
| `/login` | Login | No | - | Authentication |
| `/public/leaderboard/:eventId` | PublicLeaderboard | No | - | Public results (NET/OFFICIAL) |
| `/public/lap-leaderboard/:eventId` | LapLeaderboard | No | - | Public results (LAP) |
| `/dashboard` | Dashboard | Yes | All | Admin dashboard |
| `/eventlisting` | EventListing | Yes | All | Event management |
| `/eventsetup` | EventSetup | Yes | Admin | Create events |
| `/racesetup/:eventId` | RaceSetup | Yes | All | Configure categories |
| `/event/:eventId` | EventPage | Yes | All | Event results |
| `/topevent/:eventId/:category` | TopEventPage | Yes | All | Top performers |
| `/statistic/:eventId` | StatisticPage | Yes | All | Event statistics |
| `/registered/:eventId` | Registered | Yes | All | Registered participants |
| `/started/:eventId` | Started | Yes | All | Started participants |
| `/finished/:eventId` | Finished | Yes | All | Finished participants |
| `/did-not-start/:eventId` | DidNotStart | Yes | All | DNS list |
| `/did-not-finish/:eventId` | DidNotFinish | Yes | All | DNF list |
| `/false-start/:eventId` | FalseStart | Yes | All | False start list |
| `/no-start-but-finished/:eventId` | NoStartButFinished | Yes | All | Anomaly list |
| `/disqualified/:eventId` | Disqualified | Yes | All | DQ list |

### Route Protection

All protected routes are wrapped in `<ProtectedRoute>`:
```jsx
<Route 
  path="/dashboard" 
  element={<ProtectedRoute><Dashboard /></ProtectedRoute>} 
/>
```

**ProtectedRoute Logic**:
1. Check sessionStorage for session data
2. Validate session expiry (client-side check)
3. If valid → Render children
4. If invalid → Redirect to `/login` with return URL

---

## 🔐 Authentication

### Session Flow

1. **Login**:
   ```
   User → Login form → POST /login
   ← Response: { sessionId, sessionExpiryTime, username, orgId, role }
   → Store in sessionStorage
   → Redirect to /dashboard
   ```

2. **Authenticated Request**:
   ```
   Component → authFetch(url, options)
   → Add headers: sessionId, sessionExpiryTime, username, orgId
   → POST url
   ← Response: Data or 401
   → If 401: Clear session, redirect to /login
   ```

3. **Session Validation** (Backend):
   ```
   Request → SessionValidationInterceptor
   → Check headers present
   → Check session in database
   → Check expiry time
   → If valid: Continue
   → If invalid: Return 401
   ```

4. **Logout**:
   ```
   User → Click logout
   → Confirm
   → Clear sessionStorage
   → Redirect to /login
   ```

### Session Storage

**Keys**:
- `sessionId` - Unique session identifier
- `sessionExpiryTime` - ISO timestamp (now + 2 hours)
- `username` - User's username
- `orgId` - Organization ID
- `role` - User role (admin/user)
- `eventName` - Currently viewed event (optional)

**Expiry**: 2 hours from login  
**Validation**: Client-side (ProtectedRoute) + Server-side (Interceptor)

### Multi-Tab Logout

`ProtectedRoute` listens for `storage` events:
```javascript
window.addEventListener('storage', checkAuth);
```

If session cleared in one tab, other tabs detect and redirect to login.

---

## 🔌 API Integration

### API Base URL

Configured in `src/apiBase.js`:
```javascript
const apiBase = isProd
  ? (envApiBase || 'https://api.mypacetracker.com')
  : (envApiBase || 'http://localhost:8080');
```

**Environment Variables**:
- `REACT_APP_API_BASE` - Override default API URL
- `NODE_ENV` - 'development' | 'production'

### API Endpoints Used

#### Authentication
- `POST /login` - User login

#### Organization & Events
- `POST /org/event/list/upcoming` - Get active events
- `POST /org/event/list/archived` - Get archived events
- `POST /org/event/create` - Create event
- `POST /org/event/delete` - Delete event
- `POST /org/event/archive` - Archive event
- `POST /org/event/unarchive` - Unarchive event
- `POST /org/event/upload-csv` - Upload participants CSV

#### Race Configuration
- `POST /race/categories` - List categories
- `POST /race/category/create` - Create category
- `POST /race/category/update` - Update category
- `POST /race/category/delete` - Delete category

#### Results & Reports
- `POST /report/event/category` - Get category results
- `POST /report/event/distance` - Get overall results
- `POST /report/event/gender` - Get gender results
- `POST /report/export` - Export Excel

#### Participants
- `POST /participant/details` - Get participant details
- `POST /participant/update` - Update participant
- `POST /participant/list/registered` - Get registered
- `POST /participant/list/started` - Get started
- `POST /participant/list/finished` - Get finished
- ...etc for other statuses

#### Public (No Auth)
- `POST /public/leaderboard/{eventId}` - Public leaderboard
- `POST /public/leaderboard/lap/{eventId}` - LAP leaderboard

#### Statistics
- `POST /statistic/event/{eventId}` - Event statistics

### Request/Response Format

**Typical Request**:
```javascript
{
  eventId: "uuid",
  category: "A",
  // other params
}
```

**Typical Response** (Results):
```javascript
{
  mode: "TIME", // or "LAP"
  data: [
    {
      bib: "101",
      name: "John Doe",
      category: "10KM Men",
      rankCat: 1,
      rankMix: 1,
      rankTot: 1,
      netTime: "01:23:45",
      officialTime: "01:23:50",
      timeCP1: "00:10:30",
      // ...
    }
  ]
}
```

**Error Response**:
```javascript
{
  error: "Error message",
  status: 400
}
```

---

## 🎨 Styling

### Approach
- **CSS Modules**: Not used (potential future improvement)
- **Inline Styles**: Extensively used for component-specific styles
- **Global CSS**: `src/styles/App.css` for app-wide styles
- **CSS Classes**: `EventListing.css` for EventListing component

### Theme
- **Primary Color**: #007bff (blue)
- **Success**: #28a745 (green)
- **Warning**: #ff9800 (orange)
- **Danger**: #dc3545 (red)
- **Gold (Top 3)**: #DAA520
- **Background**: #f0f6ff (light blue)
- **Border**: #ddd
- **Text**: #333

### Responsive Design
- **Mobile Breakpoint**: 600px
- **Approach**: Horizontal scrolling for tables on mobile
- **State**: `isMobile` state tracks screen width

**Example**:
```javascript
const [isMobile, setIsMobile] = useState(window.innerWidth <= 600);

useEffect(() => {
  const handleResize = () => setIsMobile(window.innerWidth <= 600);
  window.addEventListener('resize', handleResize);
  return () => window.removeEventListener('resize', handleResize);
}, []);
```

### Common Styles

**Buttons**:
```javascript
{
  padding: '8px 16px',
  borderRadius: '4px',
  border: 'none',
  cursor: 'pointer',
  fontSize: '14px',
  background: '#007bff',
  color: '#fff'
}
```

**Tables**:
```javascript
{
  borderCollapse: 'collapse',
  width: '100%',
  fontSize: '14px'
}
```

**Sticky Column**:
```css
.sticky-rank-column {
  position: sticky;
  left: 0;
  background: white;
  z-index: 1;
}
```

---

## 🚀 Setup & Development

### Prerequisites
- Node.js 14+
- npm

### Installation

1. **Navigate to project**:
   ```bash
   cd C:\MyPaceTracker\MFEMyPaceTracker\my-react-app
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure API** (optional):
   Edit `src/apiBase.js` if backend is not on `localhost:8080`

### Development

**Start development server**:
```bash
npm start
```
- Opens browser at `http://localhost:3000`
- Hot reload enabled
- Proxy to backend configured in `package.json`

**Proxy Configuration**:
```json
{
  "proxy": "http://localhost:8080"
}
```

### Scripts

```bash
npm start          # Start development server (port 3000)
npm run build      # Create production build
npm test           # Run tests in watch mode
npm run eject      # Eject from Create React App (irreversible)
```

---

## 📦 Build & Deployment

### Production Build

```bash
npm run build
```

**Output**: `build/` directory with:
- `index.html` - Entry point
- `static/js/` - Bundled JavaScript
- `static/css/` - Bundled CSS
- `static/media/` - Images, fonts, etc.

**Optimizations**:
- Minified code
- Tree shaking
- Code splitting
- Asset optimization

### Production Server (Express)

**File**: `server.js` (in project root)

**Features**:
- Static file serving from `build/`
- SPA fallback (all routes → `index.html`)
- CORS configuration
- Host header validation
- HTTPS support (with certificates)

**Start Production Server**:
```bash
node server.js
```
- Listens on port `7755`
- Serves from `build/` directory

**HTTPS Setup**:
1. Generate SSL certificates:
   ```bash
   mkdir certs
   # Generate self-signed cert (development)
   openssl req -nodes -new -x509 -keyout certs/server.key -out certs/server.cert
   ```
2. Update `server.js` to use HTTPS:
   ```javascript
   const https = require('https');
   const fs = require('fs');

   const httpsOptions = {
     key: fs.readFileSync('./certs/server.key'),
     cert: fs.readFileSync('./certs/server.cert')
   };

   https.createServer(httpsOptions, app).listen(7755, () => {
     console.log('HTTPS server on port 7755');
   });
   ```

### Deployment

**Options**:
1. **AWS S3 + CloudFront**: Static hosting
2. **Nginx**: Serve `build/` directory
3. **Docker**: Container with Node + Express
4. **Heroku**: Deploy with `server.js`

**Nginx Configuration**:
```nginx
server {
  listen 80;
  server_name www.mypacetracker.com;
  root /var/www/my-react-app/build;
  index index.html;

  location / {
    try_files $uri $uri/ /index.html;
  }
}
```

---

## 🧪 Testing

### Test Framework
- **Jest**: Test runner (bundled with CRA)
- **React Testing Library**: Component testing
- **User Event**: User interaction simulation

### Existing Tests
- `Login.test.js` - Login component tests
- `ProtectedRoute.test.js` - Route protection tests
- `authFetch.test.js` - API wrapper tests (in utils/)

### Running Tests

```bash
npm test
```
- Runs in watch mode
- Interactive test runner
- Coverage reporting available

**Coverage Report**:
```bash
npm test -- --coverage --watchAll=false
```

### Test Examples

**Login Component Test**:
```javascript
test('displays error on invalid login', async () => {
  render(<Login />);
  
  fireEvent.change(screen.getByLabelText(/username/i), {
    target: { value: 'baduser' }
  });
  fireEvent.change(screen.getByLabelText(/password/i), {
    target: { value: 'badpass' }
  });
  
  fireEvent.click(screen.getByRole('button', { name: /login/i }));
  
  await waitFor(() => {
    expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument();
  });
});
```

**Protected Route Test**:
```javascript
test('redirects to login when not authenticated', () => {
  sessionStorage.clear();
  
  render(
    <BrowserRouter>
      <ProtectedRoute>
        <div>Protected Content</div>
      </ProtectedRoute>
    </BrowserRouter>
  );
  
  expect(window.location.pathname).toBe('/login');
});
```

### Future Testing

**To Be Added**:
- EventListing component tests
- EventPage component tests
- API integration tests (mocked)
- E2E tests (Cypress/Playwright)

---

## ⚙️ Configuration

### Environment Variables

**Available Variables**:
- `REACT_APP_API_BASE` - Backend API URL
- `NODE_ENV` - 'development' | 'production'
- `PORT` - Development server port (default 3000)

**Usage**:
```bash
# .env file
REACT_APP_API_BASE=https://api.mypacetracker.com
PORT=3000
```

**Access in Code**:
```javascript
const apiBase = process.env.REACT_APP_API_BASE;
```

### package.json

**Key Dependencies**:
```json
{
  "react": "^19.1.0",
  "react-dom": "^19.1.0",
  "react-router-dom": "^7.6.3",
  "react-to-print": "^3.1.1",
  "cors": "^2.8.5",
  "express": "^5.1.0"
}
```

**Proxy** (Development):
```json
{
  "proxy": "http://localhost:8080"
}
```

**Scripts**:
```json
{
  "start": "react-scripts start",
  "build": "react-scripts build",
  "test": "react-scripts test",
  "eject": "react-scripts eject"
}
```

### Browser Compatibility

**Supported Browsers** (from package.json):
- **Production**:
  - \>0.2% usage
  - Not dead
  - Not op_mini all
- **Development**:
  - Last 1 Chrome version
  - Last 1 Firefox version
  - Last 1 Safari version

---

## 📚 Additional Resources

- **React Docs**: https://react.dev/
- **React Router**: https://reactrouter.com/
- **Create React App**: https://create-react-app.dev/
- **Jest**: https://jestjs.io/
- **React Testing Library**: https://testing-library.com/react

---

## 🐛 Known Issues

1. **Auto-refresh disabled** on public leaderboards (to be implemented)
2. **Session expiry modal** not implemented (hard redirect only)
3. **Optimistic UI updates** not implemented (full refetch on edits)
4. **No loading skeletons** (just loading text)
5. **No error boundaries** (errors crash entire app)

---

## 🔮 Future Enhancements

1. **Personal participant pages** (`/public/participant/:eventId/:bib`)
2. **E-certificate download** (PDF generation)
3. **Personal report download** (Individual results PDF)
4. **Auto-refresh** for public leaderboards
5. **Progressive Web App** (PWA) support
6. **Push notifications** (result availability)
7. **Dark mode** toggle
8. **Multi-language** support (i18n)
9. **Advanced filters** on result pages
10. **Export to PDF** directly from browser

---

**Every Second Counts** ⏱️
