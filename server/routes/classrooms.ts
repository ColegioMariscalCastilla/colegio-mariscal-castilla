import { Router } from "express"
import { pool } from "../db"

const router = Router()

router.post("/", async (req, res) => {
  const { nombre, turno } = req.body

  await pool.query(
    "INSERT INTO classrooms (nombre, turno) VALUES ($1,$2)",
    [nombre, turno]
  )

  res.json({ message: "Aula creada" })
})

router.get("/", async (req, res) => {
  const result = await pool.query("SELECT * FROM classrooms")
  res.json(result.rows)
})

export default router