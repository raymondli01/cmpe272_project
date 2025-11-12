import { useEffect, useState } from "react";
import "./App.css";

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
        <h1>A.W.A.R.E. Water Utility Dashboard</h1>
        <h2>
          Backend Status:{" "}
          <span style={{ color: connected ? "limegreen" : "red" }}>
            {connected ? "Connected" : "Not Connected"}
          </span>
        </h2>
        <p>{message}</p>
      </header>
      <main>
        <section>
          <h3>Pipe Status</h3>
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
        </section>
        <section>
          <p>
            This dashboard shows real-time sensor data and leak status for your
            simulated water network.
            <br />
            Next: Add network actions!
          </p>
        </section>
      </main>
    </div>
  );
}

export default App;
