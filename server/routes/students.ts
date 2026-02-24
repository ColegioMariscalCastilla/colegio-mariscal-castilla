import { Router } from "express"
import { pool } from "../db"

const router = Router()

router.post("/", async (req, res) => {
  const { nombre, dni, classroom_id } = req.body

  await pool.query(
    "INSERT INTO students (nombre, dni, classroom_id) VALUES ($1,$2,$3)",
    [nombre, dni, classroom_id]
  )

  res.json({ message: "Alumno agregado correctamente" })
})

router.get("/", async (req, res) => {
  const result = await pool.query(
    "SELECT s.*, c.nombre AS aula FROM students s JOIN classrooms c ON s.classroom_id = c.id"
  )

  res.json(result.rows)
})

router.delete("/:id", async (req, res) => {
  await pool.query("DELETE FROM students WHERE id=$1", [req.params.id])
  res.json({ message: "Alumno eliminado" })
})

export default router