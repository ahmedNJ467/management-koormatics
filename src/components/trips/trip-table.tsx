
import React from "react";
import { useTripsQuery } from "./hooks/use-trips-query";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Edit, Trash2 } from "lucide-react";
import { TripStatusBadge } from "./trip-status-badge";
import { TripTypeBadge } from "./trip-type-badge";
import dayjs from "dayjs";
import { DisplayTrip } from "@/lib/types";

interface TripTableProps {
  onEdit: (trip: DisplayTrip) => void;
  onDelete: (id: string) => void;
  page: number;
  rowsPerPage: number;
  onPageChange: (page: number) => void;
}

export function TripTable({ onEdit, onDelete, page, rowsPerPage, onPageChange }: TripTableProps) {
  const { data, isLoading, error } = useTripsQuery(page, rowsPerPage);

  if (isLoading) {
    return <div className="py-20 text-center">Loading trips...</div>;
  }

  if (error) {
    return <div className="py-20 text-center text-red-500">Error loading trips: {error.message}</div>;
  }

  const { trips, count } = data || { trips: [], count: 0 };
  const pageCount = Math.ceil(count / rowsPerPage);

  return (
    <div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Client</TableHead>
              <TableHead>Vehicle</TableHead>
              <TableHead>Driver</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Time</TableHead>
              <TableHead>Service Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {trips.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="h-24 text-center">
                  No trips found.
                </TableCell>
              </TableRow>
            ) : (
              trips.map((trip) => (
                <TableRow key={trip.id}>
                  <TableCell className="font-medium">{trip.client_name}</TableCell>
                  <TableCell>{trip.vehicle_details}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        <img
                          src={trip.driver_avatar || "/placeholder.svg"}
                          alt={trip.driver_name}
                          className="aspect-square h-full w-full"
                        />
                      </Avatar>
                      <span>{trip.driver_name}</span>
                    </div>
                  </TableCell>
                  <TableCell>{dayjs(trip.date).format("MMM D, YYYY")}</TableCell>
                  <TableCell>{trip.time}</TableCell>
                  <TableCell>
                    <TripTypeBadge type={trip.service_type} />
                  </TableCell>
                  <TableCell>
                    <TripStatusBadge status={trip.status} />
                  </TableCell>
                  <TableCell>${trip.amount.toFixed(2)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onEdit(trip)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onDelete(trip.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {pageCount > 1 && (
        <div className="flex justify-center mt-4">
          <nav>
            <ul className="flex space-x-2">
              {Array.from({ length: pageCount }, (_, i) => i + 1).map((pageNum) => (
                <li key={pageNum}>
                  <Button
                    variant={pageNum === page ? "default" : "outline"}
                    size="sm"
                    onClick={() => onPageChange(pageNum)}
                  >
                    {pageNum}
                  </Button>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      )}
    </div>
  );
}
