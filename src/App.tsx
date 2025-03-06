import { useState, useEffect } from "react";
import { useLocation, Routes, Route, useNavigate } from "react-router-dom";
import { MainLayout } from "@/layouts/MainLayout";
import { AuthLayout } from "@/layouts/AuthLayout";
import { useAuth } from "@/hooks/use-auth";
import { ScrollToTop } from "@/components/scroll-to-top";
import {
  Home,
  Login,
  Register,
  ForgotPassword,
  ResetPassword,
  Vehicles,
  Drivers,
  Clients,
  Alerts,
  Reports,
  Settings,
  Trips,
} from "@/pages";
import TripAnalytics from "./pages/TripAnalytics";

const App = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to /login if not authenticated and not already on an auth page
    const publicPages = ['/login', '/register', '/forgot-password', '/reset-password'];
    const authRequired = !publicPages.includes(location.pathname);

    if (isLoading) {
      // Do nothing while loading
      return;
    }

    if (!isAuthenticated && authRequired) {
      navigate('/login');
    }
  }, [isAuthenticated, location, navigate, isLoading]);

  // Define routes accessible to both authenticated and unauthenticated users
  const routes = [
    {
      path: "/login",
      element: <Login />,
    },
    {
      path: "/register",
      element: <Register />,
    },
    {
      path: "/forgot-password",
      element: <ForgotPassword />,
    },
    {
      path: "/reset-password",
      element: <ResetPassword />,
    },
    {
      path: "/",
      element: <Home />,
    },
    {
      path: "/vehicles",
      element: <Vehicles />,
    },
    {
      path: "/drivers",
      element: <Drivers />,
    },
    {
      path: "/clients",
      element: <Clients />,
    },
    {
      path: "/alerts",
      element: <Alerts />,
    },
    {
      path: "/reports",
      element: <Reports />,
    },
    {
      path: "/settings",
      element: <Settings />,
    },
    {
      path: "/trips",
      element: <Trips />,
    },
    {
      path: "/trip-analytics",
      element: <TripAnalytics />,
    },
  ];

  return (
    <>
      <ScrollToTop />
      <Routes>
        {/* Auth Layout */}
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
        </Route>

        {/* Main Layout */}
        <Route
          element={
            <MainLayout
              sidebarOpen={isSidebarOpen}
              setSidebarOpen={setIsSidebarOpen}
            />
          }
        >
          {routes.map((route, index) => {
            // Skip auth routes as they are already defined in AuthLayout
            if (["/login", "/register", "/forgot-password", "/reset-password"].includes(route.path)) {
              return null;
            }

            return (
              <Route
                key={index}
                path={route.path}
                element={route.element}
              />
            );
          })}
        </Route>
      </Routes>
    </>
  );
};

export default App;
