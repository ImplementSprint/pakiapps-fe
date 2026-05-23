import { createBrowserRouter } from 'react-router';
import { Home } from './pages/Home';
import { Login } from './pages/Login';
import { SignUp } from './pages/SignUp';
import { CustomerHome } from './pages/CustomerHome';
import { AdminHome } from './pages/AdminHome';
import { AdminProfile } from './pages/AdminProfile';
import { MyBookings } from './pages/MyBookings';
import { FindParking } from './pages/FindParking';
import { Payment } from './pages/Payment';
import { Profile } from './pages/Profile';
import { CustomerLayout } from './pages/CustomerLayout';
import { CustomerSettings } from './pages/CustomerSettings';
import { UnifiedBooking } from './pages/UnifiedBooking';
import { PrivacyPolicy } from './pages/PrivacyPolicy';
import { TermsOfUse } from './pages/TermsOfUse';
import { TellerHome } from './pages/TellerHome';

export const router = createBrowserRouter([
  // --- Public Routes ---
  { path: '/', element: <Home /> },
  { path: '/login', element: <Login /> },
  { path: '/signup', element: <SignUp /> },
  { path: '/privacy-policy', element: <PrivacyPolicy /> },
  { path: '/terms-of-use', element: <TermsOfUse /> },

  // --- Customer Protected Routes (WITH NAVBAR) ---
  {
    element: <CustomerLayout />,
    children: [
      { path: '/customer/home', element: <CustomerHome /> },
      { path: '/customer/bookings', element: <MyBookings /> },
      { path: '/customer/find-parking', element: <FindParking /> },
      { path: '/customer/payment', element: <Payment /> },
      { path: '/customer/profile', element: <Profile /> },
      { path: '/customer/settings', element: <CustomerSettings /> },
    ],
  },

  // --- Customer Protected Routes (WITHOUT NAVBAR) ---
  { path: '/customer/booking/reserve', element: <UnifiedBooking /> },

  // --- Admin Routes ---
  { path: '/admin/home', element: <AdminHome /> },
  { path: '/admin/profile', element: <AdminProfile /> },

  // --- Teller Routes ---
  { path: '/teller/home', element: <TellerHome /> },
]);
