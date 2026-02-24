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

export default router