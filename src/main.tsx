import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

console.log("Main.tsx está sendo executado");

const rootElement = document.getElementById("root");
console.log("Root element:", rootElement);

if (rootElement) {
  try {
    console.log("Tentando renderizar App...");
    createRoot(rootElement).render(
      <StrictMode>
        <App />
      </StrictMode>,
    );
    console.log("App renderizado com sucesso!");
  } catch (error) {
    console.error("Erro ao renderizar App:", error);
  }
} else {
  console.error("Elemento root não encontrado!");
}