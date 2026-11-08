import AppLayout from "../../components/AppLayout";

// El layout del Administrador ahora es el layout común; el menú se filtra por rol.
export default function AdminLayout(props) {
  return <AppLayout {...props} />;
}
