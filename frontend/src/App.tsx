import { useEffect, useState } from "react";
import "./App.css";
import logo from "./logo.svg"; // Import the SVG

function App() {
  // State Management
  const [message, setMessage] = useState("");
  const [connected, setConnected] = useState(false);
  const [pipes, setPipes] = useState<
    { pipe_id: string; pressure: number; acoustic: number }[]
  >([]);
  const [leaks, setLeaks] = useState<string[]>([]);

  // Data Fetching
  useEffect(() => {
    fetch("http://localhost:8000/")
      .then((res) => res.json())
      .then((data) => {
        setMessage(data.message);
        setConnected(true);
      })
      .catch(() => {
        setMessage("Backend not reachable");
        setConnected(false);
      });

    fetch("http://localhost:8000/sensors")
      .then((res) => res.json())
      .then((data) => setPipes(data.pipes))
      .catch(() => setPipes([]));

    fetch("http://localhost:8000/leaks")
      .then((res) => res.json())
      .then((data) => setLeaks(data.leaks.map((pipe: any) => pipe.pipe_id)))
      .catch(() => setLeaks([]));
  }, []);

  return (
    <div className="aware-container">
      <header className="aware-header">
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.5em",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "1em",
            }}
          >
            <img src={logo} alt="AWARE Logo" width={60} height={60} />
            <h1 style={{ margin: 0, fontSize: "2.2em", letterSpacing: "2px" }}>
              A.W.A.R.E. Water Utility Dashboard
            </h1>
          </div>
          <h2
            style={{
              margin: "0.3em 0 0 0",
              fontWeight: 400,
              fontSize: "1.2em",
            }}
          >
            Backend Status:{" "}
            <span style={{ color: connected ? "limegreen" : "red" }}>
              {connected ? "Connected" : "Not Connected"}
            </span>
          </h2>
          <p
            style={{
              margin: "0.5em 0 0 0",
              fontSize: "1em",
              color: "#b2ebf2",
            }}
          >
            {message}
          </p>
        </div>
      </header>
      <main>
        <section>
          <div className="aware-card" style={{ marginBottom: "2em" }}>
            <h3
              style={{
                fontSize: "2em",
                marginBottom: "0.7em",
                color: "#00bfae",
                letterSpacing: "2px",
                fontWeight: 700,
                textShadow: "0 2px 8px #00968855",
                textTransform: "uppercase",
                textAlign: "center",
              }}
            >
              Pipe Status
            </h3>
          </div>
          <div className="aware-card aware-table-card">
            <table className="aware-table">
              <thead>
                <tr>
                  <th>Pipe ID</th>
                  <th>Pressure (psi)</th>
                  <th>Acoustic</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {pipes.map((pipe) => (
                  <tr key={pipe.pipe_id}>
                    <td>{pipe.pipe_id}</td>
                    <td>{pipe.pressure}</td>
                    <td>{pipe.acoustic}</td>
                    <td>
                      {leaks.includes(pipe.pipe_id) ? (
                        <span
                          title="Leak detected"
                          style={{ color: "#ff5252", fontSize: "1.5em" }}
                        >
                          🚨
                        </span>
                      ) : (
                        <span
                          title="Normal"
                          style={{ color: "#4caf50", fontSize: "1.5em" }}
                        >
                          ●
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="aware-card aware-info-card">
            <strong>Column Info:</strong>
            <ul>
              <li>
                <b>Pipe ID:</b> Unique identifier for each pipe in the network.
              </li>
              <li>
                <b>Pressure (psi):</b> Water pressure inside the pipe, measured
                in pounds per square inch.
                <br />
                <span style={{ color: "#4caf50" }}>
                  Normal: 60–100 psi
                </span>.{" "}
                <span style={{ color: "#ff5252" }}>
                  Low pressure (&lt;60 psi) may indicate a leak.
                </span>
              </li>
              <li>
                <b>Acoustic:</b> Sensor reading of sound/vibration in the pipe.
                <br />
                <span style={{ color: "#4caf50" }}>Normal: 0.0–0.7</span>.{" "}
                <span style={{ color: "#ff5252" }}>
                  High values (&gt;0.7) can signal abnormal activity or leaks.
                </span>
              </li>
              <li>
                <b>Status:</b> Shows if a leak is detected (
                <span style={{ color: "#ff5252" }}>🚨</span>) or if the pipe is
                normal (<span style={{ color: "#4caf50" }}>●</span>).
              </li>
            </ul>
          </div>
        </section>
        <section>
          <div className="aware-card aware-desc-card">
            <p>
              This dashboard shows real-time sensor data and leak status for
              your simulated water network.
              <br />
              Next: Add network actions!
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;
