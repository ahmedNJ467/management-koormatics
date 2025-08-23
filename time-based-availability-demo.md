# Time-Based Availability System

## Overview

The vehicle and driver availability system has been updated to implement proper time-based scheduling rules. Resources (drivers and vehicles) are now considered available based on actual time schedules rather than just trip status.

## Key Features

### 1. **Time-Based Rules**

- **Available immediately** when a trip is marked as "completed"
- **Available 1 hour after return time** for scheduled/in-progress trips with return times
- **Available 1 hour after estimated end time** for one-way trips (estimated based on service type)
- **Buffer period of 1 hour** between assignments to allow for travel, rest, and preparation

### 2. **Service Type Duration Estimates**

When trips don't have return times, the system estimates duration based on service type:

- **Airport pickup/dropoff**: 2 hours
- **One-way transfer**: 1.5 hours
- **Round trip**: 4 hours
- **Full day hire**: 8 hours
- **Half day**: 4 hours
- **Default**: 2 hours

### 3. **Enhanced Availability Display**

#### Drivers

- **"Available"** (green) - Ready for new assignments
- **"Busy"** (amber) - Currently assigned or within buffer period
- Shows specific reason: "Currently on trip", "Scheduled for trip from X to Y", etc.
- Displays next available time when busy

#### Vehicles

- **"Available"** (green) - Ready for assignments
- **"Assigned"** (amber) - Primary vehicle for a trip
- **"Escort"** (red) - Assigned as security escort
- Shows detailed availability information and next available time

### 4. **Smart Assignment Dialogs**

- **Driver Assignment**: Shows availability status with time conflicts
- **Vehicle Assignment**: Filters by vehicle type and shows availability
- **Conflict Warnings**: Alerts when assigning busy resources
- **Time-based filtering**: Only shows genuinely available resources

## Usage Examples

### Example 1: Trip Completion

```
Trip: Airport pickup scheduled 9:00 AM - 11:00 AM
Status: Completed at 10:45 AM
Result: Driver and vehicle immediately available
```

### Example 2: Scheduled Trip with Return Time

```
Trip: Round trip scheduled 2:00 PM - 6:00 PM
Current time: 4:00 PM
Status: In progress
Result: Driver and vehicle available at 7:00 PM (6:00 PM + 1 hour buffer)
```

### Example 3: One-way Trip (No Return Time)

```
Trip: One-way transfer scheduled 3:00 PM
Service type: Airport dropoff (estimated 2 hours)
Current time: 4:30 PM
Result: Driver and vehicle available at 6:00 PM (5:00 PM + 1 hour buffer)
```

## Technical Implementation

### Files Modified

- `src/lib/utils/availability-utils.ts` - Core availability logic
- `src/components/dispatch/DriverStatus.tsx` - Enhanced availability display
- `src/components/trips/AssignDriverDialog.tsx` - Time-based driver assignment
- `src/components/dispatch/AssignVehicleDialog.tsx` - Time-based vehicle assignment

### Key Functions

- `isResourceAvailable()` - Main availability checker
- `isDriverAvailableForTimeSlot()` - Checks driver conflicts for specific time slots
- `isVehicleAvailableForTimeSlot()` - Checks vehicle conflicts for specific time slots
- `calculateExpectedEndTime()` - Estimates trip end times

## Benefits

1. **Prevents Overbooking**: Resources can't be double-booked during active periods
2. **Realistic Scheduling**: Accounts for travel time and preparation between trips
3. **Better Planning**: Shows exactly when resources become available
4. **Reduced Conflicts**: Automatic conflict detection and warnings
5. **Improved Efficiency**: More accurate resource utilization tracking

## Buffer Time Configuration

The system uses a configurable 1-hour buffer by default, which can be adjusted:

```typescript
const availability = isResourceAvailable(resourceId, "driver", trips, {
  bufferHours: 1.5, // Custom buffer time
  currentDateTime: new Date(), // Custom current time for testing
});
```

This ensures proper rest time and preparation between assignments while maintaining operational efficiency.
