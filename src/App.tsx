import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Provider } from "react-redux";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { store } from "@/store/store";
import { AuthProvider } from "@/contexts/AuthContext";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import Login from "@/pages/auth/Login";
import Dashboard from "@/pages/Dashboard";
import UsersPage from "@/pages/users/Users";
import ProductsPage from "@/pages/Products";
import ServicesPage from "@/pages/services/Services";
import StoresPage from "@/pages/stores/Stores";
import BookingsPage from "@/pages/bookings/Bookings";
import PaymentsPage from "@/pages/Payments";
import PayoutsPage from "@/pages/Payouts";
import SubscriptionsPage from "@/pages/Subscriptions";
import {
  CategoriesPage,
  ReportsPage,
  ReviewsPage,
} from "@/pages/PlaceholderPages";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <Provider store={store}>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route element={<DashboardLayout />}>
                <Route path="/" element={<Dashboard />} />
                <Route path="/users" element={<UsersPage />} />
                <Route path="/products" element={<ProductsPage />} />
                <Route path="/services" element={<ServicesPage />} />
                <Route path="/stores" element={<StoresPage />} />
                <Route path="/bookings" element={<BookingsPage />} />
                <Route path="/payments" element={<PaymentsPage />} />
                <Route path="/payouts" element={<PayoutsPage />} />
                <Route path="/subscriptions" element={<SubscriptionsPage />} />
                <Route path="/categories" element={<CategoriesPage />} />
                <Route path="/reports" element={<ReportsPage />} />
                <Route path="/reviews" element={<ReviewsPage />} />
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </Provider>
);

export default App;
