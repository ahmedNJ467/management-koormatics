"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { ApiKeyService, ApiKey } from "@/lib/services/api-key-service";
import { toast } from "sonner";

export function ApiKeyManager() {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [newKeyName, setNewKeyName] = useState("");
  const [newKeyValue, setNewKeyValue] = useState("");
  const [newKeyPermissions, setNewKeyPermissions] = useState<string[]>([]);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    loadApiKeys();
  }, []);

  const loadApiKeys = async () => {
    try {
      setLoading(true);
      const keys = await ApiKeyService.getAllApiKeys();
      setApiKeys(keys);
    } catch (error) {
      console.error("Error loading API keys:", error);
      toast.error("Failed to load API keys");
    } finally {
      setLoading(false);
    }
  };

  const createApiKey = async () => {
    if (!newKeyName || !newKeyValue) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      setIsCreating(true);
      const newKey = await ApiKeyService.createApiKey(
        newKeyName,
        newKeyValue,
        newKeyPermissions
      );

      if (newKey) {
        toast.success("API key created successfully");
        setNewKeyName("");
        setNewKeyValue("");
        setNewKeyPermissions([]);
        loadApiKeys();
      } else {
        toast.error("Failed to create API key");
      }
    } catch (error) {
      console.error("Error creating API key:", error);
      toast.error("Failed to create API key");
    } finally {
      setIsCreating(false);
    }
  };

  const toggleApiKeyStatus = async (id: string, isActive: boolean) => {
    try {
      const updated = await ApiKeyService.updateApiKey(id, { is_active: !isActive });
      if (updated) {
        toast.success(`API key ${!isActive ? "activated" : "deactivated"}`);
        loadApiKeys();
      } else {
        toast.error("Failed to update API key");
      }
    } catch (error) {
      console.error("Error updating API key:", error);
      toast.error("Failed to update API key");
    }
  };

  const deleteApiKey = async (id: string) => {
    if (!confirm("Are you sure you want to delete this API key?")) {
      return;
    }

    try {
      const success = await ApiKeyService.deleteApiKey(id);
      if (success) {
        toast.success("API key deleted successfully");
        loadApiKeys();
      } else {
        toast.error("Failed to delete API key");
      }
    } catch (error) {
      console.error("Error deleting API key:", error);
      toast.error("Failed to delete API key");
    }
  };

  const insertGoogleMapsKey = async () => {
    try {
      setIsCreating(true);
      const newKey = await ApiKeyService.createApiKey(
        "google_maps",
        "AIzaSyB6wCOi9B8kcTLiwrE7KjV93882exWNKAY",
        ["maps", "geocoding", "places", "routing"]
      );

      if (newKey) {
        toast.success("Google Maps API key inserted successfully");
        loadApiKeys();
      } else {
        toast.error("Failed to insert Google Maps API key");
      }
    } catch (error) {
      console.error("Error inserting Google Maps API key:", error);
      toast.error("Failed to insert Google Maps API key");
    } finally {
      setIsCreating(false);
    }
  };

  if (loading) {
    return <div className="p-4">Loading API keys...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>API Key Manager</CardTitle>
          <CardDescription>
            Manage API keys stored in the database. These keys are used by the application
            for various services like Google Maps.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Quick Actions */}
          <div className="flex gap-2">
            <Button onClick={insertGoogleMapsKey} disabled={isCreating}>
              {isCreating ? "Inserting..." : "Insert Google Maps Key"}
            </Button>
            <Button variant="outline" onClick={loadApiKeys}>
              Refresh
            </Button>
          </div>

          {/* Create New API Key */}
          <div className="border-t pt-4">
            <h3 className="text-lg font-semibold mb-4">Create New API Key</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="keyName">Name</Label>
                <Input
                  id="keyName"
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  placeholder="e.g., google_maps"
                />
              </div>
              <div>
                <Label htmlFor="keyValue">Key Value</Label>
                <Input
                  id="keyValue"
                  value={newKeyValue}
                  onChange={(e) => setNewKeyValue(e.target.value)}
                  placeholder="Enter API key value"
                />
              </div>
            </div>
            <div className="mt-4">
              <Button onClick={createApiKey} disabled={isCreating || !newKeyName || !newKeyValue}>
                {isCreating ? "Creating..." : "Create API Key"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* API Keys List */}
      <Card>
        <CardHeader>
          <CardTitle>Existing API Keys</CardTitle>
          <CardDescription>
            {apiKeys.length} API key(s) found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {apiKeys.length === 0 ? (
            <p className="text-muted-foreground">No API keys found. Create one above.</p>
          ) : (
            <div className="space-y-4">
              {apiKeys.map((key) => (
                <div key={key.id} className="border rounded-lg p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold">{key.name}</h4>
                      <Badge variant={key.is_active ? "default" : "secondary"}>
                        {key.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={key.is_active}
                        onCheckedChange={() => toggleApiKeyStatus(key.id, key.is_active)}
                      />
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => deleteApiKey(key.id)}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    <p>Key: {key.key_value.substring(0, 20)}...</p>
                    <p>Permissions: {key.permissions.join(", ")}</p>
                    <p>Created: {new Date(key.created_at).toLocaleDateString()}</p>
                    {key.expires_at && (
                      <p>Expires: {new Date(key.expires_at).toLocaleDateString()}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
