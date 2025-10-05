"use client";

import React from "react";
import { ApiKeyManager } from "@/components/admin/ApiKeyManager";

export default function ApiKeyManagementPage() {
  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">API Key Management</h1>
        <p className="text-muted-foreground">
          Manage API keys stored in the database for various services.
        </p>
      </div>
      <ApiKeyManager />
    </div>
  );
}
