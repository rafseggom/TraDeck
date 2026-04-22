import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Layout } from "./components/Layout";
import { ToastStack } from "./components/ToastStack";
import { AppProvider } from "./lib/app-context";
import { ColeccionPage } from "./pages/ColeccionPage";
import { CrearCartaPage } from "./pages/CrearCartaPage";
import { DocumentacionPage } from "./pages/DocumentacionPage";
import { HistorialPage } from "./pages/HistorialPage";
import { InicioPage } from "./pages/InicioPage";
import { MercadoPage } from "./pages/MercadoPage";

export default function App(): JSX.Element {
  return (
    <AppProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<InicioPage />} />
            <Route path="/coleccion" element={<ColeccionPage />} />
            <Route path="/crear" element={<CrearCartaPage />} />
            <Route path="/mercado" element={<MercadoPage />} />
            <Route path="/historial" element={<HistorialPage />} />
            <Route path="/documentacion" element={<DocumentacionPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <ToastStack />
      </BrowserRouter>
    </AppProvider>
  );
}
