import { Navigate } from "react-router-dom";

// roles (opcional): lista de roles que pueden entrar. Si no coincide, vuelve a /dashboard,
// que redirige al panel que le corresponde. El backend igual valida con @PreAuthorize.
export default function ProtectedRoute({ children, roles }) {
  if (!localStorage.getItem("token")) return <Navigate to="/login" replace />;

  if (localStorage.getItem("debeCambiarPassword") === "true") {
    return <Navigate to="/cambiar-password" replace />;
  }

  const role = localStorage.getItem("role");
  if (roles && (!role || !roles.includes(role))) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
}