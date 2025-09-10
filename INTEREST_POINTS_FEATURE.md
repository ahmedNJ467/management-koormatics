# Interest Points Feature

## Overview
The Interest Points feature allows users to add, manage, and display custom markers on the dispatch map. This is useful for marking important locations such as airports, ports, security checkpoints, fuel stations, and other points of interest.

## Features

### 1. Adding Interest Points
- **Click on Map**: Click anywhere on the map to open the "Add Interest Point" dialog
- **Manual Entry**: Enter coordinates manually in the dialog
- **Categories**: Choose from predefined categories (airport, port, security, fuel, health, etc.)
- **Customization**: Set custom icons and colors for each point

### 2. Managing Interest Points
- **Interest Points Tab**: Access the dedicated tab in the dispatch page
- **Search & Filter**: Search by name/description and filter by category
- **Edit**: Modify existing interest points
- **Delete**: Remove interest points with confirmation
- **View Details**: Click on points to see information windows

### 3. Map Integration
- **Visual Markers**: Custom colored markers with icons
- **Info Windows**: Click markers to see details
- **Real-time Updates**: Changes reflect immediately on the map
- **Toggle Display**: Show/hide interest points on the map

## Usage

### Adding a New Interest Point
1. Navigate to the Dispatch page
2. Click on the map where you want to add a point
3. Fill in the required information:
   - Name (required)
   - Description (optional)
   - Category
   - Icon and color (auto-filled based on category)
4. Click "Add Interest Point"

### Managing Interest Points
1. Click the "Interest Points" tab
2. Use the search bar to find specific points
3. Filter by category using the dropdown
4. Click edit/delete buttons on individual points
5. View all points in a scrollable list

### Categories Available
- **Airport** ✈️ - Airports and airstrips
- **Port** 🚢 - Seaports and harbors
- **Market** 🛒 - Markets and shopping areas
- **City** 🏙️ - City centers and urban areas
- **Security** 🚨 - Security checkpoints and police stations
- **Fuel** ⛽ - Fuel stations and gas stations
- **Health** 🏥 - Hospitals and medical facilities
- **Restaurant** 🍽️ - Restaurants and food establishments
- **Hotel** 🏨 - Hotels and accommodations
- **Bank** 🏦 - Banks and financial institutions
- **School** 🏫 - Schools and educational facilities
- **Mosque** 🕌 - Religious buildings
- **General** 📍 - General purpose markers

## Technical Details

### Database
- Table: `interest_points`
- Fields: id, name, description, category, latitude, longitude, icon, color, is_active, created_by, created_at, updated_at
- Row Level Security (RLS) enabled
- Automatic timestamp updates

### API Endpoints
- `GET /interest_points` - Fetch all active interest points
- `POST /interest_points` - Create new interest point
- `PUT /interest_points/:id` - Update existing interest point
- `DELETE /interest_points/:id` - Delete interest point
- `GET /interest_points/category/:category` - Filter by category
- `GET /interest_points/search?q=query` - Search interest points

### Components
- `LiveMap` - Enhanced map component with interest point support
- `InterestPointsManager` - Main management interface
- `AddInterestPointDialog` - Dialog for adding new points
- `EditInterestPointDialog` - Dialog for editing existing points
- `DeleteInterestPointDialog` - Confirmation dialog for deletion

### Hooks
- `useInterestPoints` - Main hook for CRUD operations
- `useInterestPointsByCategory` - Filter by category
- `useInterestPointById` - Get specific point
- `useInterestPointsInBounds` - Get points within map bounds

## Sample Data
The system comes with pre-loaded sample interest points for the Mogadishu area:
- Mogadishu International Airport
- Port of Mogadishu
- Central Market
- City Center
- Security Checkpoint Alpha
- Fuel Station Central
- Hospital Main
- Police Station

## Security
- Only authenticated users can access interest points
- Users can only modify their own created points
- All operations are logged and audited
- Row Level Security ensures data isolation

## Future Enhancements
- Bulk import/export of interest points
- Advanced filtering and sorting options
- Interest point sharing between users
- Integration with external mapping services
- Mobile app support
- Offline capability for field operations
