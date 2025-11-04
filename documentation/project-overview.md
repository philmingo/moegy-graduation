# Graduation Name Announcement System Documentation

## Project Overview

The Graduation Name Announcement System is a web application designed to streamline the process of announcing graduate names during a graduation ceremony. The system uses QR codes to quickly identify graduates and provides a text-to-speech feature to announce their names correctly, including phonetic pronunciations when available. It also includes portals for administrators, mobile scanners, and students.

### Key Features

-   **Admin Dashboard**: Manage students (add, edit, delete, bulk import), generate QR codes.
-   **Mobile QR Scanning**: Dedicated mobile-friendly page (`/mobile-scan`) for staff to scan QR codes, with real-time WebSocket communication to a desktop dashboard. Includes mobile-specific login.
-   **Student Portal**: Students can log in (`/student-portal`) with their credentials to view the student list, search for their name, and view/download/copy their personalized QR code.
-   **Desktop QR Code Scanning**: Scan QR codes directly on admin/scanner pages using a connected camera.
-   **Phonetic Spelling Support**: Ensures correct name pronunciation.
-   **Text-to-Speech Name Announcement**: Announces names clearly.
-   **Secure Authentication**: Separate login mechanisms for admin, mobile scanners, and students.
-   **Responsive Design**: Adapts to different screen sizes.
-   **Robust WebSocket Communication**: Improved resilience for desktop clients when the WebSocket server is temporarily unavailable, allowing core local functionalities to continue.

## File Structure

