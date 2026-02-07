import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Provider } from "react-redux";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { store } from "@/store/store";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
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
import TransactionsPage from "@/pages/Transactions";
import { CategoriesLayout, CategoriesIndex } from "@/components/layout/CategoriesLayout";
import MarketplaceCategoriesPage from "@/pages/categories/MarketplaceCategories";
import InspirationCategoriesPage from "@/pages/categories/InspirationCategories";
import SubscriptionPlansPage from "@/pages/categories/SubscriptionPlans";
import ReportsPage from "@/pages/Reports";
import RecommendedProvidersPage from "@/pages/RecommendedProviders";
import GlitFinderPage from "@/pages/GlitFinder";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <Provider store={store}>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <ThemeProvider>
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
                <Route path="/transactions" element={<TransactionsPage />} />
                <Route path="/categories" element={<CategoriesLayout />}>
                  <Route index element={<CategoriesIndex />} />
                  <Route path="marketplace" element={<MarketplaceCategoriesPage />} />
                  <Route path="inspiration" element={<InspirationCategoriesPage />} />
                  <Route path="subscription-plans" element={<SubscriptionPlansPage />} />
                </Route>
                <Route path="/reports" element={<ReportsPage />} />
                <Route path="/recommended-providers" element={<RecommendedProvidersPage />} />
                <Route path="/glitfinder" element={<GlitFinderPage />} />
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
          </ThemeProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </Provider>
);

export default App;
