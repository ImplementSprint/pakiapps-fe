import { useNavigate } from "../lib/router";
import { Truck, ParkingCircle, Shield, TrendingUp, MapPin, Clock } from "lucide-react";

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 text-gray-900">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-black text-purple-900">PakiAdmin</h1>
          <button
            onClick={() => navigate("/")}
            className="bg-purple-900 text-white px-6 py-2 rounded-lg font-bold hover:bg-purple-800 transition-colors"
          >
            Admin Login
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-6 py-20 text-center">
        <h2 className="text-5xl font-black text-gray-900 mb-6">
          Unified Admin Platform
        </h2>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-12">
          Centralized management portal for PakiShip logistics operations and PakiPark parking solutions across Metro Manila.
        </p>
      </section>

      {/* Applications */}
      <section className="max-w-7xl mx-auto px-6 py-16 grid md:grid-cols-2 gap-8">
        {/* PakiShip */}
        <div className="bg-white rounded-3xl p-8 shadow-lg border border-gray-200">
          <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mb-6">
            <Truck className="w-8 h-8 text-blue-600" />
          </div>
          <h3 className="text-3xl font-black text-gray-900 mb-4">PakiShip</h3>
          <p className="text-gray-600 mb-6">
            Real-time logistics and delivery management platform with fleet tracking, shipment monitoring, and analytics dashboard.
          </p>
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-sm text-gray-700">
              <MapPin className="w-5 h-5 text-blue-600" />
              <span>Live tracking and route optimization</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-gray-700">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              <span>KPI-focused analytics dashboard</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-gray-700">
              <Clock className="w-5 h-5 text-blue-600" />
              <span>On-time delivery monitoring</span>
            </div>
          </div>
        </div>

        {/* PakiPark */}
        <div className="bg-white rounded-3xl p-8 shadow-lg border border-gray-200">
          <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mb-6">
            <ParkingCircle className="w-8 h-8 text-green-600" />
          </div>
          <h3 className="text-3xl font-black text-gray-900 mb-4">PakiPark</h3>
          <p className="text-gray-600 mb-6">
            Smart parking management system with real-time availability, reservation handling, and location management.
          </p>
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-sm text-gray-700">
              <MapPin className="w-5 h-5 text-green-600" />
              <span>Multi-location parking management</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-gray-700">
              <TrendingUp className="w-5 h-5 text-green-600" />
              <span>Occupancy and revenue reports</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-gray-700">
              <Clock className="w-5 h-5 text-green-600" />
              <span>Real-time slot availability</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-7xl mx-auto px-6 py-16">
        <h3 className="text-3xl font-black text-gray-900 text-center mb-12">
          Platform Features
        </h3>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Shield className="w-6 h-6 text-purple-600" />
            </div>
            <h4 className="font-bold text-lg mb-2">Secure Access</h4>
            <p className="text-gray-600 text-sm">
              Multi-factor authentication and role-based access control for all admin operations.
            </p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-4">
              <TrendingUp className="w-6 h-6 text-purple-600" />
            </div>
            <h4 className="font-bold text-lg mb-2">Real-time Analytics</h4>
            <p className="text-gray-600 text-sm">
              Live KPI dashboards with actionable insights for operational efficiency.
            </p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-4">
              <MapPin className="w-6 h-6 text-purple-600" />
            </div>
            <h4 className="font-bold text-lg mb-2">NCR Coverage</h4>
            <p className="text-gray-600 text-sm">
              Comprehensive service coverage across Metro Manila and surrounding areas.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 mt-20">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <p className="text-gray-400">
            © 2026 PakiAdmin. Unified management for PakiShip and PakiPark.
          </p>
        </div>
      </footer>
    </div>
  );
}
