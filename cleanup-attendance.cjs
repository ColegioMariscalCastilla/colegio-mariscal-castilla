const { Pool } = require("pg");

async function cleanupAttendance() {
  console.log('🧹 Starting attendance cleanup...');
  
  const pool = new Pool({
    connectionString: "postgresql://postgres:clancito548@localhost:5432/mariscal_castilla"
  });
  
  try {
    // Contar registros antes de eliminar
    const attendanceResult = await pool.query('SELECT COUNT(*) FROM attendance');
    const timeResult = await pool.query('SELECT COUNT(*) FROM attendance_time');
    
    const attendanceCount = parseInt(attendanceResult.rows[0].count);
    const timeCount = parseInt(timeResult.rows[0].count);
    
    console.log(`📊 Found ${attendanceCount} attendance records and ${timeCount} time records`);
    
    // Eliminar todos los registros de attendance_time
    await pool.query('DELETE FROM attendance_time');
    console.log('✅ Deleted all attendance_time records');
    
    // Eliminar todos los registros de attendance
    await pool.query('DELETE FROM attendance');
    console.log('✅ Deleted all attendance records');
    
    console.log('🎉 Cleanup completed successfully!');
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
  } finally {
    await pool.end();
  }
}

cleanupAttendance();
