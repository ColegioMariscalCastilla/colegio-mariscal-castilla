import { Router } from "express"
import { pool } from "../db"

const router = Router()

router.post("/", async (req, res) => {
  const { student_id, fecha, estado } = req.body

  await pool.query(
    "INSERT INTO attendance (student_id, fecha, estado) VALUES ($1,$2,$3)",
    [student_id, fecha, estado]
  )

  res.json({ message: "Asistencia guardada correctamente" })
})

router.get("/:student_id", async (req, res) => {
  const result = await pool.query(
    "SELECT * FROM attendance WHERE student_id=$1 ORDER BY fecha DESC",
    [req.params.student_id]
  )

  res.json(result.rows)
})

router.delete("/delete-all", async (req, res) => {
  try {
    const result = await pool.query("DELETE FROM attendance")
    res.json({ message: "Historial eliminado correctamente", deletedCount: result.rowCount })
  } catch (error) {
    console.error("Error al eliminar historial:", error)
    res.status(500).json({ error: "Error al eliminar el historial de asistencia" })
  }
})

router.delete("/student/:studentId/delete", async (req, res) => {
  try {
    const { studentId } = req.params
    
    // Primero eliminar los registros de tiempo de asistencia
    await pool.query(
      "DELETE FROM attendance_time WHERE attendance_id IN (SELECT id FROM attendance WHERE student_id = $1)",
      [studentId]
    )
    
    // Luego eliminar los registros de asistencia
    const result = await pool.query("DELETE FROM attendance WHERE student_id = $1", [studentId])
    
    res.json({ 
      message: "Historial del estudiante eliminado correctamente", 
      deletedCount: result.rowCount 
    })
  } catch (error) {
    console.error("Error al eliminar historial del estudiante:", error)
    res.status(500).json({ error: "Error al eliminar el historial del estudiante" })
  }
})

export default router