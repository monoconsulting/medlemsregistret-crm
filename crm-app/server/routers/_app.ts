import { router } from '../trpc'
import { associationRouter } from './association'
import { contactRouter } from './contacts'
import { noteRouter } from './notes'
import { tagRouter } from './tags'
import { groupRouter } from './groups'
import { exportRouter } from './export'
import { aiRouter } from './ai'

export const appRouter = router({
  association: associationRouter,
  contacts: contactRouter,
  notes: noteRouter,
  tags: tagRouter,
  groups: groupRouter,
  export: exportRouter,
  ai: aiRouter,
})

export type AppRouter = typeof appRouter
