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
import { municipalityRouter } from './municipality'
import { scrapingRouter } from './scraping'
import { userRouter } from './users'

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
  municipality: municipalityRouter,
  scraping: scrapingRouter,
  users: userRouter,
})

export type AppRouter = typeof appRouter