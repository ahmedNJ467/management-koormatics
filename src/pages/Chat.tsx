import React from "react";
import { MessageCenter } from "@/components/communication/MessageCenter";

export default function Chat() {
  return (
    <div className="h-full bg-background flex flex-col">
      {/* Header */}
      <div className="border-b border-border pb-4 pt-4 px-6 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Chat</h1>
          </div>
        </div>
      </div>

      {/* Message Center - Takes remaining space */}
      <div className="flex-1 overflow-hidden">
        <MessageCenter />
      </div>
    </div>
  );
}
