import allCars from '@/data/allCars.json'

export type CarEntry = {
  unid: number
  crdb: string
  [k: string]: unknown
}

const CARS = allCars as CarEntry[]
const BY_CRDB = new Map(CARS.map(c => [c.crdb, c]))

export const ALL_CARS = CARS
export const ALL_CAR_IDS = CARS.map(c => c.crdb)
export const ALL_BRANDS = [...new Set(ALL_CAR_IDS.map(crdb =>
  `id_${crdb.split('_')[0].toLowerCase()}`
))].sort()

export const getCarByCrdb = (crdb: string) => BY_CRDB.get(crdb)

export function buildCarFromCatalog(crdb: string, unid: number): CarEntry | null {
  const base = BY_CRDB.get(crdb)
  if (!base) return null
  return { ...structuredClone(base), unid }
}
