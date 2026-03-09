import ReactDOM from "react-dom/client";
import { Toaster } from "react-hot-toast";
import { Provider } from "react-redux";
import { store } from "./store/store";

import App from "./App";

import "./global.css";

ReactDOM.createRoot(
  document.getElementById("root")!
).render(
  <Provider store={store}>
    <>
      <App />
      <Toaster position="top-right" />
    </>
  </Provider>
);