import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { seedData } from "./utils/seed-data";

// Seed data for development
if (import.meta.env.DEV) {
  seedData();
}

createRoot(document.getElementById("root")!).render(<App />);
