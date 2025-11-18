import React from "react";
import { MessageCenter } from "@/components/communication/MessageCenter";

export default function Chat() {
  return (
    <div className="h-full w-full flex flex-col">
      {/* Header */}
      <div className="border-b bg-background px-6 py-4 flex-shrink-0">
        <h1 className="text-2xl font-semibold">Chat</h1>
      </div>

      {/* Message Center - Takes remaining space */}
      <div className="flex-1 min-h-0">
        <MessageCenter />
      </div>
    </div>
  );
}
