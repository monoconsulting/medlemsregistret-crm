import { router } from '../trpc'
import { associationRouter } from './association'
import { contactRouter } from './contact'
import { noteRouter } from './note'
import { tagRouter } from './tag'
import { groupRouter } from './group'
import { exportRouter } from './export'
import { aiRouter } from './ai'

export const appRouter = router({
  association: associationRouter,
  contact: contactRouter,
  note: noteRouter,
  tag: tagRouter,
  group: groupRouter,
  export: exportRouter,
  ai: aiRouter,
})

export type AppRouter = typeof appRouter
