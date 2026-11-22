import { MigrateUpArgs, MigrateDownArgs } from '@payloadcms/db-postgres'

// Data only, no schema change (client, 22.11.2026):
//  1. Car makes and models that sellers and dealers need: the seeded list had no
//     Land Rover, Porsche, Mini… and no Audi A5. Only adds — a make or model the
//     team created or removed in the admin is left as it is.
//  2. The two right-column places of /cars/services were named "Cars — sidebar 3/4"
//     and read as duplicates of the /cars sidebars in the banner picker. Renamed
//     only while they still carry the seeded name.

const MAKES: Record<string, string[]> = {
  Acura: ['ILX', 'TSX', 'RLX'],
  'Alfa Romeo': ['Giulia', 'Stelvio', 'Tonale'],
  Audi: ['A5', 'A7', 'A8', 'Q4 e-tron', 'Q8', 'S4', 'S5', 'RS5', 'e-tron GT'],
  BMW: ['2 Series', '4 Series', '7 Series', 'X6', 'X7', 'M3', 'M5', 'i3', 'iX'],
  Buick: ['Envista', 'LaCrosse'],
  Cadillac: ['CT4', 'CT5', 'XT6'],
  Chevrolet: ['Blazer', 'Corvette', 'Express', 'Silverado 2500HD', 'Spark', 'Suburban', 'Trailblazer'],
  Chrysler: ['200', 'Voyager'],
  Dodge: ['Challenger', 'Grand Caravan', 'Journey'],
  Fiat: ['500', '500X'],
  Ford: ['Bronco Sport', 'Edge', 'Expedition', 'F-250', 'Focus', 'Fusion', 'Transit'],
  Genesis: ['G70', 'G80', 'G90', 'GV70', 'GV80'],
  GMC: ['Hummer EV', 'Savana', 'Sierra 2500HD'],
  Honda: ['Insight', 'Passport'],
  Hummer: ['H2', 'H3'],
  Hyundai: ['Accent', 'Ioniq 6', 'Santa Cruz', 'Venue'],
  Infiniti: ['Q50', 'Q60', 'QX50', 'QX60', 'QX80'],
  Jaguar: ['E-Pace', 'F-Pace', 'F-Type', 'I-Pace', 'XF'],
  Jeep: ['Renegade', 'Wagoneer'],
  Kia: ['Carnival', 'K5', 'Niro', 'Optima', 'Rio', 'Sedona', 'Soul'],
  'Land Rover': ['Defender', 'Discovery', 'Discovery Sport', 'Range Rover', 'Range Rover Evoque', 'Range Rover Sport', 'Range Rover Velar'],
  Lexus: ['LS', 'LX', 'RC', 'UX'],
  Lincoln: ['Aviator', 'Corsair', 'MKZ', 'Nautilus', 'Navigator'],
  Lucid: ['Air'],
  Maserati: ['Ghibli', 'Grecale', 'Levante'],
  Mazda: ['6', 'CX-9'],
  'Mercedes-Benz': ['A-Class', 'CLA', 'G-Class', 'GLA', 'GLB', 'GLS', 'Metris', 'S-Class'],
  Mini: ['Clubman', 'Cooper', 'Countryman'],
  Mitsubishi: ['Eclipse Cross', 'Mirage', 'Outlander', 'Outlander Sport'],
  Nissan: ['Ariya', 'Armada', 'Kicks', 'Maxima', 'Murano', 'Titan', 'Versa'],
  Polestar: ['2', '3'],
  Pontiac: ['G6', 'G8', 'Grand Prix', 'Vibe'],
  Porsche: ['911', 'Boxster', 'Cayenne', 'Cayman', 'Macan', 'Panamera', 'Taycan'],
  Ram: ['3500'],
  Rivian: ['R1S', 'R1T'],
  Scion: ['FR-S', 'tC', 'xB'],
  Subaru: ['BRZ', 'Legacy', 'Solterra'],
  Toyota: ['Avalon', 'bZ4X', 'C-HR', 'Corolla Cross', 'Sequoia', 'Supra', 'Venza', 'Yaris'],
  Volkswagen: ['Beetle', 'GTI', 'ID. Buzz', 'Passat', 'Taos'],
  Volvo: ['C40', 'S90', 'V60'],
}

const SLOT_NAMES: [code: string, seeded: string, name: string][] = [
  ['CARS_SIDEBAR_3', 'Cars — sidebar 3 (300x250)', 'Cars — auto services, sidebar 1 (300x250)'],
  ['CARS_SIDEBAR_4', 'Cars — sidebar 4 (300x600)', 'Cars — auto services, sidebar 2 (300x600)'],
]

const norm = (s: string) => s.trim().toLowerCase()
const byName = (a: string, b: string) => a.localeCompare(b, 'en', { numeric: true, sensitivity: 'base' })

export async function up({ payload, req }: MigrateUpArgs): Promise<void> {
  for (const [name, models] of Object.entries(MAKES)) {
    const found = (
      await payload.find({ collection: 'car-makes', where: { name: { equals: name } }, limit: 1, depth: 0, req })
    ).docs[0]
    if (!found) {
      await payload.create({ collection: 'car-makes', data: { name, models }, req })
      payload.logger.info(`car make added: ${name} (${models.length} models)`)
      continue
    }
    const have = found.models ?? []
    const add = models.filter((m) => !have.some((h) => norm(h) === norm(m)))
    if (add.length) {
      await payload.update({ collection: 'car-makes', id: found.id, data: { models: [...have, ...add].sort(byName) }, req })
      payload.logger.info(`car make ${name}: +${add.join(', ')}`)
    }
  }

  for (const [code, seeded, name] of SLOT_NAMES) {
    const slot = (await payload.find({ collection: 'ad-slots', where: { code: { equals: code } }, limit: 1, depth: 0, req })).docs[0]
    if (slot && slot.name === seeded) {
      await payload.update({ collection: 'ad-slots', id: slot.id, data: { name }, req })
      payload.logger.info(`ad slot ${code}: "${seeded}" → "${name}"`)
    }
  }
}

// Nothing to undo safely: the team may already have used the new makes in listings.
export async function down(_: MigrateDownArgs): Promise<void> {}
