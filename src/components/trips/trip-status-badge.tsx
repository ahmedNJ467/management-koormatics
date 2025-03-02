
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { TripStatus } from '@/lib/types/trip';

interface TripStatusBadgeProps {
  status: TripStatus;
}

export function TripStatusBadge({ status }: TripStatusBadgeProps) {
  const getStatusColor = () => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-100 text-blue-700 hover:bg-blue-100';
      case 'in_progress':
        return 'bg-amber-100 text-amber-700 hover:bg-amber-100';
      case 'completed':
        return 'bg-green-100 text-green-700 hover:bg-green-100';
      case 'cancelled':
        return 'bg-red-100 text-red-700 hover:bg-red-100';
      default:
        return 'bg-gray-100 text-gray-700 hover:bg-gray-100';
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'scheduled':
        return 'Scheduled';
      case 'in_progress':
        return 'In Progress';
      case 'completed':
        return 'Completed';
      case 'cancelled':
        return 'Cancelled';
      default:
        return status;
    }
  };

  return (
    <Badge className={`${getStatusColor()} border-none font-medium`} variant="outline">
      {getStatusText()}
    </Badge>
  );
}
