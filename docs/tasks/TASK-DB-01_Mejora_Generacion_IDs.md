# Documentación: TASK-DB-01 - Mejora del Sistema de Generación de IDs

**Fecha de Finalización:** 2023-10-27
**Autor:** Asistente de IA
**Estado:** Finalizado

## 1. Objetivo

El objetivo de esta tarea era refactorizar el sistema de generación de nuevos IDs para los elementos de la base de datos (como programadores, módulos, etc.). El sistema anterior dependía de una colección separada (`counters`) que actuaba como un punto único de fallo y podía desincronizarse con los datos reales.

Esta mejora hace que el sistema sea más **robusto, resiliente y simple**, eliminando la necesidad de la colección `counters` y basando la generación del nuevo ID en el valor más alto existente dentro de la propia colección de datos.

## 2. Enfoque Técnico

- **Componentes Creados/Modificados:**
  - `utils/firestore.ts`: Fue el único fichero modificado. La lógica de generación de IDs está centralizada aquí.

- **Lógica Clave:**
  - Se reescribió por completo la función `getNextId(collectionName)`.
  - La nueva lógica consulta la colección especificada, obtiene todos los documentos y recorre sus IDs.
  - Convierte los IDs (que son `string`) a `number` y encuentra el valor máximo.
  - Si la colección está vacía, devuelve `1`. En caso contrario, devuelve `maxId + 1`.
  - Se eliminó la constante `COUNTERS` del objeto `COLLECTIONS`, ya que la colección ya no se utiliza.
  - Se eliminó la lógica de actualización de contadores de la función `seedSuggestions`.

- **Cambios en el Modelo de Datos:**
  - La colección `counters` en Firestore ha quedado obsoleta y puede ser eliminada. El esquema de la base de datos se ha simplificado.

## 3. Cambios Visibles para el Usuario

No hay cambios visuales directos para el usuario final. La aplicación se comporta exactamente igual desde su perspectiva.

El principal beneficio es interno:
- **Mayor estabilidad:** La aplicación ya no fallará si la colección de contadores se elimina o corrompe.
- **Consistencia de datos garantizada:** El nuevo ID siempre estará correctamente secuenciado según los datos existentes.

## 4. Cómo Probar

1.  Ve a la vista **"Gestión DB"**.
2.  Selecciona una categoría, por ejemplo, "Programadores".
3.  Añade un nuevo programador. Verifica que se le asigna un ID numérico que es `+1` sobre el ID más alto que existía en la lista.
4.  Elimina al programador con el ID más alto.
5.  Añade otro nuevo programador. Verifica que el nuevo ID es `+1` sobre el **nuevo** ID más alto de la lista, demostrando que el sistema se basa en los datos actuales.
6.  (Opcional) Elimina todos los elementos de una categoría y añade uno nuevo. Debería asignársele el ID `1`.
