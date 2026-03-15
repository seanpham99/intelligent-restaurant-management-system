import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { CustomerMenuPage } from './pages/CustomerMenuPage';
import { KitchenDisplayPage } from './pages/KitchenDisplayPage';
import { ManagerDashboardPage } from './pages/ManagerDashboardPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<CustomerMenuPage />} />
          <Route path="/kds" element={<KitchenDisplayPage />} />
          <Route path="/dashboard" element={<ManagerDashboardPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
