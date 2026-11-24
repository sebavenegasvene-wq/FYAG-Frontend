import AppLayout from "../../components/AppLayout";

// El layout del Administrador ahora es el layout común; el menú se filtra por rol.
// Usa el layout común (AppLayout); el menú se filtra según el rol
export default function AdminLayout(props) {
  return <AppLayout {...props} />;
}
