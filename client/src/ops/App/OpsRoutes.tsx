import { Provider } from "react-redux";
import { Routes, Route } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import { opsStore } from "../store/opsStore";

import AuthLayout from "../components/AuthLayout/AuthLayout";
import Home from "../pages/Home/Home";
import Login from "../pages/Login/Login";
import VerifyOtp from "../pages/VerifyOtp/VerifyOtp";
import OpsDashboard from "../pages/Dashboard/OpsDashboard";

const OpsRoutes = () => {
  return (
    <Provider store={opsStore}>
      <ToastContainer
        position="top-right"
        autoClose={3000}
        theme="dark"
        pauseOnHover
        newestOnTop
      />

      <Routes>
        <Route element={<AuthLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/verify-otp" element={<VerifyOtp />} />
        </Route>

        <Route path="/dashboard" element={<OpsDashboard />} />
      </Routes>
    </Provider>
  );
};

export default OpsRoutes;