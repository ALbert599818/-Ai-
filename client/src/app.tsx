import { Route, Routes } from 'react-router-dom';

import { AuthProvider } from './contexts/AuthContext';
import Layout from './components/Layout';
import LoginPage from './pages/Login/Login';
import ProtectedRoute from './components/ProtectedRoute';
import NotFound from './pages/NotFound/NotFound';
import Unauthorized from './pages/Unauthorized/Unauthorized';
import QuotationEngine from './pages/QuotationEngine/QuotationEngine';
import PriceSensitivity from './pages/PriceSensitivity/PriceSensitivity';
import CreditTerm from './pages/CreditTerm/CreditTerm';
import CustomerLevel from './pages/CustomerLevel/CustomerLevel';
import PurchaseQuantity from './pages/PurchaseQuantity/PurchaseQuantity';
import LogisticsCost from './pages/LogisticsCost/LogisticsCost';
import OtherDiscount from './pages/OtherDiscount/OtherDiscount';
import Product from './pages/Product/Product';
import ProductGradeMargin from './pages/ProductGradeMargin/ProductGradeMargin';
import Customer from './pages/Customer/Customer';
import ChannelType from './pages/ChannelType/ChannelType';
import TaxRate from './pages/TaxRate/TaxRate';
import AlertThreshold from './pages/AlertThreshold/AlertThreshold';
import CustomFeeConfig from './pages/CustomFeeConfig/CustomFeeConfig';
import MarginOld from './pages/MarginOld/MarginOld';
import QuotationList from './pages/QuotationList/QuotationList';
import QuotationDetail from './pages/QuotationDetail/QuotationDetail';
import Dashboard from './pages/Dashboard/Dashboard';
import UserManagement from './pages/UserManagement/UserManagement';
import MyCenter from './pages/MyCenter/MyCenter';
import PricingFormulaConfig from './pages/PricingFormulaConfig/PricingFormulaConfig';
import ExcessMarketing from './pages/ExcessMarketing/ExcessMarketing';
import AfterSalesReserve from './pages/AfterSalesReserve/AfterSalesReserve';
import InsuranceCoefficient from './pages/InsuranceCoefficient/InsuranceCoefficient';
import ExchangeRiskRate from './pages/ExchangeRiskRate/ExchangeRiskRate';

const RoutesComponent = () => {
  return (
    <AuthProvider>
      <Routes>
        <Route path="login" element={<LoginPage />} />
        <Route element={<Layout />}>
          <Route
          index
          element={(
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          )}
        />
        <Route
          path="quotation-engine"
          element={(
            <ProtectedRoute requiredRoles={['quotation_editor', 'admin', 'super_admin']}>
              <QuotationEngine />
            </ProtectedRoute>
          )}
        />
        <Route
          path="price-sensitivity"
          element={(
            <ProtectedRoute requiredRoles={['admin', 'super_admin']}>
              <PriceSensitivity />
            </ProtectedRoute>
          )}
        />
        <Route
          path="credit-terms"
          element={(
            <ProtectedRoute requiredRoles={['admin', 'super_admin']}>
              <CreditTerm />
            </ProtectedRoute>
          )}
        />
        <Route
          path="customer-level"
          element={(
            <ProtectedRoute requiredRoles={['admin', 'super_admin']}>
              <CustomerLevel />
            </ProtectedRoute>
          )}
        />
        <Route
          path="purchase-quantity"
          element={(
            <ProtectedRoute requiredRoles={['admin', 'super_admin']}>
              <PurchaseQuantity />
            </ProtectedRoute>
          )}
        />
        <Route
          path="logistics-cost"
          element={(
            <ProtectedRoute requiredRoles={['admin', 'super_admin']}>
              <LogisticsCost />
            </ProtectedRoute>
          )}
        />
        <Route
          path="other-discounts"
          element={(
            <ProtectedRoute requiredRoles={['admin', 'super_admin']}>
              <OtherDiscount />
            </ProtectedRoute>
          )}
        />
        <Route
          path="product"
          element={(
            <ProtectedRoute requiredRoles={['admin', 'super_admin']}>
              <Product />
            </ProtectedRoute>
          )}
        />
        <Route
          path="product-grade-margin"
          element={(
            <ProtectedRoute requiredRoles={['admin', 'super_admin']}>
              <ProductGradeMargin />
            </ProtectedRoute>
          )}
        />
        <Route path="customers" element={<ProtectedRoute requiredRoles={['admin', 'super_admin']}><Customer /></ProtectedRoute>} />
        <Route path="channel-types" element={<ProtectedRoute requiredRoles={['admin', 'super_admin']}><ChannelType /></ProtectedRoute>} />
        <Route path="tax-rate" element={<ProtectedRoute requiredRoles={['admin', 'super_admin']}><TaxRate /></ProtectedRoute>} />
        <Route path="alert-threshold" element={<ProtectedRoute requiredRoles={['admin', 'super_admin']}><AlertThreshold /></ProtectedRoute>} />
        <Route path="custom-fees" element={<ProtectedRoute requiredRoles={['admin', 'super_admin']}><CustomFeeConfig /></ProtectedRoute>} />
        <Route path="margin-old" element={<ProtectedRoute requiredRoles={['admin', 'super_admin']}><MarginOld /></ProtectedRoute>} />
        <Route path="excess-marketing" element={<ProtectedRoute requiredRoles={['admin', 'super_admin']}><ExcessMarketing /></ProtectedRoute>} />
        <Route path="after-sales-reserve" element={<ProtectedRoute requiredRoles={['admin', 'super_admin']}><AfterSalesReserve /></ProtectedRoute>} />
        <Route path="insurance-coefficients" element={<ProtectedRoute requiredRoles={['admin', 'super_admin']}><InsuranceCoefficient /></ProtectedRoute>} />
        <Route path="exchange-risk-rate" element={<ProtectedRoute requiredRoles={['admin', 'super_admin']}><ExchangeRiskRate /></ProtectedRoute>} />
        <Route path="quotations" element={<ProtectedRoute><QuotationList /></ProtectedRoute>} />
        <Route path="quotations/:id" element={<ProtectedRoute><QuotationDetail /></ProtectedRoute>} />
        <Route path="user-management" element={<ProtectedRoute requiredRoles={['super_admin']}><UserManagement /></ProtectedRoute>} />
        <Route path="my-center" element={<ProtectedRoute><MyCenter /></ProtectedRoute>} />
        <Route path="pricing-formula-config" element={<ProtectedRoute requiredRoles={['super_admin']}><PricingFormulaConfig /></ProtectedRoute>} />
      </Route>
      <Route path="unauthorized" element={<Unauthorized />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
    </AuthProvider>
  );
};

export default RoutesComponent;
