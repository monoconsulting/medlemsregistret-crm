import { router } from '../trpc'
import { associationRouter } from './association'
import { contactRouter } from './contacts'
import { noteRouter } from './notes'
import { tagRouter } from './tags'
import { groupRouter } from './groups'
import { exportRouter } from './export'
import { aiRouter } from './ai'
import { taskRouter } from './tasks'
import { activityRouter } from './activities'

export const appRouter = router({
  association: associationRouter,
  contacts: contactRouter,
  notes: noteRouter,
  tags: tagRouter,
  groups: groupRouter,
  export: exportRouter,
  ai: aiRouter,
  tasks: taskRouter,
  activities: activityRouter,
})

export type AppRouter = typeof appRouter
