
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Car, Users, Calendar, MapPin, BarChart3, Shield, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";

export default function Index() {
  const features = [
    {
      icon: Car,
      title: "Fleet Management",
      description: "Comprehensive vehicle tracking, maintenance scheduling, and performance monitoring"
    },
    {
      icon: Users,
      title: "Driver Management",
      description: "Driver profiles, scheduling, performance tracking, and document management"
    },
    {
      icon: Calendar,
      title: "Trip Scheduling",
      description: "Efficient trip planning, booking management, and route optimization"
    },
    {
      icon: MapPin,
      title: "Real-time Tracking",
      description: "Live GPS tracking, route monitoring, and automated status updates"
    },
    {
      icon: BarChart3,
      title: "Analytics & Reports",
      description: "Detailed insights, performance metrics, and customizable reporting"
    },
    {
      icon: Shield,
      title: "Client Portal",
      description: "Self-service booking, trip history, and real-time tracking for clients"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm dark:bg-gray-900/80">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Car className="h-8 w-8 text-blue-600" />
              <span className="text-2xl font-bold text-gray-900 dark:text-white">FleetManager</span>
            </div>
            <div className="flex gap-4">
              <Link to="/client-portal">
                <Button variant="outline" className="flex items-center gap-2">
                  <ExternalLink className="h-4 w-4" />
                  Client Portal
                </Button>
              </Link>
              <Link to="/dashboard">
                <Button>Admin Dashboard</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-6">
            Complete Fleet Management Solution
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
            Streamline your fleet operations with our comprehensive management platform. 
            Track vehicles, manage drivers, schedule trips, and provide exceptional service to your clients.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link to="/dashboard">
              <Button size="lg" className="text-lg px-8">
                Get Started
              </Button>
            </Link>
            <Link to="/client-portal">
              <Button size="lg" variant="outline" className="text-lg px-8 flex items-center gap-2">
                <ExternalLink className="h-5 w-5" />
                Client Portal
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Everything You Need to Manage Your Fleet
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Powerful features designed to optimize your fleet operations and improve customer satisfaction
          </p>
        </div>
        
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => (
            <Card key={index} className="transition-transform hover:scale-105">
              <CardHeader>
                <feature.icon className="h-12 w-12 text-blue-600 mb-4" />
                <CardTitle>{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  {feature.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Client Portal Section */}
      <section className="bg-white/50 dark:bg-gray-800/50 py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
              Client Portal - Self-Service Experience
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
              Empower your clients with a dedicated portal for booking trips, tracking progress, 
              accessing invoices, and providing feedback.
            </p>
            
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
              <div className="text-center">
                <Calendar className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                <h3 className="font-semibold">Self-Service Booking</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Quick and easy trip scheduling</p>
              </div>
              <div className="text-center">
                <MapPin className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                <h3 className="font-semibold">Real-Time Tracking</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Live trip status and location</p>
              </div>
              <div className="text-center">
                <BarChart3 className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                <h3 className="font-semibold">Trip History</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Complete booking records</p>
              </div>
              <div className="text-center">
                <Shield className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                <h3 className="font-semibold">Invoice Access</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Billing and payment history</p>
              </div>
            </div>
            
            <Link to="/client-portal">
              <Button size="lg" className="text-lg px-8 flex items-center gap-2 mx-auto">
                <ExternalLink className="h-5 w-5" />
                Access Client Portal
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-white/80 backdrop-blur-sm dark:bg-gray-900/80 py-8">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Car className="h-6 w-6 text-blue-600" />
            <span className="text-xl font-bold text-gray-900 dark:text-white">FleetManager</span>
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            © 2024 FleetManager. Streamlining fleet operations worldwide.
          </p>
        </div>
      </footer>
    </div>
  );
}
