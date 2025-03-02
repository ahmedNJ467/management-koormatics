
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { TripType, tripTypeDisplayMap } from '@/lib/types/trip';

interface TripTypeBadgeProps {
  type: TripType;
}

export function TripTypeBadge({ type }: TripTypeBadgeProps) {
  const getTypeColor = () => {
    switch (type) {
      case 'airport_pickup':
      case 'airport_dropoff':
        return 'bg-purple-100 text-purple-700 hover:bg-purple-100';
      case 'hourly':
        return 'bg-blue-100 text-blue-700 hover:bg-blue-100';
      case 'full_day':
        return 'bg-green-100 text-green-700 hover:bg-green-100';
      case 'multi_day':
        return 'bg-indigo-100 text-indigo-700 hover:bg-indigo-100';
      case 'one_way_transfer':
        return 'bg-cyan-100 text-cyan-700 hover:bg-cyan-100';
      case 'round_trip':
        return 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100';
      case 'security_escort':
        return 'bg-amber-100 text-amber-700 hover:bg-amber-100';
      default:
        return 'bg-gray-100 text-gray-700 hover:bg-gray-100';
    }
  };

  return (
    <Badge className={`${getTypeColor()} border-none font-medium`} variant="outline">
      {tripTypeDisplayMap[type] || type}
    </Badge>
  );
}
