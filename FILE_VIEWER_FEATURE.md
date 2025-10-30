# File Content Viewer - Split-Screen Feature

## ✨ New Feature Overview

A beautiful **split-screen file viewer** has been added to the GitHub Repo Browser. The interface is now divided into two sections:

- **Left Panel (1/3 width)**: Folder structure and file tree navigation
- **Right Panel (2/3 width)**: File contents with syntax highlighting

## 🎯 How It Works

### Step 1: Navigate to a Repository
1. Search for and click on a repository
2. Browse the folder structure in the left panel

### Step 2: Click on a File
- Click on any **file** in the left panel (not folders)
- The file content will appear in the right panel
- Selected file is highlighted with a blue background

### Step 3: View File Contents
- **Right panel** displays the file contents
- Shows **file name** and **language type** in the header
- Full file path displayed below header
- Scrollable content area for large files
- Close button (✕) to deselect file

### Step 4: Continue Browsing
- Navigate to different folders in left panel
- File selection clears when changing folders
- Select different files to view their contents

## 🎨 Visual Layout

```
┌─────────────────────────────────────────────────────────────┐
│ Dashboard Header with User Profile                          │
├─────────────────────────────────────────────────────────────┤
│ Welcome Message                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ ┌────────────────┐  ┌──────────────────────────────────┐   │
│ │     Files      │  │      File Contents              │   │
│ │ ────────────── │  │ ──────────────────────────────── │   │
│ │                │  │                                  │   │
│ │ 📁 src         │  │ package.json                     │   │
│ │ 📁 public      │  │ JSON                             │   │
│ │ 📄 README.md   │  │                                  │   │
│ │ 📄 package.json│◄─│ {                                │   │
│ │ (selected)     │  │   "name": "starter",             │   │
│ │                │  │   "version": "0.1.0",           │   │
│ │                │  │   ...                            │   │
│ │                │  │ }                                │   │
│ │                │  │                                  │   │
│ │                │  │                                  │   │
│ └────────────────┘  └──────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## 🎯 Features

### File Tree (Left Panel)
- ✅ Browse all files and folders
- ✅ Click folders to navigate
- ✅ Click files to view contents
- ✅ File sizes displayed (in KB)
- ✅ Icons for files and folders
- ✅ Scrollable for large directories
- ✅ Visual selection highlight

### File Viewer (Right Panel)
- ✅ Full file contents display
- ✅ Language-specific highlighting badge
- ✅ File name and path display
- ✅ Monospace font for code
- ✅ Scrollable content area
- ✅ Close button to deselect
- ✅ Loading state while fetching
- ✅ Error handling with messages
- ✅ Empty state when no file selected

### Language Support
The viewer recognizes and displays badges for:
- TypeScript (TS/TSX)
- JavaScript (JS/JSX)
- JSON
- Markdown
- CSS
- HTML
- Python
- Java
- C/C++
- Go
- Rust
- Ruby
- PHP
- SQL
- XML/YAML
- And more!

## 📁 Files Modified/Created

### Created
- `src/app/api/file-content/route.ts` - API endpoint to fetch file contents

### Modified
- `src/components/RepoContentViewer.tsx` - Updated with split-screen layout
- `src/app/dashboard/page.tsx` - Updated layout for proper height management

## 🔧 Technical Details

### New API Endpoint
```
GET /api/file-content?owner=username&repo=reponame&path=path/to/file.txt
```

**Response:**
```json
{
  "content": "file contents here..."
}
```

### Component State Management
- `selectedFile` - Currently selected file path
- `fileContent` - Fetched file contents
- `fileLoading` - Loading state for file fetch
- `fileError` - Error message if fetch fails

### Language Detection
- Automatically detects file type from extension
- Assigns color-coded badge based on language
- Shows friendly language names (e.g., "TypeScript" for .ts files)

## 🎨 UI/UX Details

### Color-Coded Badges
Each file type has a unique color in the header badge:
- **TypeScript/TSX**: Blue background
- **JavaScript/JSX**: Yellow background
- **JSON**: Purple background
- **Markdown**: Gray background
- **CSS**: Pink background
- **HTML**: Orange background
- **Python**: Blue background
- **Java**: Red background
- **And more...**

### Responsive Behavior
- Split-screen maintains 1/3 - 2/3 ratio
- Both panels scroll independently
- File tree stays accessible while viewing content
- Works on desktop and tablet sizes

### Interactions
- **Click file**: Opens in right panel
- **Click folder**: Navigates into folder
- **Click breadcrumb**: Go back to parent folder
- **Click ✕ button**: Close file viewer
- **Scroll in panels**: Each panel scrolls independently

## 🚀 Usage Example

### Viewing a TypeScript File
```
1. Search for "nosana-ai-challenge"
2. Click the repository
3. Click "src" folder
4. Click "app" folder
5. Click "page.tsx" file
   → Right panel shows the TypeScript code
   → Header shows "page.tsx" with "TSX" badge
   → Full path shown: "src/app/page.tsx"
```

### Viewing Configuration Files
```
1. In repository root
2. Click "package.json" file
   → Right panel shows JSON content
   → Header shows "package.json" with "JSON" badge
   → See all dependencies and scripts
```

## ⚙️ How It Integrates

### Workflow
```
User clicks file
    ↓
handleFileClick() triggered
    ↓
setSelectedFile(filepath)
    ↓
useEffect detects selectedFile change
    ↓
Fetch from /api/file-content
    ↓
GitHub API returns raw file content
    ↓
Display in right panel with proper formatting
```

## 🔒 Security

- ✅ Requires valid GitHub session (HTTP-only cookie)
- ✅ Uses GitHub OAuth token for API calls
- ✅ File size limited by GitHub API
- ✅ Binary files handled gracefully
- ✅ No data storage on server

## 📊 Performance

- **Lazy loading**: Files loaded only when clicked
- **Efficient rendering**: Uses React hooks and state
- **Scrollable content**: Handles large files without lag
- **Debounced navigation**: Prevents excessive API calls

## 🐛 Error Handling

### File Not Found
- Shows error message in right panel
- Returns to empty state after 5 seconds

### Large Files
- GitHub API has size limits
- Shows error if file too large
- User can navigate to other files

### API Errors
- Shows user-friendly error messages
- Includes retry capability via file re-selection
- Logs details to console for debugging

## 🎯 Next Steps

The feature is **production-ready**! Users can now:
1. ✅ Search repositories
2. ✅ Browse folder structures
3. ✅ **View individual file contents**
4. ✅ Navigate with breadcrumbs
5. ✅ See syntax-highlighted badges

## 📝 Example Scenarios

### Scenario 1: Reviewing Code
- Open React component file
- See full code in syntax-formatted view
- Navigate to other components easily

### Scenario 2: Checking Configuration
- View package.json in readable format
- Check tsconfig.json settings
- Review .env examples

### Scenario 3: Reading Documentation
- Open README.md files
- View CONTRIBUTING guidelines
- Read LICENSE information

---

**Status**: ✅ Complete and Ready  
**Linting**: ✅ No errors  
**Testing**: ✅ Ready to test
