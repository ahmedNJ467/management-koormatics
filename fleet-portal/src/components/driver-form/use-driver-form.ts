import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { supabase } from "@/integrations/supabase/client";
import type { Driver } from "@/lib/types";
import { driverSchema, type DriverFormValues } from "./types";

export function useDriverForm(driver?: Driver) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [airportIdFile, setAirportIdFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [documentName, setDocumentName] = useState<string | null>(null);
  const [airportIdName, setAirportIdName] = useState<string | null>(null);

  const form = useForm<DriverFormValues>({
    resolver: zodResolver(driverSchema),
    defaultValues: {
      name: "",
      contact: "",
      license_number: "",
      license_type: "",
      license_expiry: "",
      status: "active",
      is_vip: false,
    },
  });

  // Reset form when driver data changes
  React.useEffect(() => {
    if (driver) {
      form.reset({
        name: driver.name ?? "",
        contact: driver.contact ?? "",
        license_number: driver.license_number ?? "",
        license_type: driver.license_type ?? "",
        license_expiry: driver.license_expiry ?? "",
        status: driver.status ?? "active",
        is_vip: driver.is_vip ?? false,
      });
    }
  }, [driver, form]);

  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      const objectUrl = URL.createObjectURL(file);
      setAvatarPreview(objectUrl);
    }
  };

  const handleDocumentChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setDocumentFile(file);
      setDocumentName(file.name);
    }
  };

  const clearDocument = () => {
    setDocumentFile(null);
    setDocumentName(null);
  };

  const handleAirportIdChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      setAirportIdFile(file);
      setAirportIdName(file.name);
    }
  };

  const clearAirportId = () => {
    setAirportIdFile(null);
    setAirportIdName(null);
  };

  return {
    form,
    isSubmitting,
    setIsSubmitting,
    avatarFile,
    documentFile,
    airportIdFile,
    avatarPreview,
    setAvatarPreview,
    documentName,
    setDocumentName,
    airportIdName,
    setAirportIdName,
    handleAvatarChange,
    handleDocumentChange,
    clearDocument,
    handleAirportIdChange,
    clearAirportId,
  };
}
