
import { Outlet } from "react-router-dom";

export function AuthLayout() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-gray-900 to-gray-800 p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white">Peace Business Group</h1>
          <p className="text-gray-400 mt-2 text-lg">
            Transportation Management System
          </p>
        </div>
        <Outlet />
        <div className="text-center mt-8">
          <p className="text-gray-500 text-sm">
            &copy; {new Date().getFullYear()} Peace Business Group. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
