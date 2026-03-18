-- Agregar campo email a la tabla students
ALTER TABLE students ADD COLUMN email TEXT NOT NULL DEFAULT '';

-- Nota: Este comando agrega el campo email a la tabla students.
-- Después de ejecutar esta migración, los alumnos existentes tendrán email vacío.
-- Deberás actualizar manualmente los emails de los alumnos existentes a través de la interfaz.
