import React, { useEffect } from "react";
import logo from "@assets/img/logo.svg";

const App: React.FC = () => {
  useEffect(() => {
    console.log("content view loaded");
  }, []);
  console.log("content view loaded");

  return (
    <div className="content-view">
      content view
      <div>
        <img
          src={chrome.runtime.getURL(logo)}
          className="App-logo"
          alt="logo"
        />
      </div>
    </div>
  );
};

export default App;