\`\`\`
graduation-name-announcer/
├── app/                      # Next.js app directory
│   ├── admin/                # Admin dashboard pages
│   │   ├── page.tsx
│   │   └── layout.tsx
│   ├── login/                # Admin login page
│   │   └── page.tsx
│   ├── mobile-scan/          # Mobile-specific QR scanner page
│   │   └── page.tsx
│   ├── scanner/              # Original desktop QR scanner page
│   │   └── page.tsx
│   ├── student-portal/       # Student portal page
│   │   └── page.tsx
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx              # Root page (redirects to admin login)
├── components/               # Reusable components
│   ├── admin-header.tsx
│   ├── auth-guard.tsx        # For admin routes
│   ├── desktop-websocket-client.tsx
│   ├── mobile-login.tsx      # Login form for /mobile-scan
│   ├── mobile-qr-scanner.tsx
│   ├── qr-code-generator.tsx
│   ├── qr-scanner.tsx
│   ├── student-list.tsx      # Admin student list component
│   ├── student-login-form.tsx # Login form for /student-portal
│   └── ui/                   # UI components (shadcn)
├── documentation/            # Project documentation
│   ├── project-overview.md   # This file
│   ├── mobile-scan.md
│   └── websocket.js
├── lib/                      # Library files
│   ├── students-data.ts      # Mock student data with credentials
│   └── utils.ts
├── public/                   # Static assets
└── tailwind.config.js
\`\`\`

## Core Components

### Authentication Systems

The application uses simple authentication systems with localStorage for demo purposes.
-   **Admin Login (`app/login/page.tsx`)**: Email/password for administrators. Protected by `components/auth-guard.tsx`.
-   **Mobile Scanner Login (`app/mobile-scan/page.tsx` with `components/mobile-login.tsx`)**: Password-based access for staff using the mobile scanning page.
-   **Student Portal Login (`app/student-portal/page.tsx` with `components/student-login-form.tsx`)**: Email/password for students to access their information.

### Admin Dashboard (`app/admin/page.tsx`)
Allows administrators to manage students, generate QR codes, and access the scanner.

### Mobile Scanner (`app/mobile-scan/page.tsx`)
A dedicated, mobile-friendly web page for scanning QR codes using a smartphone's camera. Scanned data is sent via WebSocket.

### Student Portal (`app/student-portal/page.tsx`)
A responsive page where students can:
- Log in using their email and password.
- View a list of all graduating students.
- Search for their name or program.
- View, download, or copy their complete, personalized QR code card for the ceremony.

### QR Scanning Systems
(No changes to this section's content, but its context is now broader with the student portal)

## Technical Implementation Details

### QR Code Format
(No changes needed)

### State Management
(No changes needed, but state is now managed for student portal as well)

### Data Persistence
Student data, including mock credentials, is stored in `lib/students-data.ts`. Login states for different portals are managed using `localStorage`.

### Styling
(No changes needed)

### WebSocket Communication
For the mobile scanning feature, a WebSocket server (`documentation/websocket.js`) facilitates real-time communication.
-   **Client-Side Resilience**: The `DesktopWebSocketClient` component has been enhanced to handle WebSocket server unavailability more gracefully. If the server is offline, the client will attempt to reconnect a few times and then inform the user that mobile features are temporarily unavailable, allowing local functionalities (like desktop QR scanning) to continue without interruption. Users can manually trigger a reconnection attempt if they believe the server is back online.

### Performance Optimizations

The application includes several performance optimizations to ensure smooth user interactions, particularly for the bulk selection functionality in the admin interface.

#### Student Selection Performance Issue

**Problem**: The bulk student selection feature was experiencing lag when users clicked on rows to select/deselect students. This was caused by excessive re-rendering of components due to:

1. **Inefficient useCallback dependencies**: The `toggleSelectAll` function had dependencies on `filteredStudents` and `selectedStudents.size`, which changed frequently and caused the function to be recreated on every render.
2. **Cascading re-renders**: Changes to selection state were causing unnecessary re-renders of all student rows.
3. **Suboptimal memo comparison**: The StudentRow component's memo comparison function was not efficiently preventing re-renders.

**Solution**: Several optimizations were implemented:

1. **Optimized useCallback dependencies**:
   - `toggleSelectAll`: Removed dependency on `filteredStudents` and `selectedStudents.size`, instead calculating filtered students inline within the callback
   - `toggleStudentSelection`: Removed all dependencies by using functional state updates

2. **Improved memoization**:
   - Enhanced the StudentRow memo comparison function to be more direct and efficient
   - Only re-render rows when essential props actually change (selection state, student data)

3. **Functional state updates**:
   - Used functional state updates (`setState(prev => ...)`) to avoid dependencies on current state values
   - This prevents unnecessary callback recreations and reduces re-render cascades

**Code Example**:
\`\`\`typescript
// Before (caused frequent re-renders)
const toggleSelectAll = useCallback(() => {
  if (selectedStudents.size === filteredStudents.length) {
    setSelectedStudents(new Set())
  } else {
    setSelectedStudents(new Set(filteredStudents.map((s) => s.id)))
  }
}, [selectedStudents.size, filteredStudents]) // These dependencies changed frequently

// After (optimized)
const toggleSelectAll = useCallback(() => {
  setSelectedStudents((prevSelected) => {
    // Calculate filtered students inline to avoid dependency
    const currentFiltered = students.filter((student) => {
      const fullName = `${student.first_name} ${student.last_name}`.toLowerCase()
      return fullName.includes(searchQuery.toLowerCase())
    })

    if (prevSelected.size === currentFiltered.length) {
      return new Set()
    } else {
      return new Set(currentFiltered.map((s) => s.id))
    }
  })
}, [students, searchQuery]) // Only depend on stable values
\`\`\`

**Result**: The selection functionality now responds instantly to user interactions without any noticeable lag, even with large numbers of students.

## User Workflows

### Administrator Workflow
(No changes needed)

### Graduation Ceremony Workflow (Mobile Scanning)
(No changes needed)

### Student Workflow
1. Navigate to the `/student-portal` page.
2. Log in using their provided email and password.
3. View the list of graduating students.
4. Optionally, search for their name.
5. Click "View QR Code" on their entry.
6. In the modal, download or copy their personalized QR code image.
7. Log out.


## Troubleshooting

Common issues and solutions:
(Existing items remain relevant)
-   **WebSocket Connection Issues (Desktop Client)**:
    -   If the WebSocket server is offline, the desktop client (on `/admin` or `/scanner` pages) will indicate that "Mobile Features Offline." Local scanning will still work.
    -   A "Retry" button may appear to attempt reconnection if the server was previously marked as offline by the client.
    -   Ensure the WebSocket server (`documentation/websocket.js`) is running and accessible.
    -   Verify `NEXT_PUBLIC_WEBSOCKET_URL`.

(Other sections like Security, Browser Compatibility, Future Enhancements, Conclusion can remain largely the same, or you can add notes about the student portal if desired.)
