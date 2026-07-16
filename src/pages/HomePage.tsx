import App from '../App';
import { trackTestEvent } from "../lib/analytics";
export default function HomePage() {
  <button
  onClick={() => trackTestEvent()}
  style={{
    padding: "10px 20px",
    background: "#7c3aed",
    color: "white",
    borderRadius: "8px",
    margin: "20px",
  }}
>
  Test GA4 Event
</button>
  return <App />;
}