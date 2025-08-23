"use client"

import React from "react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Bell, AlertTriangle, Info, CheckCircle } from "lucide-react"

interface AlertItem {
  id: string
  type: "info" | "warning" | "error" | "success"
  title: string
  description: string
  timestamp: string
  priority: "low" | "medium" | "high"
}

const mockAlerts: AlertItem[] = [
  {
    id: "1",
    type: "warning",
    title: "Vehicle Maintenance Due",
    description: "Vehicle V001 requires scheduled maintenance within 3 days",
    timestamp: "2024-01-15T10:30:00Z",
    priority: "medium"
  },
  {
    id: "2",
    type: "info",
    title: "New Driver Assignment",
    description: "Driver John Doe has been assigned to Trip T001",
    timestamp: "2024-01-15T09:15:00Z",
    priority: "low"
  },
  {
    id: "3",
    type: "error",
    title: "Fuel Level Low",
    description: "Vehicle V002 fuel level is below 15%",
    timestamp: "2024-01-15T08:45:00Z",
    priority: "high"
  }
]

const getAlertIcon = (type: AlertItem["type"]) => {
  switch (type) {
    case "info":
      return <Info className="h-4 w-4" />
    case "warning":
      return <AlertTriangle className="h-4 w-4" />
    case "error":
      return <AlertTriangle className="h-4 w-4" />
    case "success":
      return <CheckCircle className="h-4 w-4" />
    default:
      return <Bell className="h-4 w-4" />
  }
}

const getPriorityColor = (priority: AlertItem["priority"]) => {
  switch (priority) {
    case "high":
      return "bg-red-100 text-red-800 border-red-200"
    case "medium":
      return "bg-yellow-100 text-yellow-800 border-yellow-200"
    case "low":
      return "bg-blue-100 text-blue-800 border-blue-200"
    default:
      return "bg-gray-100 text-gray-800 border-gray-200"
  }
}

export function ImprovedAlertsTab() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Recent Alerts
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {mockAlerts.map((alert) => (
          <Alert key={alert.id}>
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                {getAlertIcon(alert.type)}
                <div className="flex-1">
                  <AlertTitle className="text-sm font-medium">
                    {alert.title}
                  </AlertTitle>
                  <AlertDescription className="text-sm text-muted-foreground mt-1">
                    {alert.description}
                  </AlertDescription>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge 
                      variant="outline" 
                      className={getPriorityColor(alert.priority)}
                    >
                      {alert.priority}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {new Date(alert.timestamp).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
              <Button variant="ghost" size="sm">
                Dismiss
              </Button>
            </div>
          </Alert>
        ))}
        
        {mockAlerts.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No alerts at the moment</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
