import dotenv from 'dotenv'
import { createServer } from './server'
import { startGladiatorSync } from './services/gladiator-sync'

dotenv.config()

const PORT = process.env.PORT || 4000

async function main() {
  const server = createServer()

  server.listen(PORT, () => {
    console.log(`🎮 Game server running on port ${PORT}`)
  })

  // Start blockchain event listener
  await startGladiatorSync()
}

main().catch(console.error)
