
import { Outlet } from "react-router-dom";

export function AuthLayout() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Peace Business Group</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2">
            Transportation Management System
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
