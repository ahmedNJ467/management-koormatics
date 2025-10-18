
import { useState } from "react";
import { DisplayTrip } from "@/lib/types/trip";

export function useTripState() {
  // UI state
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [viewTrip, setViewTrip] = useState<DisplayTrip | null>(null);
  const [editTrip, setEditTrip] = useState<DisplayTrip | null>(null);
  const [bookingOpen, setBookingOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [messageOpen, setMessageOpen] = useState(false);
  const [tripToAssign, setTripToAssign] = useState<DisplayTrip | null>(null);
  const [tripToMessage, setTripToMessage] = useState<DisplayTrip | null>(null);
  const [assignDriver, setAssignDriver] = useState("");
  const [assignNote, setAssignNote] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [tripToDelete, setTripToDelete] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("details");
  const [calendarView, setCalendarView] = useState(false);

  return {
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    viewTrip,
    setViewTrip,
    editTrip,
    setEditTrip,
    bookingOpen,
    setBookingOpen,
    assignOpen,
    setAssignOpen,
    messageOpen,
    setMessageOpen,
    tripToAssign,
    setTripToAssign,
    tripToMessage,
    setTripToMessage,
    assignDriver,
    setAssignDriver,
    assignNote,
    setAssignNote,
    newMessage,
    setNewMessage,
    deleteDialogOpen,
    setDeleteDialogOpen,
    tripToDelete,
    setTripToDelete,
    activeTab,
    setActiveTab,
    calendarView,
    setCalendarView
  };
}
