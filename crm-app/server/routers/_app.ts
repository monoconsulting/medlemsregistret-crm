import { router } from '../trpc'
import { associationRouter } from './association'

export const appRouter = router({
  association: associationRouter,
})

export type AppRouter = typeof appRouter
