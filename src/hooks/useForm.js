
import { useState } from "react";
 
export function useForm(initialValues) {
    // este useState es el "estado" del formulario, lo que el usuario va escribiendo
  const [form, setForm] = useState(initialValues);
    // este useState es para guardar errores de validación, ej: { username: "El nombre es obligatorio" }
  const [errors, setErrors] = useState({});
 
  // Maneja cualquier input con name y value, actualizando el estado del formulario
  const handleChange = (e) => {
    // Extrae el name y value del input que disparó el evento, target es el input, name es el nombre del campo (ej: "username") y value es lo que el usuario escribió
    const { name, value } = e.target;
    // Actualiza el estado del formulario con el nuevo valor, usando el name para saber qué campo actualizar. El ...prev es para mantener los valores anteriores y solo cambiar el campo que corresponde.
    setForm((prev) => ({ ...prev, [name]: value }));
    // Limpia el error del campo al empezar a escribir
    setErrors((prev) => ({ ...prev, [name]: null }));
  };
 
  // Para setear un error puntual desde afuera (ej: error del servidor en un campo)
  const setFieldError = (field, message) => {
    // Actualiza el estado de errores para el campo específico, manteniendo los errores anteriores. El [field] es una forma de usar una variable como clave en el objeto.
    setErrors((prev) => ({ ...prev, [field]: message }));
  };
 
  // Vuelve el formulario a los valores iniciales
  const resetForm = () => {
    // Resetea el estado del formulario a los valores iniciales que se pasaron al hook
    setForm(initialValues);
    // Limpia todos los errores
    setErrors({});
  };
 
  // Sobrescribe campos manualmente (útil para formulario de edición)
  // ej: fillForm({ username: "juan", email: "juan@mail.com" })
  const fillForm = (values) => {
    setForm((prev) => ({ ...prev, ...values }));
  };
 
  return {
    form,
    errors,
    setErrors,
    handleChange,
    setFieldError,
    resetForm,
    fillForm,
  };
}
 