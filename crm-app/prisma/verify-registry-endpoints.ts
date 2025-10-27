import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

interface VerificationResult {
  municipality: string
  platform: string
  endpoint: string
  isValid: boolean
  associationCount?: number
  error?: string
  responseTime: number
}

/**
 * Test IBGO endpoint
 */
async function testIbgoEndpoint(endpoint: string): Promise<{
  isValid: boolean
  associationCount?: number
  error?: string
  responseTime: number
}> {
  const startTime = Date.now()

  try {
    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      signal: AbortSignal.timeout(30000)
    })

    const responseTime = Date.now() - startTime

    if (!response.ok) {
      return {
        isValid: false,
        error: `HTTP ${response.status}: ${response.statusText}`,
        responseTime
      }
    }

    const data = await response.json()

    // Validate IBGO response structure
    if (typeof data === 'object' &&
        'TotalNumberOfElements' in data &&
        'Customers' in data &&
        Array.isArray(data.Customers)) {

      return {
        isValid: true,
        associationCount: data.TotalNumberOfElements,
        responseTime
      }
    } else {
      return {
        isValid: false,
        error: 'Invalid response structure (not IBGO format)',
        responseTime
      }
    }

  } catch (error) {
    const responseTime = Date.now() - startTime
    return {
      isValid: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      responseTime
    }
  }
}

/**
 * Test Actors Smartbook endpoint
 */
async function testActorsEndpoint(baseUrl: string): Promise<{
  isValid: boolean
  associationCount?: number
  error?: string
  responseTime: number
}> {
  const startTime = Date.now()

  try {
    // Test list endpoint
    const listUrl = `${baseUrl}/Associations/1/10`
    const response = await fetch(listUrl, {
      signal: AbortSignal.timeout(30000)
    })

    const responseTime = Date.now() - startTime

    if (!response.ok) {
      return {
        isValid: false,
        error: `HTTP ${response.status}: ${response.statusText}`,
        responseTime
      }
    }

    const data = await response.json()

    // Validate Actors response structure
    if (typeof data === 'object' &&
        typeof data.totalNumItems === 'number' &&
        Array.isArray(data.items)) {

      return {
        isValid: true,
        associationCount: data.totalNumItems,
        responseTime
      }
    } else {
      return {
        isValid: false,
        error: 'Invalid response structure (not Actors format)',
        responseTime
      }
    }

  } catch (error) {
    const responseTime = Date.now() - startTime
    return {
      isValid: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      responseTime
    }
  }
}

/**
 * Update municipality status based on verification result
 */
async function updateMunicipalityStatus(
  municipalityId: string,
  isValid: boolean,
  associationCount?: number
) {
  const status = isValid ? 'verified' : 'failed'

  await prisma.municipality.update({
    where: { id: municipalityId },
    data: {
      registerStatus: status,
      // Could also store association count if needed
    }
  })
}

async function verifyAllEndpoints() {
  console.log('🔍 Verifierar alla registry endpoints...\n')

  // Hämta alla municipalities med endpoints
  const municipalities = await prisma.municipality.findMany({
    where: {
      registryEndpoint: {
        not: null
      },
      platform: {
        in: ['Interbook Go', 'Actors Smartbook']
      }
    },
    select: {
      id: true,
      name: true,
      platform: true,
      registryEndpoint: true
    }
  })

  console.log(`📊 Hittade ${municipalities.length} municipalities att verifiera\n`)

  const results: VerificationResult[] = []
  let working = 0
  let failed = 0

  for (const municipality of municipalities) {
    console.log(`Testing ${municipality.name} (${municipality.platform})...`)

    let testResult: {
      isValid: boolean
      associationCount?: number
      error?: string
      responseTime: number
    }

    if (municipality.platform === 'Interbook Go') {
      testResult = await testIbgoEndpoint(municipality.registryEndpoint!)
    } else if (municipality.platform === 'Actors Smartbook') {
      testResult = await testActorsEndpoint(municipality.registryEndpoint!)
    } else {
      console.log(`  ⚠️  Okänd plattform: ${municipality.platform}`)
      continue
    }

    const result: VerificationResult = {
      municipality: municipality.name,
      platform: municipality.platform!,
      endpoint: municipality.registryEndpoint!,
      isValid: testResult.isValid,
      associationCount: testResult.associationCount,
      error: testResult.error,
      responseTime: testResult.responseTime
    }

    results.push(result)

    if (testResult.isValid) {
      console.log(`  ✅ Fungerar! ${testResult.associationCount} föreningar (${testResult.responseTime}ms)`)
      working++
    } else {
      console.log(`  ❌ Fungerar inte: ${testResult.error} (${testResult.responseTime}ms)`)
      failed++
    }

    // Uppdatera status i databasen
    await updateMunicipalityStatus(municipality.id, testResult.isValid, testResult.associationCount)

    // Kort paus för att inte överbelasta servrarna
    await new Promise(resolve => setTimeout(resolve, 500))
  }

  // Sammanfattning
  console.log('\n📈 Sammanfattning:')
  console.log(`   ✅ Fungerande: ${working}`)
  console.log(`   ❌ Trasiga: ${failed}`)
  console.log(`   📊 Totalt: ${municipalities.length}`)

  // Visa detaljer för trasiga endpoints
  if (failed > 0) {
    console.log('\n❌ Trasiga endpoints:')
    results
      .filter(r => !r.isValid)
      .forEach(r => {
        console.log(`   - ${r.municipality}: ${r.error}`)
      })
  }

  // Beräkna totalt antal föreningar
  const totalAssociations = results
    .filter(r => r.isValid && r.associationCount !== undefined)
    .reduce((sum, r) => sum + (r.associationCount || 0), 0)

  console.log(`\n📊 Totalt antal föreningar i fungerande system: ${totalAssociations.toLocaleString()}`)

  console.log('\n✨ Verifiering klar!')
}

verifyAllEndpoints()
  .catch((error) => {
    console.error('Fel:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })