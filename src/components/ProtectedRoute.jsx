import { Navigate } from "react-router-dom";

// roles (opcional): lista de roles que pueden entrar. Si no coincide, vuelve a /dashboard,
// que redirige al panel que le corresponde. El backend igual valida con @PreAuthorize.
// RUTA PROTEGIDA: decide si el usuario puede ver una pantalla.
export default function ProtectedRoute({ children, roles }) {
  // 1) Sin sesión (sin token) → al login
  if (!localStorage.getItem("token")) return <Navigate to="/login" replace />;

  // 2) Si tiene contraseña temporal → debe cambiarla primero
  if (localStorage.getItem("debeCambiarPassword") === "true") {
    return <Navigate to="/cambiar-password" replace />;
  }

  // 3) Si la ruta exige ciertos roles y el usuario no tiene uno de ellos → vuelve a su inicio
  const role = localStorage.getItem("role");
  if (roles && (!role || !roles.includes(role))) {
    return <Navigate to="/dashboard" replace />;
  }
  // Todo en orden: muestra la pantalla
  return children;
}