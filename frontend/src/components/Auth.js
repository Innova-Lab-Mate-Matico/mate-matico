import React, { useState } from "react";
import "./Auth.css";

import Login from "./Login";
import Register from "./Register";
import RecoverPassword from "./RecoverPassword";

export default function Auth(props) {
  const [view, setView] = useState("login");
  // "login" | "register" | "recover"

  return (
    <div className="auth-container">
      <div className="auth-card">

        {/* LOGIN */}
        {view === "login" && (
          <Login
            {...props}
            onSwitchMode={() => setView("register")}
            onSwitchRecover={() => setView("recover")}
          />
        )}

        {/* REGISTER */}
        {view === "register" && (
          <Register
            {...props}
            onSwitchMode={() => setView("login")}
          />
        )}

        {/* RECOVER */}
        {view === "recover" && (
          <RecoverPassword
            {...props}
            onSwitchMode={() => setView("login")}
          />
        )}

      </div>
    </div>
  );
}