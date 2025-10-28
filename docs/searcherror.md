2025-10-27 20:39:39.047 | Environment variables loaded from .env
2025-10-27 20:39:39.053 | Prisma schema loaded from prisma/schema.prisma
2025-10-27 20:39:39.708 | 
2025-10-27 20:39:39.708 | ✔ Generated Prisma Client (v6.18.0) to ./node_modules/@prisma/client in 306ms
2025-10-27 20:39:39.708 | 
2025-10-27 20:39:39.708 | Start by importing your Prisma Client (See: https://pris.ly/d/importing-client)
2025-10-27 20:39:39.708 | 
2025-10-27 20:39:39.708 | Tip: Interested in query caching in just a few lines of code? Try Accelerate today! https://pris.ly/tip-3-accelerate
2025-10-27 20:39:39.708 | 
2025-10-27 20:39:41.508 | Environment variables loaded from .env
2025-10-27 20:39:41.515 | Prisma schema loaded from prisma/schema.prisma
2025-10-27 20:39:41.519 | Datasource "db": MySQL database "crm_db" at "mysql:3306"
2025-10-27 20:39:41.560 | 
2025-10-27 20:39:41.560 | 2 migrations found in prisma/migrations
2025-10-27 20:39:41.560 | 
2025-10-27 20:39:41.610 | 
2025-10-27 20:39:41.610 | No pending migrations to apply.
2025-10-27 20:39:41.802 | 
2025-10-27 20:39:41.802 | > medlemsregistret-crm@0.1.0 dev
2025-10-27 20:39:41.802 | > next dev -p 3000
2025-10-27 20:39:41.802 | 
2025-10-27 20:39:43.913 |    ▲ Next.js 15.1.6
2025-10-27 20:39:43.913 |    - Local:        http://localhost:3000
2025-10-27 20:39:43.913 |    - Network:      http://172.18.0.5:3000
2025-10-27 20:39:43.914 |    - Environments: .env
2025-10-27 20:39:43.914 | 
2025-10-27 20:39:43.914 |  ✓ Starting...
2025-10-27 20:39:44.177 | Attention: Next.js now collects completely anonymous telemetry regarding usage.
2025-10-27 20:39:44.177 | This information is used to shape Next.js' roadmap and prioritize features.
2025-10-27 20:39:44.177 | You can learn more, including how to opt-out if you'd not like to participate in this anonymous program, by visiting the following URL:
2025-10-27 20:39:44.177 | https://nextjs.org/telemetry
2025-10-27 20:39:44.177 | 
2025-10-27 20:39:47.086 |  ✓ Ready in 3.8s
2025-10-27 20:40:08.164 |  ○ Compiling /middleware ...
2025-10-27 20:40:09.783 |  ✓ Compiled /middleware in 2.1s (258 modules)
2025-10-27 20:40:10.705 |  ○ Compiling /municipalities ...
2025-10-27 20:40:10.932 | <w> [webpack.cache.PackFileCacheStrategy] Serializing big strings (128kiB) impacts deserialization performance (consider using Buffer instead and decode when needed)
2025-10-27 20:40:21.587 |  ✓ Compiled /municipalities in 11.4s (1294 modules)
2025-10-27 20:40:23.390 |  ○ Compiling / ...
2025-10-27 20:40:27.314 |  ✓ Compiled / in 5.7s (1270 modules)
2025-10-27 20:40:27.760 |  GET / 200 in 6108ms
2025-10-27 20:40:29.079 |  ○ Compiling /dashboard ...
2025-10-27 20:40:38.662 |  ✓ Compiled /dashboard in 10.1s (3708 modules)
2025-10-27 20:40:39.202 |  GET /dashboard 200 in 10645ms
2025-10-27 20:40:39.877 |  GET /api/auth/session 200 in 11379ms
2025-10-27 20:40:40.120 |  GET /api/auth/session 200 in 120ms
2025-10-27 20:40:40.647 |  ○ Compiling /api/trpc/[trpc] ...
2025-10-27 20:40:42.477 |  ✓ Compiled /api/trpc/[trpc] in 2.3s (4363 modules)
2025-10-27 20:40:43.798 | prisma:query SELECT COUNT(*) AS `_count$_all` FROM (SELECT `crm_db`.`Association`.`id` FROM `crm_db`.`Association` WHERE (`crm_db`.`Association`.`crmStatus` = ? AND `crm_db`.`Association`.`isDeleted` = ?)) AS `sub`
2025-10-27 20:40:43.798 | prisma:query SELECT COUNT(*) AS `_count$_all` FROM (SELECT `crm_db`.`Association`.`id` FROM `crm_db`.`Association` WHERE (`crm_db`.`Association`.`crmStatus` = ? AND `crm_db`.`Association`.`isDeleted` = ?)) AS `sub`
2025-10-27 20:40:43.799 | prisma:query SELECT `crm_db`.`Activity`.`id`, `crm_db`.`Activity`.`associationId`, `crm_db`.`Activity`.`type`, `crm_db`.`Activity`.`description`, `crm_db`.`Activity`.`metadata`, `crm_db`.`Activity`.`userId`, `crm_db`.`Activity`.`userName`, `crm_db`.`Activity`.`createdAt` FROM `crm_db`.`Activity` WHERE `crm_db`.`Activity`.`createdAt` >= ? ORDER BY `crm_db`.`Activity`.`createdAt` DESC LIMIT ? OFFSET ?
2025-10-27 20:40:43.800 | prisma:query SELECT `crm_db`.`Task`.`id`, `crm_db`.`Task`.`title`, `crm_db`.`Task`.`description`, `crm_db`.`Task`.`dueDate`, `crm_db`.`Task`.`status`, `crm_db`.`Task`.`priority`, `crm_db`.`Task`.`associationId`, `crm_db`.`Task`.`assignedToId`, `crm_db`.`Task`.`createdById`, `crm_db`.`Task`.`completedAt`, `crm_db`.`Task`.`createdAt`, `crm_db`.`Task`.`updatedAt` FROM `crm_db`.`Task` WHERE `crm_db`.`Task`.`status` IN (?,?,?) ORDER BY `crm_db`.`Task`.`status` ASC, `crm_db`.`Task`.`dueDate` ASC, `crm_db`.`Task`.`createdAt` DESC LIMIT ? OFFSET ?
2025-10-27 20:40:43.804 | prisma:query SELECT `crm_db`.`Group`.`id`, `crm_db`.`Group`.`name`, `crm_db`.`Group`.`description`, `crm_db`.`Group`.`searchQuery`, `crm_db`.`Group`.`autoUpdate`, `crm_db`.`Group`.`createdById`, `crm_db`.`Group`.`createdAt`, `crm_db`.`Group`.`updatedAt`, COALESCE(`aggr_selection_0_GroupMembership`.`_aggr_count_memberships`, 0) AS `_aggr_count_memberships` FROM `crm_db`.`Group` LEFT JOIN (SELECT `crm_db`.`GroupMembership`.`groupId`, COUNT(*) AS `_aggr_count_memberships` FROM `crm_db`.`GroupMembership` WHERE 1=1 GROUP BY `crm_db`.`GroupMembership`.`groupId`) AS `aggr_selection_0_GroupMembership` ON (`crm_db`.`Group`.`id` = `aggr_selection_0_GroupMembership`.`groupId`) WHERE 1=1 ORDER BY `crm_db`.`Group`.`updatedAt` DESC
2025-10-27 20:40:43.809 | prisma:query SELECT COUNT(*) AS `_count$_all` FROM (SELECT `crm_db`.`Association`.`id` FROM `crm_db`.`Association` WHERE 1=1) AS `sub`
2025-10-27 20:40:43.809 | prisma:query SELECT COUNT(*) AS `_count$_all` FROM (SELECT `crm_db`.`Association`.`id` FROM `crm_db`.`Association` WHERE `crm_db`.`Association`.`isDeleted` = ?) AS `sub`
2025-10-27 20:40:43.862 | prisma:query SELECT `crm_db`.`User`.`id`, `crm_db`.`User`.`name`, `crm_db`.`User`.`email` FROM `crm_db`.`User` WHERE `crm_db`.`User`.`id` IN (?)
2025-10-27 20:40:43.862 | prisma:query SELECT `crm_db`.`User`.`id`, `crm_db`.`User`.`name` FROM `crm_db`.`User` WHERE `crm_db`.`User`.`id` IN (?)
2025-10-27 20:40:43.862 | prisma:query SELECT `crm_db`.`User`.`id`, `crm_db`.`User`.`name`, `crm_db`.`User`.`email` FROM `crm_db`.`User` WHERE `crm_db`.`User`.`id` IN (?)
2025-10-27 20:40:43.914 | prisma:query SELECT COUNT(*) AS `_count$_all` FROM (SELECT `crm_db`.`Association`.`id` FROM `crm_db`.`Association` WHERE (`crm_db`.`Association`.`isMember` = ? AND `crm_db`.`Association`.`isDeleted` = ?)) AS `sub`
2025-10-27 20:40:43.914 | prisma:query SELECT COUNT(*) AS `_count$_all` FROM (SELECT `crm_db`.`Association`.`id` FROM `crm_db`.`Association` WHERE (`crm_db`.`Association`.`isMember` = ? AND `crm_db`.`Association`.`memberSince` <= ?)) AS `sub`
2025-10-27 20:40:43.939 | prisma:query SELECT COUNT(*) AS `_count$_all` FROM (SELECT `crm_db`.`Association`.`id` FROM `crm_db`.`Association` WHERE (`crm_db`.`Association`.`isMember` = ? AND `crm_db`.`Association`.`memberSince` <= ?)) AS `sub`
2025-10-27 20:40:43.939 | prisma:query SELECT COUNT(*) AS `_count$_all`, `crm_db`.`Association`.`municipalityId` FROM `crm_db`.`Association` WHERE (`crm_db`.`Association`.`municipalityId` IS NOT NULL AND `crm_db`.`Association`.`isDeleted` = ?) GROUP BY `crm_db`.`Association`.`municipalityId` ORDER BY COUNT(`crm_db`.`Association`.`municipalityId`) DESC LIMIT ? OFFSET ?
2025-10-27 20:40:43.964 | prisma:query SELECT COUNT(*) AS `_count$_all` FROM (SELECT `crm_db`.`Association`.`id` FROM `crm_db`.`Association` WHERE (`crm_db`.`Association`.`isMember` = ? AND `crm_db`.`Association`.`memberSince` <= ?)) AS `sub`
2025-10-27 20:40:43.964 | prisma:query SELECT `crm_db`.`Municipality`.`id`, `crm_db`.`Municipality`.`name` FROM `crm_db`.`Municipality` WHERE `crm_db`.`Municipality`.`id` IN (?,?,?,?,?)
2025-10-27 20:40:43.991 | prisma:query SELECT COUNT(*) AS `_count$_all` FROM (SELECT `crm_db`.`Association`.`id` FROM `crm_db`.`Association` WHERE (`crm_db`.`Association`.`isMember` = ? AND `crm_db`.`Association`.`memberSince` <= ?)) AS `sub`
2025-10-27 20:40:43.991 | prisma:query SELECT `crm_db`.`Association`.`id`, `crm_db`.`Association`.`sourceSystem`, `crm_db`.`Association`.`municipalityId`, `crm_db`.`Association`.`municipality`, `crm_db`.`Association`.`scrapeRunId`, `crm_db`.`Association`.`scrapedAt`, `crm_db`.`Association`.`detailUrl`, `crm_db`.`Association`.`name`, `crm_db`.`Association`.`orgNumber`, `crm_db`.`Association`.`types`, `crm_db`.`Association`.`activities`, `crm_db`.`Association`.`categories`, `crm_db`.`Association`.`homepageUrl`, `crm_db`.`Association`.`streetAddress`, `crm_db`.`Association`.`postalCode`, `crm_db`.`Association`.`city`, `crm_db`.`Association`.`email`, `crm_db`.`Association`.`phone`, `crm_db`.`Association`.`description`, `crm_db`.`Association`.`descriptionFreeText`, `crm_db`.`Association`.`crmStatus`, `crm_db`.`Association`.`isMember`, `crm_db`.`Association`.`memberSince`, `crm_db`.`Association`.`pipeline`, `crm_db`.`Association`.`assignedToId`, `crm_db`.`Association`.`listPageIndex`, `crm_db`.`Association`.`positionOnPage`, `crm_db`.`Association`.`paginationModel`, `crm_db`.`Association`.`filterState`, `crm_db`.`Association`.`extras`, `crm_db`.`Association`.`createdAt`, `crm_db`.`Association`.`updatedAt`, `crm_db`.`Association`.`importBatchId`, `crm_db`.`Association`.`deletedAt`, `crm_db`.`Association`.`isDeleted`, COALESCE(`aggr_selection_0_Contact`.`_aggr_count_contacts`, 0) AS `_aggr_count_contacts`, COALESCE(`aggr_selection_1_Note`.`_aggr_count_notes`, 0) AS `_aggr_count_notes` FROM `crm_db`.`Association` LEFT JOIN (SELECT `crm_db`.`Contact`.`associationId`, COUNT(*) AS `_aggr_count_contacts` FROM `crm_db`.`Contact` WHERE 1=1 GROUP BY `crm_db`.`Contact`.`associationId`) AS `aggr_selection_0_Contact` ON (`crm_db`.`Association`.`id` = `aggr_selection_0_Contact`.`associationId`) LEFT JOIN (SELECT `crm_db`.`Note`.`associationId`, COUNT(*) AS `_aggr_count_notes` FROM `crm_db`.`Note` WHERE 1=1 GROUP BY `crm_db`.`Note`.`associationId`) AS `aggr_selection_1_Note` ON (`crm_db`.`Association`.`id` = `aggr_selection_1_Note`.`associationId`) WHERE 1=1 ORDER BY `crm_db`.`Association`.`updatedAt` DESC LIMIT ? OFFSET ?
2025-10-27 20:40:43.994 | prisma:query SELECT `crm_db`.`Contact`.`id`, `crm_db`.`Contact`.`associationId`, `crm_db`.`Contact`.`name`, `crm_db`.`Contact`.`role`, `crm_db`.`Contact`.`email`, `crm_db`.`Contact`.`phone`, `crm_db`.`Contact`.`mobile`, `crm_db`.`Contact`.`linkedinUrl`, `crm_db`.`Contact`.`facebookUrl`, `crm_db`.`Contact`.`twitterUrl`, `crm_db`.`Contact`.`instagramUrl`, `crm_db`.`Contact`.`isPrimary`, `crm_db`.`Contact`.`createdAt`, `crm_db`.`Contact`.`updatedAt` FROM `crm_db`.`Contact` WHERE (`crm_db`.`Contact`.`isPrimary` = ? AND `crm_db`.`Contact`.`associationId` IN (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)) ORDER BY `crm_db`.`Contact`.`id` ASC
2025-10-27 20:40:43.999 | prisma:query SELECT `crm_db`.`_AssociationTags`.`A`, `crm_db`.`_AssociationTags`.`B` FROM `crm_db`.`_AssociationTags` WHERE `crm_db`.`_AssociationTags`.`A` IN (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
2025-10-27 20:40:44.010 | prisma:query SELECT COUNT(*) AS `_count$_all` FROM (SELECT `crm_db`.`Association`.`id` FROM `crm_db`.`Association` WHERE (`crm_db`.`Association`.`isMember` = ? AND `crm_db`.`Association`.`memberSince` <= ?)) AS `sub`
2025-10-27 20:40:44.010 | prisma:query SELECT `crm_db`.`Tag`.`id`, `crm_db`.`Tag`.`name`, `crm_db`.`Tag`.`color`, `crm_db`.`Tag`.`createdAt` FROM `crm_db`.`Tag` WHERE `crm_db`.`Tag`.`id` IN (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
2025-10-27 20:40:44.010 | prisma:query SELECT `crm_db`.`Activity`.`id`, `crm_db`.`Activity`.`associationId`, `crm_db`.`Activity`.`type`, `crm_db`.`Activity`.`description`, `crm_db`.`Activity`.`metadata`, `crm_db`.`Activity`.`userId`, `crm_db`.`Activity`.`userName`, `crm_db`.`Activity`.`createdAt` FROM `crm_db`.`Activity` WHERE `crm_db`.`Activity`.`associationId` IN (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?) ORDER BY `crm_db`.`Activity`.`createdAt` DESC
2025-10-27 20:40:44.028 | prisma:query SELECT COUNT(*) AS `_count$_all` FROM (SELECT `crm_db`.`Association`.`id` FROM `crm_db`.`Association` WHERE (`crm_db`.`Association`.`isMember` = ? AND `crm_db`.`Association`.`memberSince` <= ?)) AS `sub`
2025-10-27 20:40:44.042 | prisma:query SELECT COUNT(*) AS `_count$_all` FROM (SELECT `crm_db`.`Association`.`id` FROM `crm_db`.`Association` WHERE (`crm_db`.`Association`.`isMember` = ? AND `crm_db`.`Association`.`memberSince` <= ?)) AS `sub`
2025-10-27 20:40:44.058 | prisma:query SELECT COUNT(*) AS `_count$_all` FROM (SELECT `crm_db`.`Association`.`id` FROM `crm_db`.`Association` WHERE (`crm_db`.`Association`.`isMember` = ? AND `crm_db`.`Association`.`memberSince` <= ?)) AS `sub`
2025-10-27 20:40:44.075 | prisma:query SELECT COUNT(*) AS `_count$_all` FROM (SELECT `crm_db`.`Association`.`id` FROM `crm_db`.`Association` WHERE (`crm_db`.`Association`.`isMember` = ? AND `crm_db`.`Association`.`memberSince` <= ?)) AS `sub`
2025-10-27 20:40:44.094 | prisma:query SELECT COUNT(*) AS `_count$_all` FROM (SELECT `crm_db`.`Association`.`id` FROM `crm_db`.`Association` WHERE (`crm_db`.`Association`.`isMember` = ? AND `crm_db`.`Association`.`memberSince` <= ?)) AS `sub`
2025-10-27 20:40:44.109 | prisma:query SELECT COUNT(*) AS `_count$_all` FROM (SELECT `crm_db`.`Association`.`id` FROM `crm_db`.`Association` WHERE (`crm_db`.`Association`.`isMember` = ? AND `crm_db`.`Association`.`memberSince` <= ?)) AS `sub`
2025-10-27 20:40:44.123 | prisma:query SELECT COUNT(*) AS `_count$_all` FROM (SELECT `crm_db`.`Association`.`id` FROM `crm_db`.`Association` WHERE (`crm_db`.`Association`.`isMember` = ? AND `crm_db`.`Association`.`memberSince` <= ?)) AS `sub`
2025-10-27 20:40:44.147 |  GET /api/trpc/association.getStats,activities.recent,association.getMemberGrowth,tasks.list,association.list,groups.list?batch=1&input=%7B%220%22%3A%7B%22json%22%3Anull%2C%22meta%22%3A%7B%22values%22%3A%5B%22undefined%22%5D%2C%22v%22%3A1%7D%7D%2C%221%22%3A%7B%22json%22%3A%7B%22limit%22%3A10%7D%7D%2C%222%22%3A%7B%22json%22%3A%7B%22months%22%3A12%7D%7D%2C%223%22%3A%7B%22json%22%3A%7B%22status%22%3A%5B%22OPEN%22%2C%22IN_PROGRESS%22%2C%22BLOCKED%22%5D%2C%22limit%22%3A8%7D%7D%2C%224%22%3A%7B%22json%22%3A%7B%22page%22%3A1%2C%22limit%22%3A20%7D%7D%2C%225%22%3A%7B%22json%22%3Anull%2C%22meta%22%3A%7B%22values%22%3A%5B%22undefined%22%5D%2C%22v%22%3A1%7D%7D%7D 200 in 4032ms
2025-10-27 20:40:44.444 |  ○ Compiling /associations ...
2025-10-27 20:40:47.301 |  ✓ Compiled /associations in 3.4s (4454 modules)
2025-10-27 20:40:47.605 |  GET /api/trpc/ai.nextSteps?batch=1&input=%7B%220%22%3A%7B%22json%22%3A%7B%22associationId%22%3A%22cmh7ub3uk00vab59w9o505k3k%22%7D%7D%7D 200 in 2899ms
2025-10-27 20:40:47.606 | prisma:query SELECT `crm_db`.`Association`.`id`, `crm_db`.`Association`.`sourceSystem`, `crm_db`.`Association`.`municipalityId`, `crm_db`.`Association`.`municipality`, `crm_db`.`Association`.`scrapeRunId`, `crm_db`.`Association`.`scrapedAt`, `crm_db`.`Association`.`detailUrl`, `crm_db`.`Association`.`name`, `crm_db`.`Association`.`orgNumber`, `crm_db`.`Association`.`types`, `crm_db`.`Association`.`activities`, `crm_db`.`Association`.`categories`, `crm_db`.`Association`.`homepageUrl`, `crm_db`.`Association`.`streetAddress`, `crm_db`.`Association`.`postalCode`, `crm_db`.`Association`.`city`, `crm_db`.`Association`.`email`, `crm_db`.`Association`.`phone`, `crm_db`.`Association`.`description`, `crm_db`.`Association`.`descriptionFreeText`, `crm_db`.`Association`.`crmStatus`, `crm_db`.`Association`.`isMember`, `crm_db`.`Association`.`memberSince`, `crm_db`.`Association`.`pipeline`, `crm_db`.`Association`.`assignedToId`, `crm_db`.`Association`.`listPageIndex`, `crm_db`.`Association`.`positionOnPage`, `crm_db`.`Association`.`paginationModel`, `crm_db`.`Association`.`filterState`, `crm_db`.`Association`.`extras`, `crm_db`.`Association`.`createdAt`, `crm_db`.`Association`.`updatedAt`, `crm_db`.`Association`.`importBatchId`, `crm_db`.`Association`.`deletedAt`, `crm_db`.`Association`.`isDeleted` FROM `crm_db`.`Association` WHERE (`crm_db`.`Association`.`id` = ? AND 1=1) LIMIT ? OFFSET ?
2025-10-27 20:40:47.606 | prisma:query SELECT `crm_db`.`Note`.`id`, `crm_db`.`Note`.`associationId`, `crm_db`.`Note`.`content`, `crm_db`.`Note`.`tags`, `crm_db`.`Note`.`authorId`, `crm_db`.`Note`.`authorName`, `crm_db`.`Note`.`createdAt`, `crm_db`.`Note`.`updatedAt` FROM `crm_db`.`Note` WHERE `crm_db`.`Note`.`associationId` IN (?) ORDER BY `crm_db`.`Note`.`createdAt` DESC LIMIT ? OFFSET ?
2025-10-27 20:40:47.606 | prisma:query SELECT `crm_db`.`Activity`.`id`, `crm_db`.`Activity`.`associationId`, `crm_db`.`Activity`.`type`, `crm_db`.`Activity`.`description`, `crm_db`.`Activity`.`metadata`, `crm_db`.`Activity`.`userId`, `crm_db`.`Activity`.`userName`, `crm_db`.`Activity`.`createdAt` FROM `crm_db`.`Activity` WHERE `crm_db`.`Activity`.`associationId` IN (?) ORDER BY `crm_db`.`Activity`.`createdAt` DESC LIMIT ? OFFSET ?
2025-10-27 20:40:47.617 |  GET /associations 200 in 3736ms
2025-10-27 20:40:48.046 | prisma:query SELECT COUNT(*) AS `_count$_all` FROM (SELECT `crm_db`.`Association`.`id` FROM `crm_db`.`Association` WHERE 1=1) AS `sub`
2025-10-27 20:40:48.049 | prisma:query SELECT `crm_db`.`Tag`.`id`, `crm_db`.`Tag`.`name`, `crm_db`.`Tag`.`color`, `crm_db`.`Tag`.`createdAt` FROM `crm_db`.`Tag` WHERE 1=1 ORDER BY `crm_db`.`Tag`.`createdAt` DESC
2025-10-27 20:40:48.233 | prisma:query SELECT `crm_db`.`Association`.`id`, `crm_db`.`Association`.`sourceSystem`, `crm_db`.`Association`.`municipalityId`, `crm_db`.`Association`.`municipality`, `crm_db`.`Association`.`scrapeRunId`, `crm_db`.`Association`.`scrapedAt`, `crm_db`.`Association`.`detailUrl`, `crm_db`.`Association`.`name`, `crm_db`.`Association`.`orgNumber`, `crm_db`.`Association`.`types`, `crm_db`.`Association`.`activities`, `crm_db`.`Association`.`categories`, `crm_db`.`Association`.`homepageUrl`, `crm_db`.`Association`.`streetAddress`, `crm_db`.`Association`.`postalCode`, `crm_db`.`Association`.`city`, `crm_db`.`Association`.`email`, `crm_db`.`Association`.`phone`, `crm_db`.`Association`.`description`, `crm_db`.`Association`.`descriptionFreeText`, `crm_db`.`Association`.`crmStatus`, `crm_db`.`Association`.`isMember`, `crm_db`.`Association`.`memberSince`, `crm_db`.`Association`.`pipeline`, `crm_db`.`Association`.`assignedToId`, `crm_db`.`Association`.`listPageIndex`, `crm_db`.`Association`.`positionOnPage`, `crm_db`.`Association`.`paginationModel`, `crm_db`.`Association`.`filterState`, `crm_db`.`Association`.`extras`, `crm_db`.`Association`.`createdAt`, `crm_db`.`Association`.`updatedAt`, `crm_db`.`Association`.`importBatchId`, `crm_db`.`Association`.`deletedAt`, `crm_db`.`Association`.`isDeleted`, COALESCE(`aggr_selection_0_Contact`.`_aggr_count_contacts`, 0) AS `_aggr_count_contacts`, COALESCE(`aggr_selection_1_Note`.`_aggr_count_notes`, 0) AS `_aggr_count_notes` FROM `crm_db`.`Association` LEFT JOIN (SELECT `crm_db`.`Contact`.`associationId`, COUNT(*) AS `_aggr_count_contacts` FROM `crm_db`.`Contact` WHERE 1=1 GROUP BY `crm_db`.`Contact`.`associationId`) AS `aggr_selection_0_Contact` ON (`crm_db`.`Association`.`id` = `aggr_selection_0_Contact`.`associationId`) LEFT JOIN (SELECT `crm_db`.`Note`.`associationId`, COUNT(*) AS `_aggr_count_notes` FROM `crm_db`.`Note` WHERE 1=1 GROUP BY `crm_db`.`Note`.`associationId`) AS `aggr_selection_1_Note` ON (`crm_db`.`Association`.`id` = `aggr_selection_1_Note`.`associationId`) WHERE 1=1 ORDER BY `crm_db`.`Association`.`updatedAt` DESC LIMIT ? OFFSET ?
2025-10-27 20:40:48.234 | prisma:query SELECT `crm_db`.`Contact`.`id`, `crm_db`.`Contact`.`associationId`, `crm_db`.`Contact`.`name`, `crm_db`.`Contact`.`role`, `crm_db`.`Contact`.`email`, `crm_db`.`Contact`.`phone`, `crm_db`.`Contact`.`mobile`, `crm_db`.`Contact`.`linkedinUrl`, `crm_db`.`Contact`.`facebookUrl`, `crm_db`.`Contact`.`twitterUrl`, `crm_db`.`Contact`.`instagramUrl`, `crm_db`.`Contact`.`isPrimary`, `crm_db`.`Contact`.`createdAt`, `crm_db`.`Contact`.`updatedAt` FROM `crm_db`.`Contact` WHERE (`crm_db`.`Contact`.`isPrimary` = ? AND `crm_db`.`Contact`.`associationId` IN (?,?,?,?,?,?,?,?,?,?)) ORDER BY `crm_db`.`Contact`.`id` ASC
2025-10-27 20:40:48.235 | prisma:query SELECT `crm_db`.`_AssociationTags`.`A`, `crm_db`.`_AssociationTags`.`B` FROM `crm_db`.`_AssociationTags` WHERE `crm_db`.`_AssociationTags`.`A` IN (?,?,?,?,?,?,?,?,?,?)
2025-10-27 20:40:48.236 | prisma:query SELECT `crm_db`.`Tag`.`id`, `crm_db`.`Tag`.`name`, `crm_db`.`Tag`.`color`, `crm_db`.`Tag`.`createdAt` FROM `crm_db`.`Tag` WHERE `crm_db`.`Tag`.`id` IN (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
2025-10-27 20:40:48.237 | prisma:query SELECT `crm_db`.`Activity`.`id`, `crm_db`.`Activity`.`associationId`, `crm_db`.`Activity`.`type`, `crm_db`.`Activity`.`description`, `crm_db`.`Activity`.`metadata`, `crm_db`.`Activity`.`userId`, `crm_db`.`Activity`.`userName`, `crm_db`.`Activity`.`createdAt` FROM `crm_db`.`Activity` WHERE `crm_db`.`Activity`.`associationId` IN (?,?,?,?,?,?,?,?,?,?) ORDER BY `crm_db`.`Activity`.`createdAt` DESC
2025-10-27 20:40:48.306 |  GET /api/trpc/association.list,tags.list,municipality.list,users.list?batch=1&input=%7B%220%22%3A%7B%22json%22%3A%7B%22page%22%3A1%2C%22limit%22%3A10%2C%22search%22%3Anull%2C%22crmStatuses%22%3Anull%2C%22pipelines%22%3Anull%2C%22types%22%3Anull%2C%22activities%22%3Anull%2C%22tags%22%3Anull%2C%22hasEmail%22%3Anull%2C%22hasPhone%22%3Anull%2C%22isMember%22%3Anull%2C%22assignedToId%22%3Anull%2C%22municipality%22%3Anull%2C%22municipalityId%22%3Anull%2C%22dateRange%22%3Anull%2C%22lastActivityDays%22%3Anull%2C%22sortBy%22%3A%22updatedAt%22%2C%22sortDirection%22%3A%22desc%22%2C%22useSearchIndex%22%3Afalse%7D%2C%22meta%22%3A%7B%22values%22%3A%7B%22search%22%3A%5B%22undefined%22%5D%2C%22crmStatuses%22%3A%5B%22undefined%22%5D%2C%22pipelines%22%3A%5B%22undefined%22%5D%2C%22types%22%3A%5B%22undefined%22%5D%2C%22activities%22%3A%5B%22undefined%22%5D%2C%22tags%22%3A%5B%22undefined%22%5D%2C%22hasEmail%22%3A%5B%22undefined%22%5D%2C%22hasPhone%22%3A%5B%22undefined%22%5D%2C%22isMember%22%3A%5B%22undefined%22%5D%2C%22assignedToId%22%3A%5B%22undefined%22%5D%2C%22municipality%22%3A%5B%22undefined%22%5D%2C%22municipalityId%22%3A%5B%22undefined%22%5D%2C%22dateRange%22%3A%5B%22undefined%22%5D%2C%22lastActivityDays%22%3A%5B%22undefined%22%5D%7D%2C%22v%22%3A1%7D%7D%2C%221%22%3A%7B%22json%22%3Anull%2C%22meta%22%3A%7B%22values%22%3A%5B%22undefined%22%5D%2C%22v%22%3A1%7D%7D%2C%222%22%3A%7B%22json%22%3A%7B%22limit%22%3A400%2C%22sortBy%22%3A%22name%22%2C%22sortOrder%22%3A%22asc%22%7D%7D%2C%223%22%3A%7B%22json%22%3A%7B%22page%22%3A1%2C%22limit%22%3A200%7D%7D%7D 207 in 332ms
2025-10-27 20:40:49.479 |  GET /api/trpc/municipality.list,users.list?batch=1&input=%7B%220%22%3A%7B%22json%22%3A%7B%22limit%22%3A400%2C%22sortBy%22%3A%22name%22%2C%22sortOrder%22%3A%22asc%22%7D%7D%2C%221%22%3A%7B%22json%22%3A%7B%22page%22%3A1%2C%22limit%22%3A200%7D%7D%7D 400 in 84ms
2025-10-27 20:40:51.653 |  GET /api/trpc/municipality.list,users.list?batch=1&input=%7B%220%22%3A%7B%22json%22%3A%7B%22limit%22%3A400%2C%22sortBy%22%3A%22name%22%2C%22sortOrder%22%3A%22asc%22%7D%7D%2C%221%22%3A%7B%22json%22%3A%7B%22page%22%3A1%2C%22limit%22%3A200%7D%7D%7D 400 in 83ms
2025-10-27 20:40:55.805 |  GET /api/trpc/municipality.list,users.list?batch=1&input=%7B%220%22%3A%7B%22json%22%3A%7B%22limit%22%3A400%2C%22sortBy%22%3A%22name%22%2C%22sortOrder%22%3A%22asc%22%7D%7D%2C%221%22%3A%7B%22json%22%3A%7B%22page%22%3A1%2C%22limit%22%3A200%7D%7D%7D 400 in 82ms
2025-10-27 20:41:20.007 | prisma:query SELECT 1
2025-10-27 20:41:20.019 | prisma:error 
2025-10-27 20:41:20.019 | Invalid `prisma.association.count()` invocation:
2025-10-27 20:41:20.019 | 
2025-10-27 20:41:20.019 | {
2025-10-27 20:41:20.019 |   select: {
2025-10-27 20:41:20.019 |     _count: {
2025-10-27 20:41:20.019 |       select: {
2025-10-27 20:41:20.019 |         _all: true
2025-10-27 20:41:20.019 |       }
2025-10-27 20:41:20.019 |     }
2025-10-27 20:41:20.019 |   },
2025-10-27 20:41:20.019 |   where: {
2025-10-27 20:41:20.019 |     AND: [
2025-10-27 20:41:20.019 |       {
2025-10-27 20:41:20.019 |         OR: [
2025-10-27 20:41:20.019 |           {
2025-10-27 20:41:20.019 |             name: {
2025-10-27 20:41:20.019 |               contains: "f",
2025-10-27 20:41:20.019 |               mode: "insensitive"
2025-10-27 20:41:20.019 |             }
2025-10-27 20:41:20.019 |           },
2025-10-27 20:41:20.019 |           {
2025-10-27 20:41:20.019 |             orgNumber: {
2025-10-27 20:41:20.019 |               contains: "f",
2025-10-27 20:41:20.019 |               mode: "insensitive"
2025-10-27 20:41:20.019 |             }
2025-10-27 20:41:20.019 |           },
2025-10-27 20:41:20.019 |           {
2025-10-27 20:41:20.019 |             streetAddress: {
2025-10-27 20:41:20.019 |               contains: "f",
2025-10-27 20:41:20.019 |               mode: "insensitive"
2025-10-27 20:41:20.019 |             }
2025-10-27 20:41:20.019 |           },
2025-10-27 20:41:20.019 |           {
2025-10-27 20:41:20.019 |             city: {
2025-10-27 20:41:20.019 |               contains: "f",
2025-10-27 20:41:20.019 |               mode: "insensitive"
2025-10-27 20:41:20.019 |             }
2025-10-27 20:41:20.019 |           },
2025-10-27 20:41:20.019 |           {
2025-10-27 20:41:20.019 |             municipality: {
2025-10-27 20:41:20.019 |               contains: "f",
2025-10-27 20:41:20.019 |               mode: "insensitive"
2025-10-27 20:41:20.019 |             }
2025-10-27 20:41:20.019 |           },
2025-10-27 20:41:20.019 |           {
2025-10-27 20:41:20.019 |             email: {
2025-10-27 20:41:20.019 |               contains: "f",
2025-10-27 20:41:20.019 |               mode: "insensitive"
2025-10-27 20:41:20.019 |             }
2025-10-27 20:41:20.019 |           },
2025-10-27 20:41:20.019 |           {
2025-10-27 20:41:20.019 |             phone: {
2025-10-27 20:41:20.019 |               contains: "f",
2025-10-27 20:41:20.019 |               mode: "insensitive"
2025-10-27 20:41:20.019 |             }
2025-10-27 20:41:20.019 |           },
2025-10-27 20:41:20.019 |           {
2025-10-27 20:41:20.019 |             homepageUrl: {
2025-10-27 20:41:20.019 |               contains: "f",
2025-10-27 20:41:20.019 |               mode: "insensitive"
2025-10-27 20:41:20.019 |             }
2025-10-27 20:41:20.019 |           },
2025-10-27 20:41:20.019 |           {
2025-10-27 20:41:20.019 |             descriptionFreeText: {
2025-10-27 20:41:20.019 |               contains: "f",
2025-10-27 20:41:20.019 |               mode: "insensitive"
2025-10-27 20:41:20.019 |             }
2025-10-27 20:41:20.019 |           },
2025-10-27 20:41:20.019 |           {
2025-10-27 20:41:20.019 |             sourceSystem: {
2025-10-27 20:41:20.019 |               contains: "f",
2025-10-27 20:41:20.019 |               mode: "insensitive"
2025-10-27 20:41:20.019 |             }
2025-10-27 20:41:20.019 |           },
2025-10-27 20:41:20.019 |           {
2025-10-27 20:41:20.019 |             tags: {
2025-10-27 20:41:20.019 |               some: {
2025-10-27 20:41:20.019 |                 name: {
2025-10-27 20:41:20.019 |                   contains: "f",
2025-10-27 20:41:20.019 |                   mode: "insensitive"
2025-10-27 20:41:20.019 |                 }
2025-10-27 20:41:20.019 |               }
2025-10-27 20:41:20.019 |             }
2025-10-27 20:41:20.019 |           },
2025-10-27 20:41:20.019 |           {
2025-10-27 20:41:20.019 |             contacts: {
2025-10-27 20:41:20.019 |               some: {
2025-10-27 20:41:20.019 |                 OR: [
2025-10-27 20:41:20.019 |                   {
2025-10-27 20:41:20.019 |                     name: {
2025-10-27 20:41:20.019 |                       contains: "f",
2025-10-27 20:41:20.019 |                       mode: "insensitive"
2025-10-27 20:41:20.019 |                     }
2025-10-27 20:41:20.019 |                   },
2025-10-27 20:41:20.019 |                   {
2025-10-27 20:41:20.019 |                     role: {
2025-10-27 20:41:20.019 |                       contains: "f",
2025-10-27 20:41:20.019 |                       mode: "insensitive"
2025-10-27 20:41:20.019 |                     }
2025-10-27 20:41:20.019 |                   },
2025-10-27 20:41:20.019 |                   {
2025-10-27 20:41:20.019 |                     email: {
2025-10-27 20:41:20.019 |                       contains: "f",
2025-10-27 20:41:20.019 |                       mode: "insensitive"
2025-10-27 20:41:20.019 |                     }
2025-10-27 20:41:20.019 |                   },
2025-10-27 20:41:20.019 |                   {
2025-10-27 20:41:20.019 |                     phone: {
2025-10-27 20:41:20.019 |                       contains: "f",
2025-10-27 20:41:20.019 |                       mode: "insensitive"
2025-10-27 20:41:20.019 |                     }
2025-10-27 20:41:20.019 |                   },
2025-10-27 20:41:20.019 |                   {
2025-10-27 20:41:20.019 |                     mobile: {
2025-10-27 20:41:20.019 |                       contains: "f",
2025-10-27 20:41:20.019 |                       mode: "insensitive"
2025-10-27 20:41:20.019 |                     }
2025-10-27 20:41:20.019 |                   }
2025-10-27 20:41:20.019 |                 ]
2025-10-27 20:41:20.019 |               }
2025-10-27 20:41:20.019 |             }
2025-10-27 20:41:20.019 |           }
2025-10-27 20:41:20.019 |         ]
2025-10-27 20:41:20.019 |       }
2025-10-27 20:41:20.019 |     ]
2025-10-27 20:41:20.019 |   }
2025-10-27 20:41:20.019 | }
2025-10-27 20:41:20.019 | 
2025-10-27 20:41:20.019 | Unknown argument `mode`. Did you mean `lte`? Available options are marked with ?.
2025-10-27 20:41:20.024 |  GET /api/trpc/association.list?batch=1&input=%7B%220%22%3A%7B%22json%22%3A%7B%22page%22%3A1%2C%22limit%22%3A10%2C%22search%22%3A%22f%22%2C%22crmStatuses%22%3Anull%2C%22pipelines%22%3Anull%2C%22types%22%3Anull%2C%22activities%22%3Anull%2C%22tags%22%3Anull%2C%22hasEmail%22%3Anull%2C%22hasPhone%22%3Anull%2C%22isMember%22%3Anull%2C%22assignedToId%22%3Anull%2C%22municipality%22%3Anull%2C%22municipalityId%22%3Anull%2C%22dateRange%22%3Anull%2C%22lastActivityDays%22%3Anull%2C%22sortBy%22%3A%22updatedAt%22%2C%22sortDirection%22%3A%22desc%22%2C%22useSearchIndex%22%3Afalse%7D%2C%22meta%22%3A%7B%22values%22%3A%7B%22crmStatuses%22%3A%5B%22undefined%22%5D%2C%22pipelines%22%3A%5B%22undefined%22%5D%2C%22types%22%3A%5B%22undefined%22%5D%2C%22activities%22%3A%5B%22undefined%22%5D%2C%22tags%22%3A%5B%22undefined%22%5D%2C%22hasEmail%22%3A%5B%22undefined%22%5D%2C%22hasPhone%22%3A%5B%22undefined%22%5D%2C%22isMember%22%3A%5B%22undefined%22%5D%2C%22assignedToId%22%3A%5B%22undefined%22%5D%2C%22municipality%22%3A%5B%22undefined%22%5D%2C%22municipalityId%22%3A%5B%22undefined%22%5D%2C%22dateRange%22%3A%5B%22undefined%22%5D%2C%22lastActivityDays%22%3A%5B%22undefined%22%5D%7D%2C%22v%22%3A1%7D%7D%7D 500 in 103ms
2025-10-27 20:41:20.024 | prisma:query SELECT 1
2025-10-27 20:41:20.027 | prisma:error 
2025-10-27 20:41:20.027 | Invalid `prisma.association.findMany()` invocation:
2025-10-27 20:41:20.027 | 
2025-10-27 20:41:20.027 | {
2025-10-27 20:41:20.027 |   where: {
2025-10-27 20:41:20.027 |     AND: [
2025-10-27 20:41:20.027 |       {
2025-10-27 20:41:20.027 |         OR: [
2025-10-27 20:41:20.027 |           {
2025-10-27 20:41:20.027 |             name: {
2025-10-27 20:41:20.027 |               contains: "f",
2025-10-27 20:41:20.027 |               mode: "insensitive"
2025-10-27 20:41:20.027 |             }
2025-10-27 20:41:20.027 |           },
2025-10-27 20:41:20.027 |           {
2025-10-27 20:41:20.027 |             orgNumber: {
2025-10-27 20:41:20.027 |               contains: "f",
2025-10-27 20:41:20.027 |               mode: "insensitive"
2025-10-27 20:41:20.027 |             }
2025-10-27 20:41:20.027 |           },
2025-10-27 20:41:20.027 |           {
2025-10-27 20:41:20.027 |             streetAddress: {
2025-10-27 20:41:20.027 |               contains: "f",
2025-10-27 20:41:20.027 |               mode: "insensitive"
2025-10-27 20:41:20.027 |             }
2025-10-27 20:41:20.027 |           },
2025-10-27 20:41:20.027 |           {
2025-10-27 20:41:20.027 |             city: {
2025-10-27 20:41:20.027 |               contains: "f",
2025-10-27 20:41:20.027 |               mode: "insensitive"
2025-10-27 20:41:20.027 |             }
2025-10-27 20:41:20.027 |           },
2025-10-27 20:41:20.027 |           {
2025-10-27 20:41:20.027 |             municipality: {
2025-10-27 20:41:20.027 |               contains: "f",
2025-10-27 20:41:20.027 |               mode: "insensitive"
2025-10-27 20:41:20.027 |             }
2025-10-27 20:41:20.027 |           },
2025-10-27 20:41:20.027 |           {
2025-10-27 20:41:20.028 |             email: {
2025-10-27 20:41:20.028 |               contains: "f",
2025-10-27 20:41:20.028 |               mode: "insensitive"
2025-10-27 20:41:20.028 |             }
2025-10-27 20:41:20.028 |           },
2025-10-27 20:41:20.028 |           {
2025-10-27 20:41:20.028 |             phone: {
2025-10-27 20:41:20.028 |               contains: "f",
2025-10-27 20:41:20.028 |               mode: "insensitive"
2025-10-27 20:41:20.028 |             }
2025-10-27 20:41:20.028 |           },
2025-10-27 20:41:20.028 |           {
2025-10-27 20:41:20.028 |             homepageUrl: {
2025-10-27 20:41:20.028 |               contains: "f",
2025-10-27 20:41:20.028 |               mode: "insensitive"
2025-10-27 20:41:20.028 |             }
2025-10-27 20:41:20.028 |           },
2025-10-27 20:41:20.028 |           {
2025-10-27 20:41:20.028 |             descriptionFreeText: {
2025-10-27 20:41:20.028 |               contains: "f",
2025-10-27 20:41:20.028 |               mode: "insensitive"
2025-10-27 20:41:20.028 |             }
2025-10-27 20:41:20.028 |           },
2025-10-27 20:41:20.028 |           {
2025-10-27 20:41:20.028 |             sourceSystem: {
2025-10-27 20:41:20.028 |               contains: "f",
2025-10-27 20:41:20.028 |               mode: "insensitive"
2025-10-27 20:41:20.028 |             }
2025-10-27 20:41:20.028 |           },
2025-10-27 20:41:20.028 |           {
2025-10-27 20:41:20.028 |             tags: {
2025-10-27 20:41:20.028 |               some: {
2025-10-27 20:41:20.028 |                 name: {
2025-10-27 20:41:20.028 |                   contains: "f",
2025-10-27 20:41:20.028 |                   mode: "insensitive"
2025-10-27 20:41:20.028 |                 }
2025-10-27 20:41:20.028 |               }
2025-10-27 20:41:20.028 |             }
2025-10-27 20:41:20.028 |           },
2025-10-27 20:41:20.028 |           {
2025-10-27 20:41:20.028 |             contacts: {
2025-10-27 20:41:20.028 |               some: {
2025-10-27 20:41:20.028 |                 OR: [
2025-10-27 20:41:20.028 |                   {
2025-10-27 20:41:20.028 |                     name: {
2025-10-27 20:41:20.028 |                       contains: "f",
2025-10-27 20:41:20.028 |                       mode: "insensitive"
2025-10-27 20:41:20.028 |                     }
2025-10-27 20:41:20.028 |                   },
2025-10-27 20:41:20.028 |                   {
2025-10-27 20:41:20.028 |                     role: {
2025-10-27 20:41:20.028 |                       contains: "f",
2025-10-27 20:41:20.028 |                       mode: "insensitive"
2025-10-27 20:41:20.028 |                     }
2025-10-27 20:41:20.028 |                   },
2025-10-27 20:41:20.028 |                   {
2025-10-27 20:41:20.028 |                     email: {
2025-10-27 20:41:20.028 |                       contains: "f",
2025-10-27 20:41:20.028 |                       mode: "insensitive"
2025-10-27 20:41:20.028 |                     }
2025-10-27 20:41:20.028 |                   },
2025-10-27 20:41:20.028 |                   {
2025-10-27 20:41:20.028 |                     phone: {
2025-10-27 20:41:20.028 |                       contains: "f",
2025-10-27 20:41:20.028 |                       mode: "insensitive"
2025-10-27 20:41:20.028 |                     }
2025-10-27 20:41:20.028 |                   },
2025-10-27 20:41:20.028 |                   {
2025-10-27 20:41:20.028 |                     mobile: {
2025-10-27 20:41:20.028 |                       contains: "f",
2025-10-27 20:41:20.028 |                       mode: "insensitive"
2025-10-27 20:41:20.028 |                     }
2025-10-27 20:41:20.028 |                   }
2025-10-27 20:41:20.028 |                 ]
2025-10-27 20:41:20.028 |               }
2025-10-27 20:41:20.028 |             }
2025-10-27 20:41:20.028 |           }
2025-10-27 20:41:20.028 |         ]
2025-10-27 20:41:20.028 |       }
2025-10-27 20:41:20.028 |     ]
2025-10-27 20:41:20.028 |   },
2025-10-27 20:41:20.028 |   skip: 0,
2025-10-27 20:41:20.028 |   take: 10,
2025-10-27 20:41:20.028 |   include: {
2025-10-27 20:41:20.028 |     contacts: {
2025-10-27 20:41:20.028 |       where: {
2025-10-27 20:41:20.028 |         isPrimary: true
2025-10-27 20:41:20.028 |       },
2025-10-27 20:41:20.028 |       take: 1
2025-10-27 20:41:20.028 |     },
2025-10-27 20:41:20.028 |     tags: true,
2025-10-27 20:41:20.028 |     _count: {
2025-10-27 20:41:20.028 |       select: {
2025-10-27 20:41:20.028 |         contacts: true,
2025-10-27 20:41:20.028 |         notes: true
2025-10-27 20:41:20.028 |       }
2025-10-27 20:41:20.028 |     },
2025-10-27 20:41:20.028 |     assignedTo: true,
2025-10-27 20:41:20.028 |     activityLog: {
2025-10-27 20:41:20.028 |       orderBy: {
2025-10-27 20:41:20.028 |         createdAt: "desc"
2025-10-27 20:41:20.028 |       },
2025-10-27 20:41:20.028 |       take: 1
2025-10-27 20:41:20.028 |     }
2025-10-27 20:41:20.028 |   },
2025-10-27 20:41:20.028 |   orderBy: {
2025-10-27 20:41:20.028 |     updatedAt: "desc"
2025-10-27 20:41:20.028 |   }
2025-10-27 20:41:20.028 | }
2025-10-27 20:41:20.028 | 
2025-10-27 20:41:20.028 | Unknown argument `mode`. Did you mean `lte`? Available options are marked with ?.
2025-10-27 20:41:20.403 | prisma:error 
2025-10-27 20:41:20.403 | Invalid `prisma.association.count()` invocation:
2025-10-27 20:41:20.403 | 
2025-10-27 20:41:20.403 | {
2025-10-27 20:41:20.403 |   select: {
2025-10-27 20:41:20.403 |     _count: {
2025-10-27 20:41:20.403 |       select: {
2025-10-27 20:41:20.403 |         _all: true
2025-10-27 20:41:20.403 |       }
2025-10-27 20:41:20.403 |     }
2025-10-27 20:41:20.403 |   },
2025-10-27 20:41:20.403 |   where: {
2025-10-27 20:41:20.403 |     AND: [
2025-10-27 20:41:20.403 |       {
2025-10-27 20:41:20.403 |         OR: [
2025-10-27 20:41:20.403 |           {
2025-10-27 20:41:20.403 |             name: {
2025-10-27 20:41:20.403 |               contains: "fo",
2025-10-27 20:41:20.403 |               mode: "insensitive"
2025-10-27 20:41:20.403 |             }
2025-10-27 20:41:20.403 |           },
2025-10-27 20:41:20.403 |           {
2025-10-27 20:41:20.403 |             orgNumber: {
2025-10-27 20:41:20.403 |               contains: "fo",
2025-10-27 20:41:20.403 |               mode: "insensitive"
2025-10-27 20:41:20.403 |             }
2025-10-27 20:41:20.403 |           },
2025-10-27 20:41:20.403 |           {
2025-10-27 20:41:20.403 |             streetAddress: {
2025-10-27 20:41:20.403 |               contains: "fo",
2025-10-27 20:41:20.403 |               mode: "insensitive"
2025-10-27 20:41:20.403 |             }
2025-10-27 20:41:20.403 |           },
2025-10-27 20:41:20.403 |           {
2025-10-27 20:41:20.403 |             city: {
2025-10-27 20:41:20.403 |               contains: "fo",
2025-10-27 20:41:20.403 |               mode: "insensitive"
2025-10-27 20:41:20.403 |             }
2025-10-27 20:41:20.403 |           },
2025-10-27 20:41:20.403 |           {
2025-10-27 20:41:20.403 |             municipality: {
2025-10-27 20:41:20.403 |               contains: "fo",
2025-10-27 20:41:20.403 |               mode: "insensitive"
2025-10-27 20:41:20.403 |             }
2025-10-27 20:41:20.403 |           },
2025-10-27 20:41:20.403 |           {
2025-10-27 20:41:20.403 |             email: {
2025-10-27 20:41:20.403 |               contains: "fo",
2025-10-27 20:41:20.403 |               mode: "insensitive"
2025-10-27 20:41:20.403 |             }
2025-10-27 20:41:20.404 |           },
2025-10-27 20:41:20.404 |           {
2025-10-27 20:41:20.404 |             phone: {
2025-10-27 20:41:20.404 |               contains: "fo",
2025-10-27 20:41:20.404 |               mode: "insensitive"
2025-10-27 20:41:20.404 |             }
2025-10-27 20:41:20.404 |           },
2025-10-27 20:41:20.404 |           {
2025-10-27 20:41:20.404 |             homepageUrl: {
2025-10-27 20:41:20.404 |               contains: "fo",
2025-10-27 20:41:20.404 |               mode: "insensitive"
2025-10-27 20:41:20.404 |             }
2025-10-27 20:41:20.404 |           },
2025-10-27 20:41:20.404 |           {
2025-10-27 20:41:20.404 |             descriptionFreeText: {
2025-10-27 20:41:20.404 |               contains: "fo",
2025-10-27 20:41:20.404 |               mode: "insensitive"
2025-10-27 20:41:20.404 |             }
2025-10-27 20:41:20.404 |           },
2025-10-27 20:41:20.404 |           {
2025-10-27 20:41:20.404 |             sourceSystem: {
2025-10-27 20:41:20.404 |               contains: "fo",
2025-10-27 20:41:20.404 |               mode: "insensitive"
2025-10-27 20:41:20.404 |             }
2025-10-27 20:41:20.404 |           },
2025-10-27 20:41:20.404 |           {
2025-10-27 20:41:20.404 |             tags: {
2025-10-27 20:41:20.404 |               some: {
2025-10-27 20:41:20.404 |                 name: {
2025-10-27 20:41:20.404 |                   contains: "fo",
2025-10-27 20:41:20.404 |                   mode: "insensitive"
2025-10-27 20:41:20.404 |                 }
2025-10-27 20:41:20.404 |               }
2025-10-27 20:41:20.404 |             }
2025-10-27 20:41:20.404 |           },
2025-10-27 20:41:20.404 |           {
2025-10-27 20:41:20.404 |             contacts: {
2025-10-27 20:41:20.404 |               some: {
2025-10-27 20:41:20.404 |                 OR: [
2025-10-27 20:41:20.404 |                   {
2025-10-27 20:41:20.404 |                     name: {
2025-10-27 20:41:20.404 |                       contains: "fo",
2025-10-27 20:41:20.404 |                       mode: "insensitive"
2025-10-27 20:41:20.404 |                     }
2025-10-27 20:41:20.404 |                   },
2025-10-27 20:41:20.404 |                   {
2025-10-27 20:41:20.404 |                     role: {
2025-10-27 20:41:20.404 |                       contains: "fo",
2025-10-27 20:41:20.404 |                       mode: "insensitive"
2025-10-27 20:41:20.404 |                     }
2025-10-27 20:41:20.404 |                   },
2025-10-27 20:41:20.404 |                   {
2025-10-27 20:41:20.404 |                     email: {
2025-10-27 20:41:20.404 |                       contains: "fo",
2025-10-27 20:41:20.404 |                       mode: "insensitive"
2025-10-27 20:41:20.404 |                     }
2025-10-27 20:41:20.404 |                   },
2025-10-27 20:41:20.404 |                   {
2025-10-27 20:41:20.404 |                     phone: {
2025-10-27 20:41:20.404 |                       contains: "fo",
2025-10-27 20:41:20.404 |                       mode: "insensitive"
2025-10-27 20:41:20.404 |                     }
2025-10-27 20:41:20.404 |                   },
2025-10-27 20:41:20.404 |                   {
2025-10-27 20:41:20.404 |                     mobile: {
2025-10-27 20:41:20.404 |                       contains: "fo",
2025-10-27 20:41:20.404 |                       mode: "insensitive"
2025-10-27 20:41:20.404 |                     }
2025-10-27 20:41:20.404 |                   }
2025-10-27 20:41:20.404 |                 ]
2025-10-27 20:41:20.404 |               }
2025-10-27 20:41:20.404 |             }
2025-10-27 20:41:20.404 |           }
2025-10-27 20:41:20.404 |         ]
2025-10-27 20:41:20.404 |       }
2025-10-27 20:41:20.404 |     ]
2025-10-27 20:41:20.404 |   }
2025-10-27 20:41:20.404 | }
2025-10-27 20:41:20.404 | 
2025-10-27 20:41:20.404 | Unknown argument `mode`. Did you mean `lte`? Available options are marked with ?.
2025-10-27 20:41:20.407 |  GET /api/trpc/association.list?batch=1&input=%7B%220%22%3A%7B%22json%22%3A%7B%22page%22%3A1%2C%22limit%22%3A10%2C%22search%22%3A%22fo%22%2C%22crmStatuses%22%3Anull%2C%22pipelines%22%3Anull%2C%22types%22%3Anull%2C%22activities%22%3Anull%2C%22tags%22%3Anull%2C%22hasEmail%22%3Anull%2C%22hasPhone%22%3Anull%2C%22isMember%22%3Anull%2C%22assignedToId%22%3Anull%2C%22municipality%22%3Anull%2C%22municipalityId%22%3Anull%2C%22dateRange%22%3Anull%2C%22lastActivityDays%22%3Anull%2C%22sortBy%22%3A%22updatedAt%22%2C%22sortDirection%22%3A%22desc%22%2C%22useSearchIndex%22%3Afalse%7D%2C%22meta%22%3A%7B%22values%22%3A%7B%22crmStatuses%22%3A%5B%22undefined%22%5D%2C%22pipelines%22%3A%5B%22undefined%22%5D%2C%22types%22%3A%5B%22undefined%22%5D%2C%22activities%22%3A%5B%22undefined%22%5D%2C%22tags%22%3A%5B%22undefined%22%5D%2C%22hasEmail%22%3A%5B%22undefined%22%5D%2C%22hasPhone%22%3A%5B%22undefined%22%5D%2C%22isMember%22%3A%5B%22undefined%22%5D%2C%22assignedToId%22%3A%5B%22undefined%22%5D%2C%22municipality%22%3A%5B%22undefined%22%5D%2C%22municipalityId%22%3A%5B%22undefined%22%5D%2C%22dateRange%22%3A%5B%22undefined%22%5D%2C%22lastActivityDays%22%3A%5B%22undefined%22%5D%7D%2C%22v%22%3A1%7D%7D%7D 500 in 78ms
2025-10-27 20:41:20.410 | prisma:error 
2025-10-27 20:41:20.410 | Invalid `prisma.association.findMany()` invocation:
2025-10-27 20:41:20.410 | 
2025-10-27 20:41:20.410 | {
2025-10-27 20:41:20.410 |   where: {
2025-10-27 20:41:20.410 |     AND: [
2025-10-27 20:41:20.410 |       {
2025-10-27 20:41:20.410 |         OR: [
2025-10-27 20:41:20.410 |           {
2025-10-27 20:41:20.410 |             name: {
2025-10-27 20:41:20.410 |               contains: "fo",
2025-10-27 20:41:20.410 |               mode: "insensitive"
2025-10-27 20:41:20.410 |             }
2025-10-27 20:41:20.410 |           },
2025-10-27 20:41:20.410 |           {
2025-10-27 20:41:20.410 |             orgNumber: {
2025-10-27 20:41:20.410 |               contains: "fo",
2025-10-27 20:41:20.410 |               mode: "insensitive"
2025-10-27 20:41:20.410 |             }
2025-10-27 20:41:20.410 |           },
2025-10-27 20:41:20.410 |           {
2025-10-27 20:41:20.410 |             streetAddress: {
2025-10-27 20:41:20.410 |               contains: "fo",
2025-10-27 20:41:20.410 |               mode: "insensitive"
2025-10-27 20:41:20.410 |             }
2025-10-27 20:41:20.410 |           },
2025-10-27 20:41:20.410 |           {
2025-10-27 20:41:20.410 |             city: {
2025-10-27 20:41:20.410 |               contains: "fo",
2025-10-27 20:41:20.410 |               mode: "insensitive"
2025-10-27 20:41:20.410 |             }
2025-10-27 20:41:20.410 |           },
2025-10-27 20:41:20.410 |           {
2025-10-27 20:41:20.410 |             municipality: {
2025-10-27 20:41:20.410 |               contains: "fo",
2025-10-27 20:41:20.410 |               mode: "insensitive"
2025-10-27 20:41:20.410 |             }
2025-10-27 20:41:20.410 |           },
2025-10-27 20:41:20.410 |           {
2025-10-27 20:41:20.410 |             email: {
2025-10-27 20:41:20.410 |               contains: "fo",
2025-10-27 20:41:20.410 |               mode: "insensitive"
2025-10-27 20:41:20.410 |             }
2025-10-27 20:41:20.410 |           },
2025-10-27 20:41:20.410 |           {
2025-10-27 20:41:20.410 |             phone: {
2025-10-27 20:41:20.410 |               contains: "fo",
2025-10-27 20:41:20.410 |               mode: "insensitive"
2025-10-27 20:41:20.410 |             }
2025-10-27 20:41:20.410 |           },
2025-10-27 20:41:20.410 |           {
2025-10-27 20:41:20.410 |             homepageUrl: {
2025-10-27 20:41:20.410 |               contains: "fo",
2025-10-27 20:41:20.410 |               mode: "insensitive"
2025-10-27 20:41:20.410 |             }
2025-10-27 20:41:20.410 |           },
2025-10-27 20:41:20.410 |           {
2025-10-27 20:41:20.410 |             descriptionFreeText: {
2025-10-27 20:41:20.410 |               contains: "fo",
2025-10-27 20:41:20.410 |               mode: "insensitive"
2025-10-27 20:41:20.410 |             }
2025-10-27 20:41:20.410 |           },
2025-10-27 20:41:20.410 |           {
2025-10-27 20:41:20.410 |             sourceSystem: {
2025-10-27 20:41:20.410 |               contains: "fo",
2025-10-27 20:41:20.410 |               mode: "insensitive"
2025-10-27 20:41:20.411 |             }
2025-10-27 20:41:20.411 |           },
2025-10-27 20:41:20.411 |           {
2025-10-27 20:41:20.411 |             tags: {
2025-10-27 20:41:20.411 |               some: {
2025-10-27 20:41:20.411 |                 name: {
2025-10-27 20:41:20.411 |                   contains: "fo",
2025-10-27 20:41:20.411 |                   mode: "insensitive"
2025-10-27 20:41:20.411 |                 }
2025-10-27 20:41:20.411 |               }
2025-10-27 20:41:20.411 |             }
2025-10-27 20:41:20.411 |           },
2025-10-27 20:41:20.411 |           {
2025-10-27 20:41:20.411 |             contacts: {
2025-10-27 20:41:20.411 |               some: {
2025-10-27 20:41:20.411 |                 OR: [
2025-10-27 20:41:20.411 |                   {
2025-10-27 20:41:20.411 |                     name: {
2025-10-27 20:41:20.411 |                       contains: "fo",
2025-10-27 20:41:20.411 |                       mode: "insensitive"
2025-10-27 20:41:20.411 |                     }
2025-10-27 20:41:20.411 |                   },
2025-10-27 20:41:20.411 |                   {
2025-10-27 20:41:20.411 |                     role: {
2025-10-27 20:41:20.411 |                       contains: "fo",
2025-10-27 20:41:20.411 |                       mode: "insensitive"
2025-10-27 20:41:20.411 |                     }
2025-10-27 20:41:20.411 |                   },
2025-10-27 20:41:20.411 |                   {
2025-10-27 20:41:20.411 |                     email: {
2025-10-27 20:41:20.411 |                       contains: "fo",
2025-10-27 20:41:20.411 |                       mode: "insensitive"
2025-10-27 20:41:20.411 |                     }
2025-10-27 20:41:20.411 |                   },
2025-10-27 20:41:20.411 |                   {
2025-10-27 20:41:20.411 |                     phone: {
2025-10-27 20:41:20.411 |                       contains: "fo",
2025-10-27 20:41:20.411 |                       mode: "insensitive"
2025-10-27 20:41:20.411 |                     }
2025-10-27 20:41:20.411 |                   },
2025-10-27 20:41:20.411 |                   {
2025-10-27 20:41:20.411 |                     mobile: {
2025-10-27 20:41:20.411 |                       contains: "fo",
2025-10-27 20:41:20.411 |                       mode: "insensitive"
2025-10-27 20:41:20.411 |                     }
2025-10-27 20:41:20.411 |                   }
2025-10-27 20:41:20.411 |                 ]
2025-10-27 20:41:20.411 |               }
2025-10-27 20:41:20.411 |             }
2025-10-27 20:41:20.411 |           }
2025-10-27 20:41:20.411 |         ]
2025-10-27 20:41:20.411 |       }
2025-10-27 20:41:20.411 |     ]
2025-10-27 20:41:20.411 |   },
2025-10-27 20:41:20.411 |   skip: 0,
2025-10-27 20:41:20.411 |   take: 10,
2025-10-27 20:41:20.411 |   include: {
2025-10-27 20:41:20.411 |     contacts: {
2025-10-27 20:41:20.411 |       where: {
2025-10-27 20:41:20.411 |         isPrimary: true
2025-10-27 20:41:20.411 |       },
2025-10-27 20:41:20.411 |       take: 1
2025-10-27 20:41:20.411 |     },
2025-10-27 20:41:20.411 |     tags: true,
2025-10-27 20:41:20.411 |     _count: {
2025-10-27 20:41:20.411 |       select: {
2025-10-27 20:41:20.411 |         contacts: true,
2025-10-27 20:41:20.411 |         notes: true
2025-10-27 20:41:20.411 |       }
2025-10-27 20:41:20.411 |     },
2025-10-27 20:41:20.411 |     assignedTo: true,
2025-10-27 20:41:20.411 |     activityLog: {
2025-10-27 20:41:20.411 |       orderBy: {
2025-10-27 20:41:20.411 |         createdAt: "desc"
2025-10-27 20:41:20.411 |       },
2025-10-27 20:41:20.411 |       take: 1
2025-10-27 20:41:20.411 |     }
2025-10-27 20:41:20.411 |   },
2025-10-27 20:41:20.411 |   orderBy: {
2025-10-27 20:41:20.411 |     updatedAt: "desc"
2025-10-27 20:41:20.411 |   }
2025-10-27 20:41:20.411 | }
2025-10-27 20:41:20.411 | 
2025-10-27 20:41:20.411 | Unknown argument `mode`. Did you mean `lte`? Available options are marked with ?.
2025-10-27 20:41:20.868 | prisma:error 
2025-10-27 20:41:20.868 | Invalid `prisma.association.count()` invocation:
2025-10-27 20:41:20.868 | 
2025-10-27 20:41:20.868 | {
2025-10-27 20:41:20.868 |   select: {
2025-10-27 20:41:20.868 |     _count: {
2025-10-27 20:41:20.868 |       select: {
2025-10-27 20:41:20.868 |         _all: true
2025-10-27 20:41:20.868 |       }
2025-10-27 20:41:20.868 |     }
2025-10-27 20:41:20.868 |   },
2025-10-27 20:41:20.868 |   where: {
2025-10-27 20:41:20.868 |     AND: [
2025-10-27 20:41:20.868 |       {
2025-10-27 20:41:20.868 |         OR: [
2025-10-27 20:41:20.868 |           {
2025-10-27 20:41:20.868 |             name: {
2025-10-27 20:41:20.868 |               contains: "fot",
2025-10-27 20:41:20.868 |               mode: "insensitive"
2025-10-27 20:41:20.868 |             }
2025-10-27 20:41:20.868 |           },
2025-10-27 20:41:20.868 |           {
2025-10-27 20:41:20.868 |             orgNumber: {
2025-10-27 20:41:20.868 |               contains: "fot",
2025-10-27 20:41:20.868 |               mode: "insensitive"
2025-10-27 20:41:20.868 |             }
2025-10-27 20:41:20.868 |           },
2025-10-27 20:41:20.868 |           {
2025-10-27 20:41:20.868 |             streetAddress: {
2025-10-27 20:41:20.868 |               contains: "fot",
2025-10-27 20:41:20.868 |               mode: "insensitive"
2025-10-27 20:41:20.868 |             }
2025-10-27 20:41:20.868 |           },
2025-10-27 20:41:20.868 |           {
2025-10-27 20:41:20.868 |             city: {
2025-10-27 20:41:20.868 |               contains: "fot",
2025-10-27 20:41:20.868 |               mode: "insensitive"
2025-10-27 20:41:20.868 |             }
2025-10-27 20:41:20.868 |           },
2025-10-27 20:41:20.868 |           {
2025-10-27 20:41:20.868 |             municipality: {
2025-10-27 20:41:20.868 |               contains: "fot",
2025-10-27 20:41:20.868 |               mode: "insensitive"
2025-10-27 20:41:20.868 |             }
2025-10-27 20:41:20.868 |           },
2025-10-27 20:41:20.868 |           {
2025-10-27 20:41:20.868 |             email: {
2025-10-27 20:41:20.868 |               contains: "fot",
2025-10-27 20:41:20.868 |               mode: "insensitive"
2025-10-27 20:41:20.868 |             }
2025-10-27 20:41:20.868 |           },
2025-10-27 20:41:20.868 |           {
2025-10-27 20:41:20.868 |             phone: {
2025-10-27 20:41:20.868 |               contains: "fot",
2025-10-27 20:41:20.868 |               mode: "insensitive"
2025-10-27 20:41:20.868 |             }
2025-10-27 20:41:20.868 |           },
2025-10-27 20:41:20.868 |           {
2025-10-27 20:41:20.868 |             homepageUrl: {
2025-10-27 20:41:20.868 |               contains: "fot",
2025-10-27 20:41:20.868 |               mode: "insensitive"
2025-10-27 20:41:20.868 |             }
2025-10-27 20:41:20.868 |           },
2025-10-27 20:41:20.868 |           {
2025-10-27 20:41:20.868 |             descriptionFreeText: {
2025-10-27 20:41:20.868 |               contains: "fot",
2025-10-27 20:41:20.868 |               mode: "insensitive"
2025-10-27 20:41:20.868 |             }
2025-10-27 20:41:20.868 |           },
2025-10-27 20:41:20.868 |           {
2025-10-27 20:41:20.868 |             sourceSystem: {
2025-10-27 20:41:20.868 |               contains: "fot",
2025-10-27 20:41:20.868 |               mode: "insensitive"
2025-10-27 20:41:20.868 |             }
2025-10-27 20:41:20.868 |           },
2025-10-27 20:41:20.868 |           {
2025-10-27 20:41:20.868 |             tags: {
2025-10-27 20:41:20.868 |               some: {
2025-10-27 20:41:20.868 |                 name: {
2025-10-27 20:41:20.868 |                   contains: "fot",
2025-10-27 20:41:20.868 |                   mode: "insensitive"
2025-10-27 20:41:20.868 |                 }
2025-10-27 20:41:20.868 |               }
2025-10-27 20:41:20.868 |             }
2025-10-27 20:41:20.868 |           },
2025-10-27 20:41:20.868 |           {
2025-10-27 20:41:20.868 |             contacts: {
2025-10-27 20:41:20.868 |               some: {
2025-10-27 20:41:20.868 |                 OR: [
2025-10-27 20:41:20.868 |                   {
2025-10-27 20:41:20.868 |                     name: {
2025-10-27 20:41:20.868 |                       contains: "fot",
2025-10-27 20:41:20.868 |                       mode: "insensitive"
2025-10-27 20:41:20.868 |                     }
2025-10-27 20:41:20.868 |                   },
2025-10-27 20:41:20.868 |                   {
2025-10-27 20:41:20.868 |                     role: {
2025-10-27 20:41:20.868 |                       contains: "fot",
2025-10-27 20:41:20.868 |                       mode: "insensitive"
2025-10-27 20:41:20.868 |                     }
2025-10-27 20:41:20.868 |                   },
2025-10-27 20:41:20.868 |                   {
2025-10-27 20:41:20.868 |                     email: {
2025-10-27 20:41:20.868 |                       contains: "fot",
2025-10-27 20:41:20.868 |                       mode: "insensitive"
2025-10-27 20:41:20.868 |                     }
2025-10-27 20:41:20.868 |                   },
2025-10-27 20:41:20.868 |                   {
2025-10-27 20:41:20.868 |                     phone: {
2025-10-27 20:41:20.868 |                       contains: "fot",
2025-10-27 20:41:20.868 |                       mode: "insensitive"
2025-10-27 20:41:20.868 |                     }
2025-10-27 20:41:20.868 |                   },
2025-10-27 20:41:20.868 |                   {
2025-10-27 20:41:20.868 |                     mobile: {
2025-10-27 20:41:20.868 |                       contains: "fot",
2025-10-27 20:41:20.868 |                       mode: "insensitive"
2025-10-27 20:41:20.868 |                     }
2025-10-27 20:41:20.868 |                   }
2025-10-27 20:41:20.868 |                 ]
2025-10-27 20:41:20.868 |               }
2025-10-27 20:41:20.868 |             }
2025-10-27 20:41:20.868 |           }
2025-10-27 20:41:20.868 |         ]
2025-10-27 20:41:20.868 |       }
2025-10-27 20:41:20.868 |     ]
2025-10-27 20:41:20.868 |   }
2025-10-27 20:41:20.868 | }
2025-10-27 20:41:20.868 | 
2025-10-27 20:41:20.868 | Unknown argument `mode`. Did you mean `lte`? Available options are marked with ?.
2025-10-27 20:41:20.872 |  GET /api/trpc/association.list?batch=1&input=%7B%220%22%3A%7B%22json%22%3A%7B%22page%22%3A1%2C%22limit%22%3A10%2C%22search%22%3A%22fot%22%2C%22crmStatuses%22%3Anull%2C%22pipelines%22%3Anull%2C%22types%22%3Anull%2C%22activities%22%3Anull%2C%22tags%22%3Anull%2C%22hasEmail%22%3Anull%2C%22hasPhone%22%3Anull%2C%22isMember%22%3Anull%2C%22assignedToId%22%3Anull%2C%22municipality%22%3Anull%2C%22municipalityId%22%3Anull%2C%22dateRange%22%3Anull%2C%22lastActivityDays%22%3Anull%2C%22sortBy%22%3A%22updatedAt%22%2C%22sortDirection%22%3A%22desc%22%2C%22useSearchIndex%22%3Afalse%7D%2C%22meta%22%3A%7B%22values%22%3A%7B%22crmStatuses%22%3A%5B%22undefined%22%5D%2C%22pipelines%22%3A%5B%22undefined%22%5D%2C%22types%22%3A%5B%22undefined%22%5D%2C%22activities%22%3A%5B%22undefined%22%5D%2C%22tags%22%3A%5B%22undefined%22%5D%2C%22hasEmail%22%3A%5B%22undefined%22%5D%2C%22hasPhone%22%3A%5B%22undefined%22%5D%2C%22isMember%22%3A%5B%22undefined%22%5D%2C%22assignedToId%22%3A%5B%22undefined%22%5D%2C%22municipality%22%3A%5B%22undefined%22%5D%2C%22municipalityId%22%3A%5B%22undefined%22%5D%2C%22dateRange%22%3A%5B%22undefined%22%5D%2C%22lastActivityDays%22%3A%5B%22undefined%22%5D%7D%2C%22v%22%3A1%7D%7D%7D 500 in 78ms
2025-10-27 20:41:20.874 | prisma:error 
2025-10-27 20:41:20.874 | Invalid `prisma.association.findMany()` invocation:
2025-10-27 20:41:20.874 | 
2025-10-27 20:41:20.874 | {
2025-10-27 20:41:20.874 |   where: {
2025-10-27 20:41:20.874 |     AND: [
2025-10-27 20:41:20.874 |       {
2025-10-27 20:41:20.874 |         OR: [
2025-10-27 20:41:20.874 |           {
2025-10-27 20:41:20.874 |             name: {
2025-10-27 20:41:20.874 |               contains: "fot",
2025-10-27 20:41:20.874 |               mode: "insensitive"
2025-10-27 20:41:20.874 |             }
2025-10-27 20:41:20.874 |           },
2025-10-27 20:41:20.874 |           {
2025-10-27 20:41:20.874 |             orgNumber: {
2025-10-27 20:41:20.874 |               contains: "fot",
2025-10-27 20:41:20.874 |               mode: "insensitive"
2025-10-27 20:41:20.874 |             }
2025-10-27 20:41:20.874 |           },
2025-10-27 20:41:20.874 |           {
2025-10-27 20:41:20.874 |             streetAddress: {
2025-10-27 20:41:20.874 |               contains: "fot",
2025-10-27 20:41:20.874 |               mode: "insensitive"
2025-10-27 20:41:20.874 |             }
2025-10-27 20:41:20.874 |           },
2025-10-27 20:41:20.874 |           {
2025-10-27 20:41:20.874 |             city: {
2025-10-27 20:41:20.874 |               contains: "fot",
2025-10-27 20:41:20.874 |               mode: "insensitive"
2025-10-27 20:41:20.874 |             }
2025-10-27 20:41:20.874 |           },
2025-10-27 20:41:20.874 |           {
2025-10-27 20:41:20.874 |             municipality: {
2025-10-27 20:41:20.874 |               contains: "fot",
2025-10-27 20:41:20.874 |               mode: "insensitive"
2025-10-27 20:41:20.874 |             }
2025-10-27 20:41:20.874 |           },
2025-10-27 20:41:20.874 |           {
2025-10-27 20:41:20.874 |             email: {
2025-10-27 20:41:20.874 |               contains: "fot",
2025-10-27 20:41:20.874 |               mode: "insensitive"
2025-10-27 20:41:20.874 |             }
2025-10-27 20:41:20.874 |           },
2025-10-27 20:41:20.874 |           {
2025-10-27 20:41:20.874 |             phone: {
2025-10-27 20:41:20.874 |               contains: "fot",
2025-10-27 20:41:20.874 |               mode: "insensitive"
2025-10-27 20:41:20.874 |             }
2025-10-27 20:41:20.874 |           },
2025-10-27 20:41:20.875 |           {
2025-10-27 20:41:20.875 |             homepageUrl: {
2025-10-27 20:41:20.875 |               contains: "fot",
2025-10-27 20:41:20.875 |               mode: "insensitive"
2025-10-27 20:41:20.875 |             }
2025-10-27 20:41:20.875 |           },
2025-10-27 20:41:20.875 |           {
2025-10-27 20:41:20.875 |             descriptionFreeText: {
2025-10-27 20:41:20.875 |               contains: "fot",
2025-10-27 20:41:20.875 |               mode: "insensitive"
2025-10-27 20:41:20.875 |             }
2025-10-27 20:41:20.875 |           },
2025-10-27 20:41:20.875 |           {
2025-10-27 20:41:20.875 |             sourceSystem: {
2025-10-27 20:41:20.875 |               contains: "fot",
2025-10-27 20:41:20.875 |               mode: "insensitive"
2025-10-27 20:41:20.875 |             }
2025-10-27 20:41:20.875 |           },
2025-10-27 20:41:20.875 |           {
2025-10-27 20:41:20.875 |             tags: {
2025-10-27 20:41:20.875 |               some: {
2025-10-27 20:41:20.875 |                 name: {
2025-10-27 20:41:20.875 |                   contains: "fot",
2025-10-27 20:41:20.875 |                   mode: "insensitive"
2025-10-27 20:41:20.875 |                 }
2025-10-27 20:41:20.875 |               }
2025-10-27 20:41:20.875 |             }
2025-10-27 20:41:20.875 |           },
2025-10-27 20:41:20.875 |           {
2025-10-27 20:41:20.875 |             contacts: {
2025-10-27 20:41:20.875 |               some: {
2025-10-27 20:41:20.875 |                 OR: [
2025-10-27 20:41:20.875 |                   {
2025-10-27 20:41:20.875 |                     name: {
2025-10-27 20:41:20.875 |                       contains: "fot",
2025-10-27 20:41:20.875 |                       mode: "insensitive"
2025-10-27 20:41:20.875 |                     }
2025-10-27 20:41:20.875 |                   },
2025-10-27 20:41:20.875 |                   {
2025-10-27 20:41:20.875 |                     role: {
2025-10-27 20:41:20.875 |                       contains: "fot",
2025-10-27 20:41:20.875 |                       mode: "insensitive"
2025-10-27 20:41:20.875 |                     }
2025-10-27 20:41:20.875 |                   },
2025-10-27 20:41:20.875 |                   {
2025-10-27 20:41:20.875 |                     email: {
2025-10-27 20:41:20.875 |                       contains: "fot",
2025-10-27 20:41:20.875 |                       mode: "insensitive"
2025-10-27 20:41:20.875 |                     }
2025-10-27 20:41:20.875 |                   },
2025-10-27 20:41:20.875 |                   {
2025-10-27 20:41:20.875 |                     phone: {
2025-10-27 20:41:20.875 |                       contains: "fot",
2025-10-27 20:41:20.875 |                       mode: "insensitive"
2025-10-27 20:41:20.875 |                     }
2025-10-27 20:41:20.875 |                   },
2025-10-27 20:41:20.875 |                   {
2025-10-27 20:41:20.875 |                     mobile: {
2025-10-27 20:41:20.875 |                       contains: "fot",
2025-10-27 20:41:20.875 |                       mode: "insensitive"
2025-10-27 20:41:20.875 |                     }
2025-10-27 20:41:20.875 |                   }
2025-10-27 20:41:20.875 |                 ]
2025-10-27 20:41:20.875 |               }
2025-10-27 20:41:20.875 |             }
2025-10-27 20:41:20.875 |           }
2025-10-27 20:41:20.875 |         ]
2025-10-27 20:41:20.875 |       }
2025-10-27 20:41:20.875 |     ]
2025-10-27 20:41:20.875 |   },
2025-10-27 20:41:20.875 |   skip: 0,
2025-10-27 20:41:20.875 |   take: 10,
2025-10-27 20:41:20.875 |   include: {
2025-10-27 20:41:20.875 |     contacts: {
2025-10-27 20:41:20.875 |       where: {
2025-10-27 20:41:20.875 |         isPrimary: true
2025-10-27 20:41:20.875 |       },
2025-10-27 20:41:20.875 |       take: 1
2025-10-27 20:41:20.875 |     },
2025-10-27 20:41:20.875 |     tags: true,
2025-10-27 20:41:20.875 |     _count: {
2025-10-27 20:41:20.875 |       select: {
2025-10-27 20:41:20.875 |         contacts: true,
2025-10-27 20:41:20.875 |         notes: true
2025-10-27 20:41:20.875 |       }
2025-10-27 20:41:20.875 |     },
2025-10-27 20:41:20.875 |     assignedTo: true,
2025-10-27 20:41:20.875 |     activityLog: {
2025-10-27 20:41:20.875 |       orderBy: {
2025-10-27 20:41:20.875 |         createdAt: "desc"
2025-10-27 20:41:20.875 |       },
2025-10-27 20:41:20.875 |       take: 1
2025-10-27 20:41:20.875 |     }
2025-10-27 20:41:20.875 |   },
2025-10-27 20:41:20.875 |   orderBy: {
2025-10-27 20:41:20.875 |     updatedAt: "desc"
2025-10-27 20:41:20.875 |   }
2025-10-27 20:41:20.875 | }
2025-10-27 20:41:20.875 | 
2025-10-27 20:41:20.875 | Unknown argument `mode`. Did you mean `lte`? Available options are marked with ?.
2025-10-27 20:41:22.025 | prisma:error 
2025-10-27 20:41:22.025 | Invalid `prisma.association.count()` invocation:
2025-10-27 20:41:22.025 | 
2025-10-27 20:41:22.026 | {
2025-10-27 20:41:22.026 |   select: {
2025-10-27 20:41:22.026 |     _count: {
2025-10-27 20:41:22.026 |       select: {
2025-10-27 20:41:22.026 |         _all: true
2025-10-27 20:41:22.026 |       }
2025-10-27 20:41:22.026 |     }
2025-10-27 20:41:22.026 |   },
2025-10-27 20:41:22.026 |   where: {
2025-10-27 20:41:22.026 |     AND: [
2025-10-27 20:41:22.026 |       {
2025-10-27 20:41:22.026 |         OR: [
2025-10-27 20:41:22.026 |           {
2025-10-27 20:41:22.026 |             name: {
2025-10-27 20:41:22.026 |               contains: "fot",
2025-10-27 20:41:22.026 |               mode: "insensitive"
2025-10-27 20:41:22.026 |             }
2025-10-27 20:41:22.026 |           },
2025-10-27 20:41:22.026 |           {
2025-10-27 20:41:22.026 |             orgNumber: {
2025-10-27 20:41:22.026 |               contains: "fot",
2025-10-27 20:41:22.026 |               mode: "insensitive"
2025-10-27 20:41:22.026 |             }
2025-10-27 20:41:22.026 |           },
2025-10-27 20:41:22.026 |           {
2025-10-27 20:41:22.026 |             streetAddress: {
2025-10-27 20:41:22.026 |               contains: "fot",
2025-10-27 20:41:22.026 |               mode: "insensitive"
2025-10-27 20:41:22.026 |             }
2025-10-27 20:41:22.026 |           },
2025-10-27 20:41:22.026 |           {
2025-10-27 20:41:22.026 |             city: {
2025-10-27 20:41:22.026 |               contains: "fot",
2025-10-27 20:41:22.026 |               mode: "insensitive"
2025-10-27 20:41:22.026 |             }
2025-10-27 20:41:22.026 |           },
2025-10-27 20:41:22.026 |           {
2025-10-27 20:41:22.026 |             municipality: {
2025-10-27 20:41:22.026 |               contains: "fot",
2025-10-27 20:41:22.026 |               mode: "insensitive"
2025-10-27 20:41:22.026 |             }
2025-10-27 20:41:22.026 |           },
2025-10-27 20:41:22.026 |           {
2025-10-27 20:41:22.026 |             email: {
2025-10-27 20:41:22.026 |               contains: "fot",
2025-10-27 20:41:22.026 |               mode: "insensitive"
2025-10-27 20:41:22.026 |             }
2025-10-27 20:41:22.026 |           },
2025-10-27 20:41:22.026 |           {
2025-10-27 20:41:22.026 |             phone: {
2025-10-27 20:41:22.026 |               contains: "fot",
2025-10-27 20:41:22.026 |               mode: "insensitive"
2025-10-27 20:41:22.026 |             }
2025-10-27 20:41:22.026 |           },
2025-10-27 20:41:22.026 |           {
2025-10-27 20:41:22.026 |             homepageUrl: {
2025-10-27 20:41:22.026 |               contains: "fot",
2025-10-27 20:41:22.026 |               mode: "insensitive"
2025-10-27 20:41:22.026 |             }
2025-10-27 20:41:22.026 |           },
2025-10-27 20:41:22.026 |           {
2025-10-27 20:41:22.026 |             descriptionFreeText: {
2025-10-27 20:41:22.026 |               contains: "fot",
2025-10-27 20:41:22.026 |               mode: "insensitive"
2025-10-27 20:41:22.026 |             }
2025-10-27 20:41:22.026 |           },
2025-10-27 20:41:22.026 |           {
2025-10-27 20:41:22.026 |             sourceSystem: {
2025-10-27 20:41:22.026 |               contains: "fot",
2025-10-27 20:41:22.026 |               mode: "insensitive"
2025-10-27 20:41:22.026 |             }
2025-10-27 20:41:22.026 |           },
2025-10-27 20:41:22.026 |           {
2025-10-27 20:41:22.026 |             tags: {
2025-10-27 20:41:22.026 |               some: {
2025-10-27 20:41:22.026 |                 name: {
2025-10-27 20:41:22.026 |                   contains: "fot",
2025-10-27 20:41:22.026 |                   mode: "insensitive"
2025-10-27 20:41:22.026 |                 }
2025-10-27 20:41:22.026 |               }
2025-10-27 20:41:22.026 |             }
2025-10-27 20:41:22.026 |           },
2025-10-27 20:41:22.026 |           {
2025-10-27 20:41:22.026 |             contacts: {
2025-10-27 20:41:22.026 |               some: {
2025-10-27 20:41:22.026 |                 OR: [
2025-10-27 20:41:22.026 |                   {
2025-10-27 20:41:22.026 |                     name: {
2025-10-27 20:41:22.026 |                       contains: "fot",
2025-10-27 20:41:22.026 |                       mode: "insensitive"
2025-10-27 20:41:22.026 |                     }
2025-10-27 20:41:22.026 |                   },
2025-10-27 20:41:22.026 |                   {
2025-10-27 20:41:22.026 |                     role: {
2025-10-27 20:41:22.026 |                       contains: "fot",
2025-10-27 20:41:22.026 |                       mode: "insensitive"
2025-10-27 20:41:22.026 |                     }
2025-10-27 20:41:22.026 |                   },
2025-10-27 20:41:22.026 |                   {
2025-10-27 20:41:22.026 |                     email: {
2025-10-27 20:41:22.026 |                       contains: "fot",
2025-10-27 20:41:22.026 |                       mode: "insensitive"
2025-10-27 20:41:22.026 |                     }
2025-10-27 20:41:22.026 |                   },
2025-10-27 20:41:22.026 |                   {
2025-10-27 20:41:22.026 |                     phone: {
2025-10-27 20:41:22.026 |                       contains: "fot",
2025-10-27 20:41:22.026 |                       mode: "insensitive"
2025-10-27 20:41:22.026 |                     }
2025-10-27 20:41:22.026 |                   },
2025-10-27 20:41:22.026 |                   {
2025-10-27 20:41:22.026 |                     mobile: {
2025-10-27 20:41:22.026 |                       contains: "fot",
2025-10-27 20:41:22.026 |                       mode: "insensitive"
2025-10-27 20:41:22.026 |                     }
2025-10-27 20:41:22.026 |                   }
2025-10-27 20:41:22.026 |                 ]
2025-10-27 20:41:22.026 |               }
2025-10-27 20:41:22.026 |             }
2025-10-27 20:41:22.026 |           }
2025-10-27 20:41:22.026 |         ]
2025-10-27 20:41:22.026 |       }
2025-10-27 20:41:22.026 |     ]
2025-10-27 20:41:22.026 |   }
2025-10-27 20:41:22.026 | }
2025-10-27 20:41:22.026 | 
2025-10-27 20:41:22.026 | Unknown argument `mode`. Did you mean `lte`? Available options are marked with ?.
2025-10-27 20:41:22.029 |  GET /api/trpc/association.list?batch=1&input=%7B%220%22%3A%7B%22json%22%3A%7B%22page%22%3A1%2C%22limit%22%3A10%2C%22search%22%3A%22fot%22%2C%22crmStatuses%22%3Anull%2C%22pipelines%22%3Anull%2C%22types%22%3Anull%2C%22activities%22%3Anull%2C%22tags%22%3Anull%2C%22hasEmail%22%3Anull%2C%22hasPhone%22%3Anull%2C%22isMember%22%3Anull%2C%22assignedToId%22%3Anull%2C%22municipality%22%3Anull%2C%22municipalityId%22%3Anull%2C%22dateRange%22%3Anull%2C%22lastActivityDays%22%3Anull%2C%22sortBy%22%3A%22updatedAt%22%2C%22sortDirection%22%3A%22desc%22%2C%22useSearchIndex%22%3Afalse%7D%2C%22meta%22%3A%7B%22values%22%3A%7B%22crmStatuses%22%3A%5B%22undefined%22%5D%2C%22pipelines%22%3A%5B%22undefined%22%5D%2C%22types%22%3A%5B%22undefined%22%5D%2C%22activities%22%3A%5B%22undefined%22%5D%2C%22tags%22%3A%5B%22undefined%22%5D%2C%22hasEmail%22%3A%5B%22undefined%22%5D%2C%22hasPhone%22%3A%5B%22undefined%22%5D%2C%22isMember%22%3A%5B%22undefined%22%5D%2C%22assignedToId%22%3A%5B%22undefined%22%5D%2C%22municipality%22%3A%5B%22undefined%22%5D%2C%22municipalityId%22%3A%5B%22undefined%22%5D%2C%22dateRange%22%3A%5B%22undefined%22%5D%2C%22lastActivityDays%22%3A%5B%22undefined%22%5D%7D%2C%22v%22%3A1%7D%7D%7D 500 in 91ms
2025-10-27 20:41:22.032 | prisma:error 
2025-10-27 20:41:22.032 | Invalid `prisma.association.findMany()` invocation:
2025-10-27 20:41:22.032 | 
2025-10-27 20:41:22.032 | {
2025-10-27 20:41:22.032 |   where: {
2025-10-27 20:41:22.032 |     AND: [
2025-10-27 20:41:22.032 |       {
2025-10-27 20:41:22.032 |         OR: [
2025-10-27 20:41:22.032 |           {
2025-10-27 20:41:22.032 |             name: {
2025-10-27 20:41:22.032 |               contains: "fot",
2025-10-27 20:41:22.032 |               mode: "insensitive"
2025-10-27 20:41:22.032 |             }
2025-10-27 20:41:22.032 |           },
2025-10-27 20:41:22.032 |           {
2025-10-27 20:41:22.032 |             orgNumber: {
2025-10-27 20:41:22.032 |               contains: "fot",
2025-10-27 20:41:22.032 |               mode: "insensitive"
2025-10-27 20:41:22.032 |             }
2025-10-27 20:41:22.032 |           },
2025-10-27 20:41:22.032 |           {
2025-10-27 20:41:22.032 |             streetAddress: {
2025-10-27 20:41:22.032 |               contains: "fot",
2025-10-27 20:41:22.032 |               mode: "insensitive"
2025-10-27 20:41:22.032 |             }
2025-10-27 20:41:22.032 |           },
2025-10-27 20:41:22.032 |           {
2025-10-27 20:41:22.032 |             city: {
2025-10-27 20:41:22.032 |               contains: "fot",
2025-10-27 20:41:22.032 |               mode: "insensitive"
2025-10-27 20:41:22.032 |             }
2025-10-27 20:41:22.032 |           },
2025-10-27 20:41:22.032 |           {
2025-10-27 20:41:22.032 |             municipality: {
2025-10-27 20:41:22.032 |               contains: "fot",
2025-10-27 20:41:22.032 |               mode: "insensitive"
2025-10-27 20:41:22.032 |             }
2025-10-27 20:41:22.032 |           },
2025-10-27 20:41:22.032 |           {
2025-10-27 20:41:22.032 |             email: {
2025-10-27 20:41:22.032 |               contains: "fot",
2025-10-27 20:41:22.032 |               mode: "insensitive"
2025-10-27 20:41:22.032 |             }
2025-10-27 20:41:22.032 |           },
2025-10-27 20:41:22.032 |           {
2025-10-27 20:41:22.032 |             phone: {
2025-10-27 20:41:22.032 |               contains: "fot",
2025-10-27 20:41:22.032 |               mode: "insensitive"
2025-10-27 20:41:22.032 |             }
2025-10-27 20:41:22.032 |           },
2025-10-27 20:41:22.032 |           {
2025-10-27 20:41:22.032 |             homepageUrl: {
2025-10-27 20:41:22.032 |               contains: "fot",
2025-10-27 20:41:22.032 |               mode: "insensitive"
2025-10-27 20:41:22.032 |             }
2025-10-27 20:41:22.032 |           },
2025-10-27 20:41:22.032 |           {
2025-10-27 20:41:22.032 |             descriptionFreeText: {
2025-10-27 20:41:22.032 |               contains: "fot",
2025-10-27 20:41:22.032 |               mode: "insensitive"
2025-10-27 20:41:22.032 |             }
2025-10-27 20:41:22.032 |           },
2025-10-27 20:41:22.032 |           {
2025-10-27 20:41:22.032 |             sourceSystem: {
2025-10-27 20:41:22.032 |               contains: "fot",
2025-10-27 20:41:22.032 |               mode: "insensitive"
2025-10-27 20:41:22.032 |             }
2025-10-27 20:41:22.032 |           },
2025-10-27 20:41:22.032 |           {
2025-10-27 20:41:22.032 |             tags: {
2025-10-27 20:41:22.032 |               some: {
2025-10-27 20:41:22.032 |                 name: {
2025-10-27 20:41:22.032 |                   contains: "fot",
2025-10-27 20:41:22.032 |                   mode: "insensitive"
2025-10-27 20:41:22.032 |                 }
2025-10-27 20:41:22.032 |               }
2025-10-27 20:41:22.032 |             }
2025-10-27 20:41:22.032 |           },
2025-10-27 20:41:22.032 |           {
2025-10-27 20:41:22.032 |             contacts: {
2025-10-27 20:41:22.032 |               some: {
2025-10-27 20:41:22.032 |                 OR: [
2025-10-27 20:41:22.032 |                   {
2025-10-27 20:41:22.032 |                     name: {
2025-10-27 20:41:22.032 |                       contains: "fot",
2025-10-27 20:41:22.032 |                       mode: "insensitive"
2025-10-27 20:41:22.032 |                     }
2025-10-27 20:41:22.032 |                   },
2025-10-27 20:41:22.032 |                   {
2025-10-27 20:41:22.032 |                     role: {
2025-10-27 20:41:22.032 |                       contains: "fot",
2025-10-27 20:41:22.032 |                       mode: "insensitive"
2025-10-27 20:41:22.032 |                     }
2025-10-27 20:41:22.032 |                   },
2025-10-27 20:41:22.033 |                   {
2025-10-27 20:41:22.033 |                     email: {
2025-10-27 20:41:22.033 |                       contains: "fot",
2025-10-27 20:41:22.033 |                       mode: "insensitive"
2025-10-27 20:41:22.033 |                     }
2025-10-27 20:41:22.033 |                   },
2025-10-27 20:41:22.033 |                   {
2025-10-27 20:41:22.033 |                     phone: {
2025-10-27 20:41:22.033 |                       contains: "fot",
2025-10-27 20:41:22.033 |                       mode: "insensitive"
2025-10-27 20:41:22.033 |                     }
2025-10-27 20:41:22.033 |                   },
2025-10-27 20:41:22.033 |                   {
2025-10-27 20:41:22.033 |                     mobile: {
2025-10-27 20:41:22.033 |                       contains: "fot",
2025-10-27 20:41:22.033 |                       mode: "insensitive"
2025-10-27 20:41:22.033 |                     }
2025-10-27 20:41:22.033 |                   }
2025-10-27 20:41:22.033 |                 ]
2025-10-27 20:41:22.033 |               }
2025-10-27 20:41:22.033 |             }
2025-10-27 20:41:22.033 |           }
2025-10-27 20:41:22.033 |         ]
2025-10-27 20:41:22.033 |       }
2025-10-27 20:41:22.033 |     ]
2025-10-27 20:41:22.033 |   },
2025-10-27 20:41:22.033 |   skip: 0,
2025-10-27 20:41:22.033 |   take: 10,
2025-10-27 20:41:22.033 |   include: {
2025-10-27 20:41:22.033 |     contacts: {
2025-10-27 20:41:22.033 |       where: {
2025-10-27 20:41:22.033 |         isPrimary: true
2025-10-27 20:41:22.033 |       },
2025-10-27 20:41:22.033 |       take: 1
2025-10-27 20:41:22.033 |     },
2025-10-27 20:41:22.033 |     tags: true,
2025-10-27 20:41:22.033 |     _count: {
2025-10-27 20:41:22.033 |       select: {
2025-10-27 20:41:22.033 |         contacts: true,
2025-10-27 20:41:22.033 |         notes: true
2025-10-27 20:41:22.033 |       }
2025-10-27 20:41:22.033 |     },
2025-10-27 20:41:22.033 |     assignedTo: true,
2025-10-27 20:41:22.033 |     activityLog: {
2025-10-27 20:41:22.033 |       orderBy: {
2025-10-27 20:41:22.033 |         createdAt: "desc"
2025-10-27 20:41:22.033 |       },
2025-10-27 20:41:22.033 |       take: 1
2025-10-27 20:41:22.033 |     }
2025-10-27 20:41:22.033 |   },
2025-10-27 20:41:22.033 |   orderBy: {
2025-10-27 20:41:22.033 |     updatedAt: "desc"
2025-10-27 20:41:22.033 |   }
2025-10-27 20:41:22.033 | }
2025-10-27 20:41:22.033 | 
2025-10-27 20:41:22.033 | Unknown argument `mode`. Did you mean `lte`? Available options are marked with ?.
2025-10-27 20:41:24.178 | prisma:error 
2025-10-27 20:41:24.178 | Invalid `prisma.association.findMany()` invocation:
2025-10-27 20:41:24.178 | 
2025-10-27 20:41:24.178 | {
2025-10-27 20:41:24.178 |   where: {
2025-10-27 20:41:24.178 |     AND: [
2025-10-27 20:41:24.178 |       {
2025-10-27 20:41:24.178 |         OR: [
2025-10-27 20:41:24.178 |           {
2025-10-27 20:41:24.178 |             name: {
2025-10-27 20:41:24.178 |               contains: "fot",
2025-10-27 20:41:24.178 |               mode: "insensitive"
2025-10-27 20:41:24.178 |             }
2025-10-27 20:41:24.178 |           },
2025-10-27 20:41:24.178 |           {
2025-10-27 20:41:24.178 |             orgNumber: {
2025-10-27 20:41:24.178 |               contains: "fot",
2025-10-27 20:41:24.178 |               mode: "insensitive"
2025-10-27 20:41:24.178 |             }
2025-10-27 20:41:24.178 |           },
2025-10-27 20:41:24.178 |           {
2025-10-27 20:41:24.178 |             streetAddress: {
2025-10-27 20:41:24.178 |               contains: "fot",
2025-10-27 20:41:24.178 |               mode: "insensitive"
2025-10-27 20:41:24.178 |             }
2025-10-27 20:41:24.178 |           },
2025-10-27 20:41:24.178 |           {
2025-10-27 20:41:24.178 |             city: {
2025-10-27 20:41:24.178 |               contains: "fot",
2025-10-27 20:41:24.178 |               mode: "insensitive"
2025-10-27 20:41:24.178 |             }
2025-10-27 20:41:24.178 |           },
2025-10-27 20:41:24.178 |           {
2025-10-27 20:41:24.178 |             municipality: {
2025-10-27 20:41:24.178 |               contains: "fot",
2025-10-27 20:41:24.178 |               mode: "insensitive"
2025-10-27 20:41:24.178 |             }
2025-10-27 20:41:24.178 |           },
2025-10-27 20:41:24.178 |           {
2025-10-27 20:41:24.178 |             email: {
2025-10-27 20:41:24.178 |               contains: "fot",
2025-10-27 20:41:24.178 |               mode: "insensitive"
2025-10-27 20:41:24.178 |             }
2025-10-27 20:41:24.178 |           },
2025-10-27 20:41:24.178 |           {
2025-10-27 20:41:24.178 |             phone: {
2025-10-27 20:41:24.178 |               contains: "fot",
2025-10-27 20:41:24.178 |               mode: "insensitive"
2025-10-27 20:41:24.178 |             }
2025-10-27 20:41:24.178 |           },
2025-10-27 20:41:24.178 |           {
2025-10-27 20:41:24.178 |             homepageUrl: {
2025-10-27 20:41:24.178 |               contains: "fot",
2025-10-27 20:41:24.178 |               mode: "insensitive"
2025-10-27 20:41:24.178 |             }
2025-10-27 20:41:24.178 |           },
2025-10-27 20:41:24.178 |           {
2025-10-27 20:41:24.178 |             descriptionFreeText: {
2025-10-27 20:41:24.178 |               contains: "fot",
2025-10-27 20:41:24.178 |               mode: "insensitive"
2025-10-27 20:41:24.178 |             }
2025-10-27 20:41:24.178 |           },
2025-10-27 20:41:24.178 |           {
2025-10-27 20:41:24.178 |             sourceSystem: {
2025-10-27 20:41:24.178 |               contains: "fot",
2025-10-27 20:41:24.178 |               mode: "insensitive"
2025-10-27 20:41:24.178 |             }
2025-10-27 20:41:24.178 |           },
2025-10-27 20:41:24.178 |           {
2025-10-27 20:41:24.178 |             tags: {
2025-10-27 20:41:24.178 |               some: {
2025-10-27 20:41:24.178 |                 name: {
2025-10-27 20:41:24.178 |                   contains: "fot",
2025-10-27 20:41:24.178 |                   mode: "insensitive"
2025-10-27 20:41:24.178 |                 }
2025-10-27 20:41:24.178 |               }
2025-10-27 20:41:24.178 |             }
2025-10-27 20:41:24.178 |           },
2025-10-27 20:41:24.178 |           {
2025-10-27 20:41:24.178 |             contacts: {
2025-10-27 20:41:24.178 |               some: {
2025-10-27 20:41:24.178 |                 OR: [
2025-10-27 20:41:24.178 |                   {
2025-10-27 20:41:24.178 |                     name: {
2025-10-27 20:41:24.178 |                       contains: "fot",
2025-10-27 20:41:24.178 |                       mode: "insensitive"
2025-10-27 20:41:24.178 |                     }
2025-10-27 20:41:24.178 |                   },
2025-10-27 20:41:24.178 |                   {
2025-10-27 20:41:24.178 |                     role: {
2025-10-27 20:41:24.178 |                       contains: "fot",
2025-10-27 20:41:24.178 |                       mode: "insensitive"
2025-10-27 20:41:24.178 |                     }
2025-10-27 20:41:24.178 |                   },
2025-10-27 20:41:24.178 |                   {
2025-10-27 20:41:24.178 |                     email: {
2025-10-27 20:41:24.178 |                       contains: "fot",
2025-10-27 20:41:24.178 |                       mode: "insensitive"
2025-10-27 20:41:24.178 |                     }
2025-10-27 20:41:24.178 |                   },
2025-10-27 20:41:24.178 |                   {
2025-10-27 20:41:24.178 |                     phone: {
2025-10-27 20:41:24.178 |                       contains: "fot",
2025-10-27 20:41:24.178 |                       mode: "insensitive"
2025-10-27 20:41:24.178 |                     }
2025-10-27 20:41:24.178 |                   },
2025-10-27 20:41:24.178 |                   {
2025-10-27 20:41:24.178 |                     mobile: {
2025-10-27 20:41:24.178 |                       contains: "fot",
2025-10-27 20:41:24.178 |                       mode: "insensitive"
2025-10-27 20:41:24.178 |                     }
2025-10-27 20:41:24.178 |                   }
2025-10-27 20:41:24.178 |                 ]
2025-10-27 20:41:24.178 |               }
2025-10-27 20:41:24.178 |             }
2025-10-27 20:41:24.178 |           }
2025-10-27 20:41:24.178 |         ]
2025-10-27 20:41:24.178 |       }
2025-10-27 20:41:24.178 |     ]
2025-10-27 20:41:24.178 |   },
2025-10-27 20:41:24.178 |   skip: 0,
2025-10-27 20:41:24.178 |   take: 10,
2025-10-27 20:41:24.178 |   include: {
2025-10-27 20:41:24.178 |     contacts: {
2025-10-27 20:41:24.178 |       where: {
2025-10-27 20:41:24.178 |         isPrimary: true
2025-10-27 20:41:24.178 |       },
2025-10-27 20:41:24.178 |       take: 1
2025-10-27 20:41:24.178 |     },
2025-10-27 20:41:24.178 |     tags: true,
2025-10-27 20:41:24.178 |     _count: {
2025-10-27 20:41:24.178 |       select: {
2025-10-27 20:41:24.178 |         contacts: true,
2025-10-27 20:41:24.178 |         notes: true
2025-10-27 20:41:24.178 |       }
2025-10-27 20:41:24.178 |     },
2025-10-27 20:41:24.178 |     assignedTo: true,
2025-10-27 20:41:24.178 |     activityLog: {
2025-10-27 20:41:24.178 |       orderBy: {
2025-10-27 20:41:24.178 |         createdAt: "desc"
2025-10-27 20:41:24.178 |       },
2025-10-27 20:41:24.178 |       take: 1
2025-10-27 20:41:24.178 |     }
2025-10-27 20:41:24.178 |   },
2025-10-27 20:41:24.178 |   orderBy: {
2025-10-27 20:41:24.178 |     updatedAt: "desc"
2025-10-27 20:41:24.178 |   }
2025-10-27 20:41:24.178 | }
2025-10-27 20:41:24.178 | 
2025-10-27 20:41:24.178 | Unknown argument `mode`. Did you mean `lte`? Available options are marked with ?.
2025-10-27 20:41:24.181 |  GET /api/trpc/association.list?batch=1&input=%7B%220%22%3A%7B%22json%22%3A%7B%22page%22%3A1%2C%22limit%22%3A10%2C%22search%22%3A%22fot%22%2C%22crmStatuses%22%3Anull%2C%22pipelines%22%3Anull%2C%22types%22%3Anull%2C%22activities%22%3Anull%2C%22tags%22%3Anull%2C%22hasEmail%22%3Anull%2C%22hasPhone%22%3Anull%2C%22isMember%22%3Anull%2C%22assignedToId%22%3Anull%2C%22municipality%22%3Anull%2C%22municipalityId%22%3Anull%2C%22dateRange%22%3Anull%2C%22lastActivityDays%22%3Anull%2C%22sortBy%22%3A%22updatedAt%22%2C%22sortDirection%22%3A%22desc%22%2C%22useSearchIndex%22%3Afalse%7D%2C%22meta%22%3A%7B%22values%22%3A%7B%22crmStatuses%22%3A%5B%22undefined%22%5D%2C%22pipelines%22%3A%5B%22undefined%22%5D%2C%22types%22%3A%5B%22undefined%22%5D%2C%22activities%22%3A%5B%22undefined%22%5D%2C%22tags%22%3A%5B%22undefined%22%5D%2C%22hasEmail%22%3A%5B%22undefined%22%5D%2C%22hasPhone%22%3A%5B%22undefined%22%5D%2C%22isMember%22%3A%5B%22undefined%22%5D%2C%22assignedToId%22%3A%5B%22undefined%22%5D%2C%22municipality%22%3A%5B%22undefined%22%5D%2C%22municipalityId%22%3A%5B%22undefined%22%5D%2C%22dateRange%22%3A%5B%22undefined%22%5D%2C%22lastActivityDays%22%3A%5B%22undefined%22%5D%7D%2C%22v%22%3A1%7D%7D%7D 500 in 89ms
2025-10-27 20:41:24.185 | prisma:error 
2025-10-27 20:41:24.185 | Invalid `prisma.association.count()` invocation:
2025-10-27 20:41:24.185 | 
2025-10-27 20:41:24.185 | {
2025-10-27 20:41:24.185 |   select: {
2025-10-27 20:41:24.185 |     _count: {
2025-10-27 20:41:24.185 |       select: {
2025-10-27 20:41:24.185 |         _all: true
2025-10-27 20:41:24.185 |       }
2025-10-27 20:41:24.185 |     }
2025-10-27 20:41:24.185 |   },
2025-10-27 20:41:24.185 |   where: {
2025-10-27 20:41:24.185 |     AND: [
2025-10-27 20:41:24.185 |       {
2025-10-27 20:41:24.185 |         OR: [
2025-10-27 20:41:24.185 |           {
2025-10-27 20:41:24.185 |             name: {
2025-10-27 20:41:24.185 |               contains: "fot",
2025-10-27 20:41:24.185 |               mode: "insensitive"
2025-10-27 20:41:24.185 |             }
2025-10-27 20:41:24.185 |           },
2025-10-27 20:41:24.185 |           {
2025-10-27 20:41:24.185 |             orgNumber: {
2025-10-27 20:41:24.185 |               contains: "fot",
2025-10-27 20:41:24.185 |               mode: "insensitive"
2025-10-27 20:41:24.185 |             }
2025-10-27 20:41:24.185 |           },
2025-10-27 20:41:24.185 |           {
2025-10-27 20:41:24.185 |             streetAddress: {
2025-10-27 20:41:24.185 |               contains: "fot",
2025-10-27 20:41:24.185 |               mode: "insensitive"
2025-10-27 20:41:24.185 |             }
2025-10-27 20:41:24.185 |           },
2025-10-27 20:41:24.185 |           {
2025-10-27 20:41:24.185 |             city: {
2025-10-27 20:41:24.185 |               contains: "fot",
2025-10-27 20:41:24.185 |               mode: "insensitive"
2025-10-27 20:41:24.185 |             }
2025-10-27 20:41:24.185 |           },
2025-10-27 20:41:24.185 |           {
2025-10-27 20:41:24.185 |             municipality: {
2025-10-27 20:41:24.185 |               contains: "fot",
2025-10-27 20:41:24.185 |               mode: "insensitive"
2025-10-27 20:41:24.185 |             }
2025-10-27 20:41:24.185 |           },
2025-10-27 20:41:24.185 |           {
2025-10-27 20:41:24.185 |             email: {
2025-10-27 20:41:24.185 |               contains: "fot",
2025-10-27 20:41:24.185 |               mode: "insensitive"
2025-10-27 20:41:24.185 |             }
2025-10-27 20:41:24.185 |           },
2025-10-27 20:41:24.185 |           {
2025-10-27 20:41:24.185 |             phone: {
2025-10-27 20:41:24.185 |               contains: "fot",
2025-10-27 20:41:24.185 |               mode: "insensitive"
2025-10-27 20:41:24.185 |             }
2025-10-27 20:41:24.185 |           },
2025-10-27 20:41:24.185 |           {
2025-10-27 20:41:24.185 |             homepageUrl: {
2025-10-27 20:41:24.185 |               contains: "fot",
2025-10-27 20:41:24.185 |               mode: "insensitive"
2025-10-27 20:41:24.185 |             }
2025-10-27 20:41:24.185 |           },
2025-10-27 20:41:24.185 |           {
2025-10-27 20:41:24.185 |             descriptionFreeText: {
2025-10-27 20:41:24.185 |               contains: "fot",
2025-10-27 20:41:24.185 |               mode: "insensitive"
2025-10-27 20:41:24.185 |             }
2025-10-27 20:41:24.185 |           },
2025-10-27 20:41:24.185 |           {
2025-10-27 20:41:24.185 |             sourceSystem: {
2025-10-27 20:41:24.185 |               contains: "fot",
2025-10-27 20:41:24.185 |               mode: "insensitive"
2025-10-27 20:41:24.185 |             }
2025-10-27 20:41:24.185 |           },
2025-10-27 20:41:24.185 |           {
2025-10-27 20:41:24.185 |             tags: {
2025-10-27 20:41:24.185 |               some: {
2025-10-27 20:41:24.185 |                 name: {
2025-10-27 20:41:24.185 |                   contains: "fot",
2025-10-27 20:41:24.185 |                   mode: "insensitive"
2025-10-27 20:41:24.185 |                 }
2025-10-27 20:41:24.185 |               }
2025-10-27 20:41:24.185 |             }
2025-10-27 20:41:24.185 |           },
2025-10-27 20:41:24.185 |           {
2025-10-27 20:41:24.185 |             contacts: {
2025-10-27 20:41:24.185 |               some: {
2025-10-27 20:41:24.185 |                 OR: [
2025-10-27 20:41:24.185 |                   {
2025-10-27 20:41:24.185 |                     name: {
2025-10-27 20:41:24.185 |                       contains: "fot",
2025-10-27 20:41:24.185 |                       mode: "insensitive"
2025-10-27 20:41:24.185 |                     }
2025-10-27 20:41:24.185 |                   },
2025-10-27 20:41:24.185 |                   {
2025-10-27 20:41:24.185 |                     role: {
2025-10-27 20:41:24.185 |                       contains: "fot",
2025-10-27 20:41:24.185 |                       mode: "insensitive"
2025-10-27 20:41:24.185 |                     }
2025-10-27 20:41:24.185 |                   },
2025-10-27 20:41:24.185 |                   {
2025-10-27 20:41:24.185 |                     email: {
2025-10-27 20:41:24.185 |                       contains: "fot",
2025-10-27 20:41:24.185 |                       mode: "insensitive"
2025-10-27 20:41:24.185 |                     }
2025-10-27 20:41:24.185 |                   },
2025-10-27 20:41:24.185 |                   {
2025-10-27 20:41:24.185 |                     phone: {
2025-10-27 20:41:24.185 |                       contains: "fot",
2025-10-27 20:41:24.185 |                       mode: "insensitive"
2025-10-27 20:41:24.185 |                     }
2025-10-27 20:41:24.185 |                   },
2025-10-27 20:41:24.185 |                   {
2025-10-27 20:41:24.185 |                     mobile: {
2025-10-27 20:41:24.185 |                       contains: "fot",
2025-10-27 20:41:24.185 |                       mode: "insensitive"
2025-10-27 20:41:24.185 |                     }
2025-10-27 20:41:24.185 |                   }
2025-10-27 20:41:24.185 |                 ]
2025-10-27 20:41:24.185 |               }
2025-10-27 20:41:24.185 |             }
2025-10-27 20:41:24.185 |           }
2025-10-27 20:41:24.185 |         ]
2025-10-27 20:41:24.185 |       }
2025-10-27 20:41:24.185 |     ]
2025-10-27 20:41:24.185 |   }
2025-10-27 20:41:24.185 | }
2025-10-27 20:41:24.185 | 
2025-10-27 20:41:24.185 | Unknown argument `mode`. Did you mean `lte`? Available options are marked with ?.
2025-10-27 20:41:24.416 | prisma:error 
2025-10-27 20:41:24.416 | Invalid `prisma.association.count()` invocation:
2025-10-27 20:41:24.416 | 
2025-10-27 20:41:24.416 | {
2025-10-27 20:41:24.416 |   select: {
2025-10-27 20:41:24.417 |     _count: {
2025-10-27 20:41:24.417 |       select: {
2025-10-27 20:41:24.417 |         _all: true
2025-10-27 20:41:24.417 |       }
2025-10-27 20:41:24.417 |     }
2025-10-27 20:41:24.417 |   },
2025-10-27 20:41:24.417 |   where: {
2025-10-27 20:41:24.417 |     AND: [
2025-10-27 20:41:24.417 |       {
2025-10-27 20:41:24.417 |         OR: [
2025-10-27 20:41:24.417 |           {
2025-10-27 20:41:24.417 |             name: {
2025-10-27 20:41:24.417 |               contains: "fotb",
2025-10-27 20:41:24.417 |               mode: "insensitive"
2025-10-27 20:41:24.417 |             }
2025-10-27 20:41:24.417 |           },
2025-10-27 20:41:24.417 |           {
2025-10-27 20:41:24.417 |             orgNumber: {
2025-10-27 20:41:24.417 |               contains: "fotb",
2025-10-27 20:41:24.417 |               mode: "insensitive"
2025-10-27 20:41:24.417 |             }
2025-10-27 20:41:24.417 |           },
2025-10-27 20:41:24.417 |           {
2025-10-27 20:41:24.417 |             streetAddress: {
2025-10-27 20:41:24.417 |               contains: "fotb",
2025-10-27 20:41:24.417 |               mode: "insensitive"
2025-10-27 20:41:24.417 |             }
2025-10-27 20:41:24.417 |           },
2025-10-27 20:41:24.417 |           {
2025-10-27 20:41:24.417 |             city: {
2025-10-27 20:41:24.417 |               contains: "fotb",
2025-10-27 20:41:24.417 |               mode: "insensitive"
2025-10-27 20:41:24.417 |             }
2025-10-27 20:41:24.417 |           },
2025-10-27 20:41:24.417 |           {
2025-10-27 20:41:24.417 |             municipality: {
2025-10-27 20:41:24.417 |               contains: "fotb",
2025-10-27 20:41:24.417 |               mode: "insensitive"
2025-10-27 20:41:24.417 |             }
2025-10-27 20:41:24.417 |           },
2025-10-27 20:41:24.417 |           {
2025-10-27 20:41:24.417 |             email: {
2025-10-27 20:41:24.417 |               contains: "fotb",
2025-10-27 20:41:24.417 |               mode: "insensitive"
2025-10-27 20:41:24.417 |             }
2025-10-27 20:41:24.417 |           },
2025-10-27 20:41:24.417 |           {
2025-10-27 20:41:24.417 |             phone: {
2025-10-27 20:41:24.417 |               contains: "fotb",
2025-10-27 20:41:24.417 |               mode: "insensitive"
2025-10-27 20:41:24.417 |             }
2025-10-27 20:41:24.417 |           },
2025-10-27 20:41:24.417 |           {
2025-10-27 20:41:24.417 |             homepageUrl: {
2025-10-27 20:41:24.417 |               contains: "fotb",
2025-10-27 20:41:24.417 |               mode: "insensitive"
2025-10-27 20:41:24.417 |             }
2025-10-27 20:41:24.417 |           },
2025-10-27 20:41:24.417 |           {
2025-10-27 20:41:24.417 |             descriptionFreeText: {
2025-10-27 20:41:24.417 |               contains: "fotb",
2025-10-27 20:41:24.417 |               mode: "insensitive"
2025-10-27 20:41:24.417 |             }
2025-10-27 20:41:24.417 |           },
2025-10-27 20:41:24.417 |           {
2025-10-27 20:41:24.417 |             sourceSystem: {
2025-10-27 20:41:24.417 |               contains: "fotb",
2025-10-27 20:41:24.417 |               mode: "insensitive"
2025-10-27 20:41:24.417 |             }
2025-10-27 20:41:24.417 |           },
2025-10-27 20:41:24.417 |           {
2025-10-27 20:41:24.417 |             tags: {
2025-10-27 20:41:24.417 |               some: {
2025-10-27 20:41:24.417 |                 name: {
2025-10-27 20:41:24.417 |                   contains: "fotb",
2025-10-27 20:41:24.417 |                   mode: "insensitive"
2025-10-27 20:41:24.417 |                 }
2025-10-27 20:41:24.417 |               }
2025-10-27 20:41:24.417 |             }
2025-10-27 20:41:24.417 |           },
2025-10-27 20:41:24.417 |           {
2025-10-27 20:41:24.417 |             contacts: {
2025-10-27 20:41:24.417 |               some: {
2025-10-27 20:41:24.417 |                 OR: [
2025-10-27 20:41:24.417 |                   {
2025-10-27 20:41:24.417 |                     name: {
2025-10-27 20:41:24.417 |                       contains: "fotb",
2025-10-27 20:41:24.417 |                       mode: "insensitive"
2025-10-27 20:41:24.417 |                     }
2025-10-27 20:41:24.417 |                   },
2025-10-27 20:41:24.417 |                   {
2025-10-27 20:41:24.417 |                     role: {
2025-10-27 20:41:24.417 |                       contains: "fotb",
2025-10-27 20:41:24.417 |                       mode: "insensitive"
2025-10-27 20:41:24.417 |                     }
2025-10-27 20:41:24.417 |                   },
2025-10-27 20:41:24.417 |                   {
2025-10-27 20:41:24.417 |                     email: {
2025-10-27 20:41:24.417 |                       contains: "fotb",
2025-10-27 20:41:24.417 |                       mode: "insensitive"
2025-10-27 20:41:24.417 |                     }
2025-10-27 20:41:24.417 |                   },
2025-10-27 20:41:24.417 |                   {
2025-10-27 20:41:24.417 |                     phone: {
2025-10-27 20:41:24.417 |                       contains: "fotb",
2025-10-27 20:41:24.417 |                       mode: "insensitive"
2025-10-27 20:41:24.417 |                     }
2025-10-27 20:41:24.417 |                   },
2025-10-27 20:41:24.417 |                   {
2025-10-27 20:41:24.417 |                     mobile: {
2025-10-27 20:41:24.417 |                       contains: "fotb",
2025-10-27 20:41:24.417 |                       mode: "insensitive"
2025-10-27 20:41:24.417 |                     }
2025-10-27 20:41:24.417 |                   }
2025-10-27 20:41:24.417 |                 ]
2025-10-27 20:41:24.417 |               }
2025-10-27 20:41:24.417 |             }
2025-10-27 20:41:24.417 |           }
2025-10-27 20:41:24.417 |         ]
2025-10-27 20:41:24.417 |       }
2025-10-27 20:41:24.417 |     ]
2025-10-27 20:41:24.417 |   }
2025-10-27 20:41:24.417 | }
2025-10-27 20:41:24.417 | 
2025-10-27 20:41:24.417 | Unknown argument `mode`. Did you mean `lte`? Available options are marked with ?.
2025-10-27 20:41:24.419 |  GET /api/trpc/association.list?batch=1&input=%7B%220%22%3A%7B%22json%22%3A%7B%22page%22%3A1%2C%22limit%22%3A10%2C%22search%22%3A%22fotb%22%2C%22crmStatuses%22%3Anull%2C%22pipelines%22%3Anull%2C%22types%22%3Anull%2C%22activities%22%3Anull%2C%22tags%22%3Anull%2C%22hasEmail%22%3Anull%2C%22hasPhone%22%3Anull%2C%22isMember%22%3Anull%2C%22assignedToId%22%3Anull%2C%22municipality%22%3Anull%2C%22municipalityId%22%3Anull%2C%22dateRange%22%3Anull%2C%22lastActivityDays%22%3Anull%2C%22sortBy%22%3A%22updatedAt%22%2C%22sortDirection%22%3A%22desc%22%2C%22useSearchIndex%22%3Afalse%7D%2C%22meta%22%3A%7B%22values%22%3A%7B%22crmStatuses%22%3A%5B%22undefined%22%5D%2C%22pipelines%22%3A%5B%22undefined%22%5D%2C%22types%22%3A%5B%22undefined%22%5D%2C%22activities%22%3A%5B%22undefined%22%5D%2C%22tags%22%3A%5B%22undefined%22%5D%2C%22hasEmail%22%3A%5B%22undefined%22%5D%2C%22hasPhone%22%3A%5B%22undefined%22%5D%2C%22isMember%22%3A%5B%22undefined%22%5D%2C%22assignedToId%22%3A%5B%22undefined%22%5D%2C%22municipality%22%3A%5B%22undefined%22%5D%2C%22municipalityId%22%3A%5B%22undefined%22%5D%2C%22dateRange%22%3A%5B%22undefined%22%5D%2C%22lastActivityDays%22%3A%5B%22undefined%22%5D%7D%2C%22v%22%3A1%7D%7D%7D 500 in 70ms
2025-10-27 20:41:24.425 | prisma:error 
2025-10-27 20:41:24.425 | Invalid `prisma.association.findMany()` invocation:
2025-10-27 20:41:24.425 | 
2025-10-27 20:41:24.425 | {
2025-10-27 20:41:24.425 |   where: {
2025-10-27 20:41:24.425 |     AND: [
2025-10-27 20:41:24.425 |       {
2025-10-27 20:41:24.425 |         OR: [
2025-10-27 20:41:24.425 |           {
2025-10-27 20:41:24.425 |             name: {
2025-10-27 20:41:24.425 |               contains: "fotb",
2025-10-27 20:41:24.425 |               mode: "insensitive"
2025-10-27 20:41:24.425 |             }
2025-10-27 20:41:24.425 |           },
2025-10-27 20:41:24.425 |           {
2025-10-27 20:41:24.425 |             orgNumber: {
2025-10-27 20:41:24.425 |               contains: "fotb",
2025-10-27 20:41:24.425 |               mode: "insensitive"
2025-10-27 20:41:24.425 |             }
2025-10-27 20:41:24.425 |           },
2025-10-27 20:41:24.425 |           {
2025-10-27 20:41:24.425 |             streetAddress: {
2025-10-27 20:41:24.425 |               contains: "fotb",
2025-10-27 20:41:24.425 |               mode: "insensitive"
2025-10-27 20:41:24.425 |             }
2025-10-27 20:41:24.425 |           },
2025-10-27 20:41:24.425 |           {
2025-10-27 20:41:24.425 |             city: {
2025-10-27 20:41:24.425 |               contains: "fotb",
2025-10-27 20:41:24.425 |               mode: "insensitive"
2025-10-27 20:41:24.425 |             }
2025-10-27 20:41:24.425 |           },
2025-10-27 20:41:24.425 |           {
2025-10-27 20:41:24.425 |             municipality: {
2025-10-27 20:41:24.425 |               contains: "fotb",
2025-10-27 20:41:24.425 |               mode: "insensitive"
2025-10-27 20:41:24.425 |             }
2025-10-27 20:41:24.425 |           },
2025-10-27 20:41:24.425 |           {
2025-10-27 20:41:24.425 |             email: {
2025-10-27 20:41:24.425 |               contains: "fotb",
2025-10-27 20:41:24.425 |               mode: "insensitive"
2025-10-27 20:41:24.425 |             }
2025-10-27 20:41:24.425 |           },
2025-10-27 20:41:24.425 |           {
2025-10-27 20:41:24.425 |             phone: {
2025-10-27 20:41:24.425 |               contains: "fotb",
2025-10-27 20:41:24.425 |               mode: "insensitive"
2025-10-27 20:41:24.425 |             }
2025-10-27 20:41:24.425 |           },
2025-10-27 20:41:24.425 |           {
2025-10-27 20:41:24.425 |             homepageUrl: {
2025-10-27 20:41:24.425 |               contains: "fotb",
2025-10-27 20:41:24.425 |               mode: "insensitive"
2025-10-27 20:41:24.425 |             }
2025-10-27 20:41:24.425 |           },
2025-10-27 20:41:24.425 |           {
2025-10-27 20:41:24.425 |             descriptionFreeText: {
2025-10-27 20:41:24.425 |               contains: "fotb",
2025-10-27 20:41:24.425 |               mode: "insensitive"
2025-10-27 20:41:24.425 |             }
2025-10-27 20:41:24.425 |           },
2025-10-27 20:41:24.425 |           {
2025-10-27 20:41:24.425 |             sourceSystem: {
2025-10-27 20:41:24.425 |               contains: "fotb",
2025-10-27 20:41:24.425 |               mode: "insensitive"
2025-10-27 20:41:24.425 |             }
2025-10-27 20:41:24.425 |           },
2025-10-27 20:41:24.425 |           {
2025-10-27 20:41:24.425 |             tags: {
2025-10-27 20:41:24.425 |               some: {
2025-10-27 20:41:24.425 |                 name: {
2025-10-27 20:41:24.425 |                   contains: "fotb",
2025-10-27 20:41:24.425 |                   mode: "insensitive"
2025-10-27 20:41:24.425 |                 }
2025-10-27 20:41:24.425 |               }
2025-10-27 20:41:24.425 |             }
2025-10-27 20:41:24.425 |           },
2025-10-27 20:41:24.425 |           {
2025-10-27 20:41:24.425 |             contacts: {
2025-10-27 20:41:24.425 |               some: {
2025-10-27 20:41:24.425 |                 OR: [
2025-10-27 20:41:24.425 |                   {
2025-10-27 20:41:24.425 |                     name: {
2025-10-27 20:41:24.425 |                       contains: "fotb",
2025-10-27 20:41:24.425 |                       mode: "insensitive"
2025-10-27 20:41:24.425 |                     }
2025-10-27 20:41:24.425 |                   },
2025-10-27 20:41:24.425 |                   {
2025-10-27 20:41:24.425 |                     role: {
2025-10-27 20:41:24.425 |                       contains: "fotb",
2025-10-27 20:41:24.425 |                       mode: "insensitive"
2025-10-27 20:41:24.425 |                     }
2025-10-27 20:41:24.426 |                   },
2025-10-27 20:41:24.426 |                   {
2025-10-27 20:41:24.426 |                     email: {
2025-10-27 20:41:24.426 |                       contains: "fotb",
2025-10-27 20:41:24.426 |                       mode: "insensitive"
2025-10-27 20:41:24.426 |                     }
2025-10-27 20:41:24.426 |                   },
2025-10-27 20:41:24.426 |                   {
2025-10-27 20:41:24.426 |                     phone: {
2025-10-27 20:41:24.426 |                       contains: "fotb",
2025-10-27 20:41:24.426 |                       mode: "insensitive"
2025-10-27 20:41:24.426 |                     }
2025-10-27 20:41:24.426 |                   },
2025-10-27 20:41:24.426 |                   {
2025-10-27 20:41:24.426 |                     mobile: {
2025-10-27 20:41:24.426 |                       contains: "fotb",
2025-10-27 20:41:24.426 |                       mode: "insensitive"
2025-10-27 20:41:24.426 |                     }
2025-10-27 20:41:24.426 |                   }
2025-10-27 20:41:24.426 |                 ]
2025-10-27 20:41:24.426 |               }
2025-10-27 20:41:24.426 |             }
2025-10-27 20:41:24.426 |           }
2025-10-27 20:41:24.426 |         ]
2025-10-27 20:41:24.426 |       }
2025-10-27 20:41:24.426 |     ]
2025-10-27 20:41:24.426 |   },
2025-10-27 20:41:24.426 |   skip: 0,
2025-10-27 20:41:24.426 |   take: 10,
2025-10-27 20:41:24.426 |   include: {
2025-10-27 20:41:24.426 |     contacts: {
2025-10-27 20:41:24.426 |       where: {
2025-10-27 20:41:24.426 |         isPrimary: true
2025-10-27 20:41:24.426 |       },
2025-10-27 20:41:24.426 |       take: 1
2025-10-27 20:41:24.426 |     },
2025-10-27 20:41:24.426 |     tags: true,
2025-10-27 20:41:24.426 |     _count: {
2025-10-27 20:41:24.426 |       select: {
2025-10-27 20:41:24.426 |         contacts: true,
2025-10-27 20:41:24.426 |         notes: true
2025-10-27 20:41:24.426 |       }
2025-10-27 20:41:24.426 |     },
2025-10-27 20:41:24.426 |     assignedTo: true,
2025-10-27 20:41:24.426 |     activityLog: {
2025-10-27 20:41:24.426 |       orderBy: {
2025-10-27 20:41:24.426 |         createdAt: "desc"
2025-10-27 20:41:24.426 |       },
2025-10-27 20:41:24.426 |       take: 1
2025-10-27 20:41:24.426 |     }
2025-10-27 20:41:24.426 |   },
2025-10-27 20:41:24.426 |   orderBy: {
2025-10-27 20:41:24.426 |     updatedAt: "desc"
2025-10-27 20:41:24.426 |   }
2025-10-27 20:41:24.426 | }
2025-10-27 20:41:24.426 | 
2025-10-27 20:41:24.426 | Unknown argument `mode`. Did you mean `lte`? Available options are marked with ?.
2025-10-27 20:41:24.893 | prisma:error 
2025-10-27 20:41:24.893 | Invalid `prisma.association.count()` invocation:
2025-10-27 20:41:24.893 | 
2025-10-27 20:41:24.893 | {
2025-10-27 20:41:24.893 |   select: {
2025-10-27 20:41:24.893 |     _count: {
2025-10-27 20:41:24.893 |       select: {
2025-10-27 20:41:24.893 |         _all: true
2025-10-27 20:41:24.893 |       }
2025-10-27 20:41:24.893 |     }
2025-10-27 20:41:24.893 |   },
2025-10-27 20:41:24.893 |   where: {
2025-10-27 20:41:24.893 |     AND: [
2025-10-27 20:41:24.893 |       {
2025-10-27 20:41:24.893 |         OR: [
2025-10-27 20:41:24.893 |           {
2025-10-27 20:41:24.893 |             name: {
2025-10-27 20:41:24.893 |               contains: "fotbo",
2025-10-27 20:41:24.893 |               mode: "insensitive"
2025-10-27 20:41:24.893 |             }
2025-10-27 20:41:24.893 |           },
2025-10-27 20:41:24.893 |           {
2025-10-27 20:41:24.893 |             orgNumber: {
2025-10-27 20:41:24.893 |               contains: "fotbo",
2025-10-27 20:41:24.893 |               mode: "insensitive"
2025-10-27 20:41:24.893 |             }
2025-10-27 20:41:24.893 |           },
2025-10-27 20:41:24.893 |           {
2025-10-27 20:41:24.893 |             streetAddress: {
2025-10-27 20:41:24.893 |               contains: "fotbo",
2025-10-27 20:41:24.893 |               mode: "insensitive"
2025-10-27 20:41:24.893 |             }
2025-10-27 20:41:24.893 |           },
2025-10-27 20:41:24.893 |           {
2025-10-27 20:41:24.893 |             city: {
2025-10-27 20:41:24.893 |               contains: "fotbo",
2025-10-27 20:41:24.893 |               mode: "insensitive"
2025-10-27 20:41:24.893 |             }
2025-10-27 20:41:24.893 |           },
2025-10-27 20:41:24.893 |           {
2025-10-27 20:41:24.893 |             municipality: {
2025-10-27 20:41:24.893 |               contains: "fotbo",
2025-10-27 20:41:24.893 |               mode: "insensitive"
2025-10-27 20:41:24.893 |             }
2025-10-27 20:41:24.893 |           },
2025-10-27 20:41:24.893 |           {
2025-10-27 20:41:24.893 |             email: {
2025-10-27 20:41:24.893 |               contains: "fotbo",
2025-10-27 20:41:24.893 |               mode: "insensitive"
2025-10-27 20:41:24.893 |             }
2025-10-27 20:41:24.893 |           },
2025-10-27 20:41:24.893 |           {
2025-10-27 20:41:24.893 |             phone: {
2025-10-27 20:41:24.893 |               contains: "fotbo",
2025-10-27 20:41:24.893 |               mode: "insensitive"
2025-10-27 20:41:24.893 |             }
2025-10-27 20:41:24.893 |           },
2025-10-27 20:41:24.893 |           {
2025-10-27 20:41:24.893 |             homepageUrl: {
2025-10-27 20:41:24.893 |               contains: "fotbo",
2025-10-27 20:41:24.893 |               mode: "insensitive"
2025-10-27 20:41:24.893 |             }
2025-10-27 20:41:24.893 |           },
2025-10-27 20:41:24.893 |           {
2025-10-27 20:41:24.893 |             descriptionFreeText: {
2025-10-27 20:41:24.893 |               contains: "fotbo",
2025-10-27 20:41:24.893 |               mode: "insensitive"
2025-10-27 20:41:24.893 |             }
2025-10-27 20:41:24.893 |           },
2025-10-27 20:41:24.893 |           {
2025-10-27 20:41:24.893 |             sourceSystem: {
2025-10-27 20:41:24.893 |               contains: "fotbo",
2025-10-27 20:41:24.893 |               mode: "insensitive"
2025-10-27 20:41:24.893 |             }
2025-10-27 20:41:24.893 |           },
2025-10-27 20:41:24.893 |           {
2025-10-27 20:41:24.893 |             tags: {
2025-10-27 20:41:24.893 |               some: {
2025-10-27 20:41:24.893 |                 name: {
2025-10-27 20:41:24.893 |                   contains: "fotbo",
2025-10-27 20:41:24.893 |                   mode: "insensitive"
2025-10-27 20:41:24.893 |                 }
2025-10-27 20:41:24.893 |               }
2025-10-27 20:41:24.893 |             }
2025-10-27 20:41:24.893 |           },
2025-10-27 20:41:24.893 |           {
2025-10-27 20:41:24.893 |             contacts: {
2025-10-27 20:41:24.893 |               some: {
2025-10-27 20:41:24.893 |                 OR: [
2025-10-27 20:41:24.893 |                   {
2025-10-27 20:41:24.893 |                     name: {
2025-10-27 20:41:24.893 |                       contains: "fotbo",
2025-10-27 20:41:24.893 |                       mode: "insensitive"
2025-10-27 20:41:24.893 |                     }
2025-10-27 20:41:24.893 |                   },
2025-10-27 20:41:24.893 |                   {
2025-10-27 20:41:24.893 |                     role: {
2025-10-27 20:41:24.893 |                       contains: "fotbo",
2025-10-27 20:41:24.893 |                       mode: "insensitive"
2025-10-27 20:41:24.893 |                     }
2025-10-27 20:41:24.893 |                   },
2025-10-27 20:41:24.893 |                   {
2025-10-27 20:41:24.893 |                     email: {
2025-10-27 20:41:24.893 |                       contains: "fotbo",
2025-10-27 20:41:24.893 |                       mode: "insensitive"
2025-10-27 20:41:24.893 |                     }
2025-10-27 20:41:24.893 |                   },
2025-10-27 20:41:24.893 |                   {
2025-10-27 20:41:24.893 |                     phone: {
2025-10-27 20:41:24.893 |                       contains: "fotbo",
2025-10-27 20:41:24.893 |                       mode: "insensitive"
2025-10-27 20:41:24.893 |                     }
2025-10-27 20:41:24.893 |                   },
2025-10-27 20:41:24.893 |                   {
2025-10-27 20:41:24.893 |                     mobile: {
2025-10-27 20:41:24.893 |                       contains: "fotbo",
2025-10-27 20:41:24.893 |                       mode: "insensitive"
2025-10-27 20:41:24.893 |                     }
2025-10-27 20:41:24.893 |                   }
2025-10-27 20:41:24.893 |                 ]
2025-10-27 20:41:24.893 |               }
2025-10-27 20:41:24.893 |             }
2025-10-27 20:41:24.893 |           }
2025-10-27 20:41:24.893 |         ]
2025-10-27 20:41:24.893 |       }
2025-10-27 20:41:24.893 |     ]
2025-10-27 20:41:24.893 |   }
2025-10-27 20:41:24.893 | }
2025-10-27 20:41:24.893 | 
2025-10-27 20:41:24.893 | Unknown argument `mode`. Did you mean `lte`? Available options are marked with ?.
2025-10-27 20:41:24.896 |  GET /api/trpc/association.list?batch=1&input=%7B%220%22%3A%7B%22json%22%3A%7B%22page%22%3A1%2C%22limit%22%3A10%2C%22search%22%3A%22fotbo%22%2C%22crmStatuses%22%3Anull%2C%22pipelines%22%3Anull%2C%22types%22%3Anull%2C%22activities%22%3Anull%2C%22tags%22%3Anull%2C%22hasEmail%22%3Anull%2C%22hasPhone%22%3Anull%2C%22isMember%22%3Anull%2C%22assignedToId%22%3Anull%2C%22municipality%22%3Anull%2C%22municipalityId%22%3Anull%2C%22dateRange%22%3Anull%2C%22lastActivityDays%22%3Anull%2C%22sortBy%22%3A%22updatedAt%22%2C%22sortDirection%22%3A%22desc%22%2C%22useSearchIndex%22%3Afalse%7D%2C%22meta%22%3A%7B%22values%22%3A%7B%22crmStatuses%22%3A%5B%22undefined%22%5D%2C%22pipelines%22%3A%5B%22undefined%22%5D%2C%22types%22%3A%5B%22undefined%22%5D%2C%22activities%22%3A%5B%22undefined%22%5D%2C%22tags%22%3A%5B%22undefined%22%5D%2C%22hasEmail%22%3A%5B%22undefined%22%5D%2C%22hasPhone%22%3A%5B%22undefined%22%5D%2C%22isMember%22%3A%5B%22undefined%22%5D%2C%22assignedToId%22%3A%5B%22undefined%22%5D%2C%22municipality%22%3A%5B%22undefined%22%5D%2C%22municipalityId%22%3A%5B%22undefined%22%5D%2C%22dateRange%22%3A%5B%22undefined%22%5D%2C%22lastActivityDays%22%3A%5B%22undefined%22%5D%7D%2C%22v%22%3A1%7D%7D%7D 500 in 72ms
2025-10-27 20:41:24.899 | prisma:error 
2025-10-27 20:41:24.899 | Invalid `prisma.association.findMany()` invocation:
2025-10-27 20:41:24.899 | 
2025-10-27 20:41:24.899 | {
2025-10-27 20:41:24.899 |   where: {
2025-10-27 20:41:24.899 |     AND: [
2025-10-27 20:41:24.900 |       {
2025-10-27 20:41:24.900 |         OR: [
2025-10-27 20:41:24.900 |           {
2025-10-27 20:41:24.900 |             name: {
2025-10-27 20:41:24.900 |               contains: "fotbo",
2025-10-27 20:41:24.900 |               mode: "insensitive"
2025-10-27 20:41:24.900 |             }
2025-10-27 20:41:24.900 |           },
2025-10-27 20:41:24.900 |           {
2025-10-27 20:41:24.900 |             orgNumber: {
2025-10-27 20:41:24.900 |               contains: "fotbo",
2025-10-27 20:41:24.900 |               mode: "insensitive"
2025-10-27 20:41:24.900 |             }
2025-10-27 20:41:24.900 |           },
2025-10-27 20:41:24.900 |           {
2025-10-27 20:41:24.900 |             streetAddress: {
2025-10-27 20:41:24.900 |               contains: "fotbo",
2025-10-27 20:41:24.900 |               mode: "insensitive"
2025-10-27 20:41:24.900 |             }
2025-10-27 20:41:24.900 |           },
2025-10-27 20:41:24.900 |           {
2025-10-27 20:41:24.900 |             city: {
2025-10-27 20:41:24.900 |               contains: "fotbo",
2025-10-27 20:41:24.900 |               mode: "insensitive"
2025-10-27 20:41:24.900 |             }
2025-10-27 20:41:24.900 |           },
2025-10-27 20:41:24.900 |           {
2025-10-27 20:41:24.900 |             municipality: {
2025-10-27 20:41:24.900 |               contains: "fotbo",
2025-10-27 20:41:24.900 |               mode: "insensitive"
2025-10-27 20:41:24.900 |             }
2025-10-27 20:41:24.900 |           },
2025-10-27 20:41:24.900 |           {
2025-10-27 20:41:24.900 |             email: {
2025-10-27 20:41:24.900 |               contains: "fotbo",
2025-10-27 20:41:24.900 |               mode: "insensitive"
2025-10-27 20:41:24.900 |             }
2025-10-27 20:41:24.900 |           },
2025-10-27 20:41:24.900 |           {
2025-10-27 20:41:24.900 |             phone: {
2025-10-27 20:41:24.900 |               contains: "fotbo",
2025-10-27 20:41:24.900 |               mode: "insensitive"
2025-10-27 20:41:24.900 |             }
2025-10-27 20:41:24.900 |           },
2025-10-27 20:41:24.900 |           {
2025-10-27 20:41:24.900 |             homepageUrl: {
2025-10-27 20:41:24.900 |               contains: "fotbo",
2025-10-27 20:41:24.900 |               mode: "insensitive"
2025-10-27 20:41:24.900 |             }
2025-10-27 20:41:24.900 |           },
2025-10-27 20:41:24.900 |           {
2025-10-27 20:41:24.900 |             descriptionFreeText: {
2025-10-27 20:41:24.900 |               contains: "fotbo",
2025-10-27 20:41:24.900 |               mode: "insensitive"
2025-10-27 20:41:24.900 |             }
2025-10-27 20:41:24.900 |           },
2025-10-27 20:41:24.900 |           {
2025-10-27 20:41:24.900 |             sourceSystem: {
2025-10-27 20:41:24.900 |               contains: "fotbo",
2025-10-27 20:41:24.900 |               mode: "insensitive"
2025-10-27 20:41:24.900 |             }
2025-10-27 20:41:24.900 |           },
2025-10-27 20:41:24.900 |           {
2025-10-27 20:41:24.900 |             tags: {
2025-10-27 20:41:24.900 |               some: {
2025-10-27 20:41:24.900 |                 name: {
2025-10-27 20:41:24.900 |                   contains: "fotbo",
2025-10-27 20:41:24.900 |                   mode: "insensitive"
2025-10-27 20:41:24.900 |                 }
2025-10-27 20:41:24.900 |               }
2025-10-27 20:41:24.900 |             }
2025-10-27 20:41:24.900 |           },
2025-10-27 20:41:24.900 |           {
2025-10-27 20:41:24.900 |             contacts: {
2025-10-27 20:41:24.900 |               some: {
2025-10-27 20:41:24.900 |                 OR: [
2025-10-27 20:41:24.900 |                   {
2025-10-27 20:41:24.900 |                     name: {
2025-10-27 20:41:24.900 |                       contains: "fotbo",
2025-10-27 20:41:24.900 |                       mode: "insensitive"
2025-10-27 20:41:24.900 |                     }
2025-10-27 20:41:24.900 |                   },
2025-10-27 20:41:24.900 |                   {
2025-10-27 20:41:24.900 |                     role: {
2025-10-27 20:41:24.900 |                       contains: "fotbo",
2025-10-27 20:41:24.900 |                       mode: "insensitive"
2025-10-27 20:41:24.900 |                     }
2025-10-27 20:41:24.900 |                   },
2025-10-27 20:41:24.900 |                   {
2025-10-27 20:41:24.900 |                     email: {
2025-10-27 20:41:24.900 |                       contains: "fotbo",
2025-10-27 20:41:24.900 |                       mode: "insensitive"
2025-10-27 20:41:24.900 |                     }
2025-10-27 20:41:24.900 |                   },
2025-10-27 20:41:24.900 |                   {
2025-10-27 20:41:24.900 |                     phone: {
2025-10-27 20:41:24.900 |                       contains: "fotbo",
2025-10-27 20:41:24.900 |                       mode: "insensitive"
2025-10-27 20:41:24.900 |                     }
2025-10-27 20:41:24.900 |                   },
2025-10-27 20:41:24.900 |                   {
2025-10-27 20:41:24.900 |                     mobile: {
2025-10-27 20:41:24.900 |                       contains: "fotbo",
2025-10-27 20:41:24.900 |                       mode: "insensitive"
2025-10-27 20:41:24.900 |                     }
2025-10-27 20:41:24.900 |                   }
2025-10-27 20:41:24.900 |                 ]
2025-10-27 20:41:24.900 |               }
2025-10-27 20:41:24.900 |             }
2025-10-27 20:41:24.900 |           }
2025-10-27 20:41:24.900 |         ]
2025-10-27 20:41:24.900 |       }
2025-10-27 20:41:24.900 |     ]
2025-10-27 20:41:24.900 |   },
2025-10-27 20:41:24.900 |   skip: 0,
2025-10-27 20:41:24.900 |   take: 10,
2025-10-27 20:41:24.900 |   include: {
2025-10-27 20:41:24.900 |     contacts: {
2025-10-27 20:41:24.900 |       where: {
2025-10-27 20:41:24.900 |         isPrimary: true
2025-10-27 20:41:24.900 |       },
2025-10-27 20:41:24.900 |       take: 1
2025-10-27 20:41:24.900 |     },
2025-10-27 20:41:24.900 |     tags: true,
2025-10-27 20:41:24.900 |     _count: {
2025-10-27 20:41:24.900 |       select: {
2025-10-27 20:41:24.900 |         contacts: true,
2025-10-27 20:41:24.900 |         notes: true
2025-10-27 20:41:24.900 |       }
2025-10-27 20:41:24.900 |     },
2025-10-27 20:41:24.900 |     assignedTo: true,
2025-10-27 20:41:24.900 |     activityLog: {
2025-10-27 20:41:24.900 |       orderBy: {
2025-10-27 20:41:24.900 |         createdAt: "desc"
2025-10-27 20:41:24.900 |       },
2025-10-27 20:41:24.900 |       take: 1
2025-10-27 20:41:24.900 |     }
2025-10-27 20:41:24.900 |   },
2025-10-27 20:41:24.900 |   orderBy: {
2025-10-27 20:41:24.900 |     updatedAt: "desc"
2025-10-27 20:41:24.900 |   }
2025-10-27 20:41:24.900 | }
2025-10-27 20:41:24.900 | 
2025-10-27 20:41:24.900 | Unknown argument `mode`. Did you mean `lte`? Available options are marked with ?.
2025-10-27 20:41:25.502 | prisma:error 
2025-10-27 20:41:25.502 | Invalid `prisma.association.count()` invocation:
2025-10-27 20:41:25.502 | 
2025-10-27 20:41:25.502 | {
2025-10-27 20:41:25.502 |   select: {
2025-10-27 20:41:25.502 |     _count: {
2025-10-27 20:41:25.502 |       select: {
2025-10-27 20:41:25.502 |         _all: true
2025-10-27 20:41:25.502 |       }
2025-10-27 20:41:25.502 |     }
2025-10-27 20:41:25.502 |   },
2025-10-27 20:41:25.502 |   where: {
2025-10-27 20:41:25.502 |     AND: [
2025-10-27 20:41:25.502 |       {
2025-10-27 20:41:25.502 |         OR: [
2025-10-27 20:41:25.502 |           {
2025-10-27 20:41:25.502 |             name: {
2025-10-27 20:41:25.502 |               contains: "fotbol",
2025-10-27 20:41:25.502 |               mode: "insensitive"
2025-10-27 20:41:25.502 |             }
2025-10-27 20:41:25.502 |           },
2025-10-27 20:41:25.502 |           {
2025-10-27 20:41:25.502 |             orgNumber: {
2025-10-27 20:41:25.502 |               contains: "fotbol",
2025-10-27 20:41:25.502 |               mode: "insensitive"
2025-10-27 20:41:25.502 |             }
2025-10-27 20:41:25.502 |           },
2025-10-27 20:41:25.502 |           {
2025-10-27 20:41:25.502 |             streetAddress: {
2025-10-27 20:41:25.502 |               contains: "fotbol",
2025-10-27 20:41:25.502 |               mode: "insensitive"
2025-10-27 20:41:25.502 |             }
2025-10-27 20:41:25.502 |           },
2025-10-27 20:41:25.502 |           {
2025-10-27 20:41:25.502 |             city: {
2025-10-27 20:41:25.502 |               contains: "fotbol",
2025-10-27 20:41:25.502 |               mode: "insensitive"
2025-10-27 20:41:25.502 |             }
2025-10-27 20:41:25.502 |           },
2025-10-27 20:41:25.502 |           {
2025-10-27 20:41:25.502 |             municipality: {
2025-10-27 20:41:25.502 |               contains: "fotbol",
2025-10-27 20:41:25.502 |               mode: "insensitive"
2025-10-27 20:41:25.502 |             }
2025-10-27 20:41:25.502 |           },
2025-10-27 20:41:25.502 |           {
2025-10-27 20:41:25.502 |             email: {
2025-10-27 20:41:25.502 |               contains: "fotbol",
2025-10-27 20:41:25.502 |               mode: "insensitive"
2025-10-27 20:41:25.502 |             }
2025-10-27 20:41:25.502 |           },
2025-10-27 20:41:25.502 |           {
2025-10-27 20:41:25.502 |             phone: {
2025-10-27 20:41:25.502 |               contains: "fotbol",
2025-10-27 20:41:25.502 |               mode: "insensitive"
2025-10-27 20:41:25.502 |             }
2025-10-27 20:41:25.502 |           },
2025-10-27 20:41:25.502 |           {
2025-10-27 20:41:25.502 |             homepageUrl: {
2025-10-27 20:41:25.502 |               contains: "fotbol",
2025-10-27 20:41:25.502 |               mode: "insensitive"
2025-10-27 20:41:25.502 |             }
2025-10-27 20:41:25.502 |           },
2025-10-27 20:41:25.502 |           {
2025-10-27 20:41:25.502 |             descriptionFreeText: {
2025-10-27 20:41:25.502 |               contains: "fotbol",
2025-10-27 20:41:25.503 |               mode: "insensitive"
2025-10-27 20:41:25.503 |             }
2025-10-27 20:41:25.503 |           },
2025-10-27 20:41:25.503 |           {
2025-10-27 20:41:25.503 |             sourceSystem: {
2025-10-27 20:41:25.503 |               contains: "fotbol",
2025-10-27 20:41:25.503 |               mode: "insensitive"
2025-10-27 20:41:25.503 |             }
2025-10-27 20:41:25.503 |           },
2025-10-27 20:41:25.503 |           {
2025-10-27 20:41:25.503 |             tags: {
2025-10-27 20:41:25.503 |               some: {
2025-10-27 20:41:25.503 |                 name: {
2025-10-27 20:41:25.503 |                   contains: "fotbol",
2025-10-27 20:41:25.503 |                   mode: "insensitive"
2025-10-27 20:41:25.503 |                 }
2025-10-27 20:41:25.503 |               }
2025-10-27 20:41:25.503 |             }
2025-10-27 20:41:25.503 |           },
2025-10-27 20:41:25.503 |           {
2025-10-27 20:41:25.503 |             contacts: {
2025-10-27 20:41:25.503 |               some: {
2025-10-27 20:41:25.503 |                 OR: [
2025-10-27 20:41:25.503 |                   {
2025-10-27 20:41:25.503 |                     name: {
2025-10-27 20:41:25.503 |                       contains: "fotbol",
2025-10-27 20:41:25.503 |                       mode: "insensitive"
2025-10-27 20:41:25.503 |                     }
2025-10-27 20:41:25.503 |                   },
2025-10-27 20:41:25.503 |                   {
2025-10-27 20:41:25.503 |                     role: {
2025-10-27 20:41:25.503 |                       contains: "fotbol",
2025-10-27 20:41:25.503 |                       mode: "insensitive"
2025-10-27 20:41:25.503 |                     }
2025-10-27 20:41:25.503 |                   },
2025-10-27 20:41:25.503 |                   {
2025-10-27 20:41:25.503 |                     email: {
2025-10-27 20:41:25.503 |                       contains: "fotbol",
2025-10-27 20:41:25.503 |                       mode: "insensitive"
2025-10-27 20:41:25.503 |                     }
2025-10-27 20:41:25.503 |                   },
2025-10-27 20:41:25.503 |                   {
2025-10-27 20:41:25.503 |                     phone: {
2025-10-27 20:41:25.503 |                       contains: "fotbol",
2025-10-27 20:41:25.503 |                       mode: "insensitive"
2025-10-27 20:41:25.503 |                     }
2025-10-27 20:41:25.503 |                   },
2025-10-27 20:41:25.503 |                   {
2025-10-27 20:41:25.503 |                     mobile: {
2025-10-27 20:41:25.503 |                       contains: "fotbol",
2025-10-27 20:41:25.503 |                       mode: "insensitive"
2025-10-27 20:41:25.503 |                     }
2025-10-27 20:41:25.503 |                   }
2025-10-27 20:41:25.503 |                 ]
2025-10-27 20:41:25.503 |               }
2025-10-27 20:41:25.503 |             }
2025-10-27 20:41:25.503 |           }
2025-10-27 20:41:25.503 |         ]
2025-10-27 20:41:25.503 |       }
2025-10-27 20:41:25.503 |     ]
2025-10-27 20:41:25.503 |   }
2025-10-27 20:41:25.503 | }
2025-10-27 20:41:25.503 | 
2025-10-27 20:41:25.503 | Unknown argument `mode`. Did you mean `lte`? Available options are marked with ?.
2025-10-27 20:41:25.506 |  GET /api/trpc/association.list?batch=1&input=%7B%220%22%3A%7B%22json%22%3A%7B%22page%22%3A1%2C%22limit%22%3A10%2C%22search%22%3A%22fotbol%22%2C%22crmStatuses%22%3Anull%2C%22pipelines%22%3Anull%2C%22types%22%3Anull%2C%22activities%22%3Anull%2C%22tags%22%3Anull%2C%22hasEmail%22%3Anull%2C%22hasPhone%22%3Anull%2C%22isMember%22%3Anull%2C%22assignedToId%22%3Anull%2C%22municipality%22%3Anull%2C%22municipalityId%22%3Anull%2C%22dateRange%22%3Anull%2C%22lastActivityDays%22%3Anull%2C%22sortBy%22%3A%22updatedAt%22%2C%22sortDirection%22%3A%22desc%22%2C%22useSearchIndex%22%3Afalse%7D%2C%22meta%22%3A%7B%22values%22%3A%7B%22crmStatuses%22%3A%5B%22undefined%22%5D%2C%22pipelines%22%3A%5B%22undefined%22%5D%2C%22types%22%3A%5B%22undefined%22%5D%2C%22activities%22%3A%5B%22undefined%22%5D%2C%22tags%22%3A%5B%22undefined%22%5D%2C%22hasEmail%22%3A%5B%22undefined%22%5D%2C%22hasPhone%22%3A%5B%22undefined%22%5D%2C%22isMember%22%3A%5B%22undefined%22%5D%2C%22assignedToId%22%3A%5B%22undefined%22%5D%2C%22municipality%22%3A%5B%22undefined%22%5D%2C%22municipalityId%22%3A%5B%22undefined%22%5D%2C%22dateRange%22%3A%5B%22undefined%22%5D%2C%22lastActivityDays%22%3A%5B%22undefined%22%5D%7D%2C%22v%22%3A1%7D%7D%7D 500 in 91ms
2025-10-27 20:41:25.508 | prisma:error 
2025-10-27 20:41:25.508 | Invalid `prisma.association.findMany()` invocation:
2025-10-27 20:41:25.508 | 
2025-10-27 20:41:25.508 | {
2025-10-27 20:41:25.508 |   where: {
2025-10-27 20:41:25.508 |     AND: [
2025-10-27 20:41:25.508 |       {
2025-10-27 20:41:25.508 |         OR: [
2025-10-27 20:41:25.508 |           {
2025-10-27 20:41:25.508 |             name: {
2025-10-27 20:41:25.508 |               contains: "fotbol",
2025-10-27 20:41:25.508 |               mode: "insensitive"
2025-10-27 20:41:25.508 |             }
2025-10-27 20:41:25.508 |           },
2025-10-27 20:41:25.508 |           {
2025-10-27 20:41:25.508 |             orgNumber: {
2025-10-27 20:41:25.508 |               contains: "fotbol",
2025-10-27 20:41:25.508 |               mode: "insensitive"
2025-10-27 20:41:25.508 |             }
2025-10-27 20:41:25.508 |           },
2025-10-27 20:41:25.508 |           {
2025-10-27 20:41:25.508 |             streetAddress: {
2025-10-27 20:41:25.508 |               contains: "fotbol",
2025-10-27 20:41:25.508 |               mode: "insensitive"
2025-10-27 20:41:25.508 |             }
2025-10-27 20:41:25.508 |           },
2025-10-27 20:41:25.508 |           {
2025-10-27 20:41:25.508 |             city: {
2025-10-27 20:41:25.508 |               contains: "fotbol",
2025-10-27 20:41:25.508 |               mode: "insensitive"
2025-10-27 20:41:25.508 |             }
2025-10-27 20:41:25.508 |           },
2025-10-27 20:41:25.508 |           {
2025-10-27 20:41:25.508 |             municipality: {
2025-10-27 20:41:25.508 |               contains: "fotbol",
2025-10-27 20:41:25.508 |               mode: "insensitive"
2025-10-27 20:41:25.508 |             }
2025-10-27 20:41:25.508 |           },
2025-10-27 20:41:25.508 |           {
2025-10-27 20:41:25.508 |             email: {
2025-10-27 20:41:25.508 |               contains: "fotbol",
2025-10-27 20:41:25.508 |               mode: "insensitive"
2025-10-27 20:41:25.508 |             }
2025-10-27 20:41:25.508 |           },
2025-10-27 20:41:25.508 |           {
2025-10-27 20:41:25.508 |             phone: {
2025-10-27 20:41:25.508 |               contains: "fotbol",
2025-10-27 20:41:25.508 |               mode: "insensitive"
2025-10-27 20:41:25.508 |             }
2025-10-27 20:41:25.508 |           },
2025-10-27 20:41:25.508 |           {
2025-10-27 20:41:25.508 |             homepageUrl: {
2025-10-27 20:41:25.508 |               contains: "fotbol",
2025-10-27 20:41:25.508 |               mode: "insensitive"
2025-10-27 20:41:25.508 |             }
2025-10-27 20:41:25.508 |           },
2025-10-27 20:41:25.508 |           {
2025-10-27 20:41:25.508 |             descriptionFreeText: {
2025-10-27 20:41:25.508 |               contains: "fotbol",
2025-10-27 20:41:25.508 |               mode: "insensitive"
2025-10-27 20:41:25.508 |             }
2025-10-27 20:41:25.508 |           },
2025-10-27 20:41:25.508 |           {
2025-10-27 20:41:25.508 |             sourceSystem: {
2025-10-27 20:41:25.508 |               contains: "fotbol",
2025-10-27 20:41:25.508 |               mode: "insensitive"
2025-10-27 20:41:25.508 |             }
2025-10-27 20:41:25.508 |           },
2025-10-27 20:41:25.508 |           {
2025-10-27 20:41:25.508 |             tags: {
2025-10-27 20:41:25.508 |               some: {
2025-10-27 20:41:25.508 |                 name: {
2025-10-27 20:41:25.508 |                   contains: "fotbol",
2025-10-27 20:41:25.508 |                   mode: "insensitive"
2025-10-27 20:41:25.508 |                 }
2025-10-27 20:41:25.509 |               }
2025-10-27 20:41:25.509 |             }
2025-10-27 20:41:25.509 |           },
2025-10-27 20:41:25.509 |           {
2025-10-27 20:41:25.509 |             contacts: {
2025-10-27 20:41:25.509 |               some: {
2025-10-27 20:41:25.509 |                 OR: [
2025-10-27 20:41:25.509 |                   {
2025-10-27 20:41:25.509 |                     name: {
2025-10-27 20:41:25.509 |                       contains: "fotbol",
2025-10-27 20:41:25.509 |                       mode: "insensitive"
2025-10-27 20:41:25.509 |                     }
2025-10-27 20:41:25.509 |                   },
2025-10-27 20:41:25.509 |                   {
2025-10-27 20:41:25.509 |                     role: {
2025-10-27 20:41:25.509 |                       contains: "fotbol",
2025-10-27 20:41:25.509 |                       mode: "insensitive"
2025-10-27 20:41:25.509 |                     }
2025-10-27 20:41:25.509 |                   },
2025-10-27 20:41:25.509 |                   {
2025-10-27 20:41:25.509 |                     email: {
2025-10-27 20:41:25.509 |                       contains: "fotbol",
2025-10-27 20:41:25.509 |                       mode: "insensitive"
2025-10-27 20:41:25.509 |                     }
2025-10-27 20:41:25.509 |                   },
2025-10-27 20:41:25.509 |                   {
2025-10-27 20:41:25.509 |                     phone: {
2025-10-27 20:41:25.509 |                       contains: "fotbol",
2025-10-27 20:41:25.509 |                       mode: "insensitive"
2025-10-27 20:41:25.509 |                     }
2025-10-27 20:41:25.509 |                   },
2025-10-27 20:41:25.509 |                   {
2025-10-27 20:41:25.509 |                     mobile: {
2025-10-27 20:41:25.509 |                       contains: "fotbol",
2025-10-27 20:41:25.509 |                       mode: "insensitive"
2025-10-27 20:41:25.509 |                     }
2025-10-27 20:41:25.509 |                   }
2025-10-27 20:41:25.509 |                 ]
2025-10-27 20:41:25.509 |               }
2025-10-27 20:41:25.509 |             }
2025-10-27 20:41:25.509 |           }
2025-10-27 20:41:25.509 |         ]
2025-10-27 20:41:25.509 |       }
2025-10-27 20:41:25.509 |     ]
2025-10-27 20:41:25.509 |   },
2025-10-27 20:41:25.509 |   skip: 0,
2025-10-27 20:41:25.509 |   take: 10,
2025-10-27 20:41:25.509 |   include: {
2025-10-27 20:41:25.509 |     contacts: {
2025-10-27 20:41:25.509 |       where: {
2025-10-27 20:41:25.509 |         isPrimary: true
2025-10-27 20:41:25.509 |       },
2025-10-27 20:41:25.509 |       take: 1
2025-10-27 20:41:25.509 |     },
2025-10-27 20:41:25.509 |     tags: true,
2025-10-27 20:41:25.509 |     _count: {
2025-10-27 20:41:25.509 |       select: {
2025-10-27 20:41:25.509 |         contacts: true,
2025-10-27 20:41:25.509 |         notes: true
2025-10-27 20:41:25.509 |       }
2025-10-27 20:41:25.509 |     },
2025-10-27 20:41:25.509 |     assignedTo: true,
2025-10-27 20:41:25.509 |     activityLog: {
2025-10-27 20:41:25.509 |       orderBy: {
2025-10-27 20:41:25.509 |         createdAt: "desc"
2025-10-27 20:41:25.509 |       },
2025-10-27 20:41:25.509 |       take: 1
2025-10-27 20:41:25.509 |     }
2025-10-27 20:41:25.509 |   },
2025-10-27 20:41:25.509 |   orderBy: {
2025-10-27 20:41:25.509 |     updatedAt: "desc"
2025-10-27 20:41:25.509 |   }
2025-10-27 20:41:25.509 | }
2025-10-27 20:41:25.509 | 
2025-10-27 20:41:25.509 | Unknown argument `mode`. Did you mean `lte`? Available options are marked with ?.
2025-10-27 20:41:26.068 | prisma:error 
2025-10-27 20:41:26.068 | Invalid `prisma.association.count()` invocation:
2025-10-27 20:41:26.068 | 
2025-10-27 20:41:26.068 | {
2025-10-27 20:41:26.068 |   select: {
2025-10-27 20:41:26.068 |     _count: {
2025-10-27 20:41:26.068 |       select: {
2025-10-27 20:41:26.068 |         _all: true
2025-10-27 20:41:26.068 |       }
2025-10-27 20:41:26.068 |     }
2025-10-27 20:41:26.068 |   },
2025-10-27 20:41:26.068 |   where: {
2025-10-27 20:41:26.068 |     AND: [
2025-10-27 20:41:26.068 |       {
2025-10-27 20:41:26.068 |         OR: [
2025-10-27 20:41:26.068 |           {
2025-10-27 20:41:26.068 |             name: {
2025-10-27 20:41:26.068 |               contains: "fotboll",
2025-10-27 20:41:26.068 |               mode: "insensitive"
2025-10-27 20:41:26.068 |             }
2025-10-27 20:41:26.068 |           },
2025-10-27 20:41:26.068 |           {
2025-10-27 20:41:26.068 |             orgNumber: {
2025-10-27 20:41:26.068 |               contains: "fotboll",
2025-10-27 20:41:26.068 |               mode: "insensitive"
2025-10-27 20:41:26.068 |             }
2025-10-27 20:41:26.068 |           },
2025-10-27 20:41:26.068 |           {
2025-10-27 20:41:26.068 |             streetAddress: {
2025-10-27 20:41:26.068 |               contains: "fotboll",
2025-10-27 20:41:26.068 |               mode: "insensitive"
2025-10-27 20:41:26.068 |             }
2025-10-27 20:41:26.068 |           },
2025-10-27 20:41:26.068 |           {
2025-10-27 20:41:26.068 |             city: {
2025-10-27 20:41:26.068 |               contains: "fotboll",
2025-10-27 20:41:26.068 |               mode: "insensitive"
2025-10-27 20:41:26.068 |             }
2025-10-27 20:41:26.068 |           },
2025-10-27 20:41:26.068 |           {
2025-10-27 20:41:26.068 |             municipality: {
2025-10-27 20:41:26.068 |               contains: "fotboll",
2025-10-27 20:41:26.068 |               mode: "insensitive"
2025-10-27 20:41:26.068 |             }
2025-10-27 20:41:26.068 |           },
2025-10-27 20:41:26.068 |           {
2025-10-27 20:41:26.068 |             email: {
2025-10-27 20:41:26.068 |               contains: "fotboll",
2025-10-27 20:41:26.068 |               mode: "insensitive"
2025-10-27 20:41:26.068 |             }
2025-10-27 20:41:26.068 |           },
2025-10-27 20:41:26.068 |           {
2025-10-27 20:41:26.068 |             phone: {
2025-10-27 20:41:26.068 |               contains: "fotboll",
2025-10-27 20:41:26.068 |               mode: "insensitive"
2025-10-27 20:41:26.068 |             }
2025-10-27 20:41:26.068 |           },
2025-10-27 20:41:26.068 |           {
2025-10-27 20:41:26.068 |             homepageUrl: {
2025-10-27 20:41:26.068 |               contains: "fotboll",
2025-10-27 20:41:26.068 |               mode: "insensitive"
2025-10-27 20:41:26.068 |             }
2025-10-27 20:41:26.068 |           },
2025-10-27 20:41:26.068 |           {
2025-10-27 20:41:26.068 |             descriptionFreeText: {
2025-10-27 20:41:26.068 |               contains: "fotboll",
2025-10-27 20:41:26.068 |               mode: "insensitive"
2025-10-27 20:41:26.068 |             }
2025-10-27 20:41:26.068 |           },
2025-10-27 20:41:26.068 |           {
2025-10-27 20:41:26.068 |             sourceSystem: {
2025-10-27 20:41:26.068 |               contains: "fotboll",
2025-10-27 20:41:26.068 |               mode: "insensitive"
2025-10-27 20:41:26.068 |             }
2025-10-27 20:41:26.068 |           },
2025-10-27 20:41:26.068 |           {
2025-10-27 20:41:26.068 |             tags: {
2025-10-27 20:41:26.068 |               some: {
2025-10-27 20:41:26.068 |                 name: {
2025-10-27 20:41:26.068 |                   contains: "fotboll",
2025-10-27 20:41:26.068 |                   mode: "insensitive"
2025-10-27 20:41:26.068 |                 }
2025-10-27 20:41:26.068 |               }
2025-10-27 20:41:26.068 |             }
2025-10-27 20:41:26.068 |           },
2025-10-27 20:41:26.068 |           {
2025-10-27 20:41:26.068 |             contacts: {
2025-10-27 20:41:26.068 |               some: {
2025-10-27 20:41:26.068 |                 OR: [
2025-10-27 20:41:26.068 |                   {
2025-10-27 20:41:26.068 |                     name: {
2025-10-27 20:41:26.068 |                       contains: "fotboll",
2025-10-27 20:41:26.068 |                       mode: "insensitive"
2025-10-27 20:41:26.068 |                     }
2025-10-27 20:41:26.068 |                   },
2025-10-27 20:41:26.068 |                   {
2025-10-27 20:41:26.068 |                     role: {
2025-10-27 20:41:26.068 |                       contains: "fotboll",
2025-10-27 20:41:26.068 |                       mode: "insensitive"
2025-10-27 20:41:26.068 |                     }
2025-10-27 20:41:26.068 |                   },
2025-10-27 20:41:26.068 |                   {
2025-10-27 20:41:26.068 |                     email: {
2025-10-27 20:41:26.068 |                       contains: "fotboll",
2025-10-27 20:41:26.068 |                       mode: "insensitive"
2025-10-27 20:41:26.068 |                     }
2025-10-27 20:41:26.068 |                   },
2025-10-27 20:41:26.068 |                   {
2025-10-27 20:41:26.068 |                     phone: {
2025-10-27 20:41:26.068 |                       contains: "fotboll",
2025-10-27 20:41:26.068 |                       mode: "insensitive"
2025-10-27 20:41:26.068 |                     }
2025-10-27 20:41:26.068 |                   },
2025-10-27 20:41:26.068 |                   {
2025-10-27 20:41:26.068 |                     mobile: {
2025-10-27 20:41:26.068 |                       contains: "fotboll",
2025-10-27 20:41:26.068 |                       mode: "insensitive"
2025-10-27 20:41:26.068 |                     }
2025-10-27 20:41:26.068 |                   }
2025-10-27 20:41:26.068 |                 ]
2025-10-27 20:41:26.068 |               }
2025-10-27 20:41:26.068 |             }
2025-10-27 20:41:26.068 |           }
2025-10-27 20:41:26.068 |         ]
2025-10-27 20:41:26.068 |       }
2025-10-27 20:41:26.068 |     ]
2025-10-27 20:41:26.068 |   }
2025-10-27 20:41:26.068 | }
2025-10-27 20:41:26.068 | 
2025-10-27 20:41:26.068 | Unknown argument `mode`. Did you mean `lte`? Available options are marked with ?.
2025-10-27 20:41:26.070 |  GET /api/trpc/association.list?batch=1&input=%7B%220%22%3A%7B%22json%22%3A%7B%22page%22%3A1%2C%22limit%22%3A10%2C%22search%22%3A%22fotboll%22%2C%22crmStatuses%22%3Anull%2C%22pipelines%22%3Anull%2C%22types%22%3Anull%2C%22activities%22%3Anull%2C%22tags%22%3Anull%2C%22hasEmail%22%3Anull%2C%22hasPhone%22%3Anull%2C%22isMember%22%3Anull%2C%22assignedToId%22%3Anull%2C%22municipality%22%3Anull%2C%22municipalityId%22%3Anull%2C%22dateRange%22%3Anull%2C%22lastActivityDays%22%3Anull%2C%22sortBy%22%3A%22updatedAt%22%2C%22sortDirection%22%3A%22desc%22%2C%22useSearchIndex%22%3Afalse%7D%2C%22meta%22%3A%7B%22values%22%3A%7B%22crmStatuses%22%3A%5B%22undefined%22%5D%2C%22pipelines%22%3A%5B%22undefined%22%5D%2C%22types%22%3A%5B%22undefined%22%5D%2C%22activities%22%3A%5B%22undefined%22%5D%2C%22tags%22%3A%5B%22undefined%22%5D%2C%22hasEmail%22%3A%5B%22undefined%22%5D%2C%22hasPhone%22%3A%5B%22undefined%22%5D%2C%22isMember%22%3A%5B%22undefined%22%5D%2C%22assignedToId%22%3A%5B%22undefined%22%5D%2C%22municipality%22%3A%5B%22undefined%22%5D%2C%22municipalityId%22%3A%5B%22undefined%22%5D%2C%22dateRange%22%3A%5B%22undefined%22%5D%2C%22lastActivityDays%22%3A%5B%22undefined%22%5D%7D%2C%22v%22%3A1%7D%7D%7D 500 in 68ms
2025-10-27 20:41:26.073 | prisma:error 
2025-10-27 20:41:26.073 | Invalid `prisma.association.findMany()` invocation:
2025-10-27 20:41:26.073 | 
2025-10-27 20:41:26.073 | {
2025-10-27 20:41:26.073 |   where: {
2025-10-27 20:41:26.073 |     AND: [
2025-10-27 20:41:26.073 |       {
2025-10-27 20:41:26.073 |         OR: [
2025-10-27 20:41:26.073 |           {
2025-10-27 20:41:26.073 |             name: {
2025-10-27 20:41:26.073 |               contains: "fotboll",
2025-10-27 20:41:26.073 |               mode: "insensitive"
2025-10-27 20:41:26.073 |             }
2025-10-27 20:41:26.073 |           },
2025-10-27 20:41:26.073 |           {
2025-10-27 20:41:26.073 |             orgNumber: {
2025-10-27 20:41:26.073 |               contains: "fotboll",
2025-10-27 20:41:26.073 |               mode: "insensitive"
2025-10-27 20:41:26.073 |             }
2025-10-27 20:41:26.073 |           },
2025-10-27 20:41:26.073 |           {
2025-10-27 20:41:26.073 |             streetAddress: {
2025-10-27 20:41:26.073 |               contains: "fotboll",
2025-10-27 20:41:26.073 |               mode: "insensitive"
2025-10-27 20:41:26.073 |             }
2025-10-27 20:41:26.073 |           },
2025-10-27 20:41:26.073 |           {
2025-10-27 20:41:26.073 |             city: {
2025-10-27 20:41:26.073 |               contains: "fotboll",
2025-10-27 20:41:26.073 |               mode: "insensitive"
2025-10-27 20:41:26.073 |             }
2025-10-27 20:41:26.073 |           },
2025-10-27 20:41:26.073 |           {
2025-10-27 20:41:26.073 |             municipality: {
2025-10-27 20:41:26.073 |               contains: "fotboll",
2025-10-27 20:41:26.073 |               mode: "insensitive"
2025-10-27 20:41:26.073 |             }
2025-10-27 20:41:26.073 |           },
2025-10-27 20:41:26.073 |           {
2025-10-27 20:41:26.073 |             email: {
2025-10-27 20:41:26.073 |               contains: "fotboll",
2025-10-27 20:41:26.073 |               mode: "insensitive"
2025-10-27 20:41:26.073 |             }
2025-10-27 20:41:26.073 |           },
2025-10-27 20:41:26.073 |           {
2025-10-27 20:41:26.073 |             phone: {
2025-10-27 20:41:26.073 |               contains: "fotboll",
2025-10-27 20:41:26.073 |               mode: "insensitive"
2025-10-27 20:41:26.073 |             }
2025-10-27 20:41:26.073 |           },
2025-10-27 20:41:26.073 |           {
2025-10-27 20:41:26.073 |             homepageUrl: {
2025-10-27 20:41:26.073 |               contains: "fotboll",
2025-10-27 20:41:26.073 |               mode: "insensitive"
2025-10-27 20:41:26.073 |             }
2025-10-27 20:41:26.073 |           },
2025-10-27 20:41:26.073 |           {
2025-10-27 20:41:26.073 |             descriptionFreeText: {
2025-10-27 20:41:26.073 |               contains: "fotboll",
2025-10-27 20:41:26.073 |               mode: "insensitive"
2025-10-27 20:41:26.073 |             }
2025-10-27 20:41:26.073 |           },
2025-10-27 20:41:26.073 |           {
2025-10-27 20:41:26.073 |             sourceSystem: {
2025-10-27 20:41:26.073 |               contains: "fotboll",
2025-10-27 20:41:26.073 |               mode: "insensitive"
2025-10-27 20:41:26.073 |             }
2025-10-27 20:41:26.073 |           },
2025-10-27 20:41:26.073 |           {
2025-10-27 20:41:26.073 |             tags: {
2025-10-27 20:41:26.073 |               some: {
2025-10-27 20:41:26.073 |                 name: {
2025-10-27 20:41:26.073 |                   contains: "fotboll",
2025-10-27 20:41:26.073 |                   mode: "insensitive"
2025-10-27 20:41:26.073 |                 }
2025-10-27 20:41:26.073 |               }
2025-10-27 20:41:26.073 |             }
2025-10-27 20:41:26.073 |           },
2025-10-27 20:41:26.073 |           {
2025-10-27 20:41:26.073 |             contacts: {
2025-10-27 20:41:26.073 |               some: {
2025-10-27 20:41:26.073 |                 OR: [
2025-10-27 20:41:26.073 |                   {
2025-10-27 20:41:26.073 |                     name: {
2025-10-27 20:41:26.073 |                       contains: "fotboll",
2025-10-27 20:41:26.073 |                       mode: "insensitive"
2025-10-27 20:41:26.073 |                     }
2025-10-27 20:41:26.073 |                   },
2025-10-27 20:41:26.073 |                   {
2025-10-27 20:41:26.073 |                     role: {
2025-10-27 20:41:26.073 |                       contains: "fotboll",
2025-10-27 20:41:26.073 |                       mode: "insensitive"
2025-10-27 20:41:26.073 |                     }
2025-10-27 20:41:26.073 |                   },
2025-10-27 20:41:26.073 |                   {
2025-10-27 20:41:26.073 |                     email: {
2025-10-27 20:41:26.073 |                       contains: "fotboll",
2025-10-27 20:41:26.073 |                       mode: "insensitive"
2025-10-27 20:41:26.073 |                     }
2025-10-27 20:41:26.073 |                   },
2025-10-27 20:41:26.073 |                   {
2025-10-27 20:41:26.073 |                     phone: {
2025-10-27 20:41:26.073 |                       contains: "fotboll",
2025-10-27 20:41:26.074 |                       mode: "insensitive"
2025-10-27 20:41:26.074 |                     }
2025-10-27 20:41:26.074 |                   },
2025-10-27 20:41:26.074 |                   {
2025-10-27 20:41:26.074 |                     mobile: {
2025-10-27 20:41:26.074 |                       contains: "fotboll",
2025-10-27 20:41:26.074 |                       mode: "insensitive"
2025-10-27 20:41:26.074 |                     }
2025-10-27 20:41:26.074 |                   }
2025-10-27 20:41:26.074 |                 ]
2025-10-27 20:41:26.074 |               }
2025-10-27 20:41:26.074 |             }
2025-10-27 20:41:26.074 |           }
2025-10-27 20:41:26.074 |         ]
2025-10-27 20:41:26.074 |       }
2025-10-27 20:41:26.074 |     ]
2025-10-27 20:41:26.074 |   },
2025-10-27 20:41:26.074 |   skip: 0,
2025-10-27 20:41:26.074 |   take: 10,
2025-10-27 20:41:26.074 |   include: {
2025-10-27 20:41:26.074 |     contacts: {
2025-10-27 20:41:26.074 |       where: {
2025-10-27 20:41:26.074 |         isPrimary: true
2025-10-27 20:41:26.074 |       },
2025-10-27 20:41:26.074 |       take: 1
2025-10-27 20:41:26.074 |     },
2025-10-27 20:41:26.074 |     tags: true,
2025-10-27 20:41:26.074 |     _count: {
2025-10-27 20:41:26.074 |       select: {
2025-10-27 20:41:26.074 |         contacts: true,
2025-10-27 20:41:26.074 |         notes: true
2025-10-27 20:41:26.074 |       }
2025-10-27 20:41:26.074 |     },
2025-10-27 20:41:26.074 |     assignedTo: true,
2025-10-27 20:41:26.074 |     activityLog: {
2025-10-27 20:41:26.074 |       orderBy: {
2025-10-27 20:41:26.074 |         createdAt: "desc"
2025-10-27 20:41:26.074 |       },
2025-10-27 20:41:26.074 |       take: 1
2025-10-27 20:41:26.074 |     }
2025-10-27 20:41:26.074 |   },
2025-10-27 20:41:26.074 |   orderBy: {
2025-10-27 20:41:26.074 |     updatedAt: "desc"
2025-10-27 20:41:26.074 |   }
2025-10-27 20:41:26.074 | }
2025-10-27 20:41:26.074 | 
2025-10-27 20:41:26.074 | Unknown argument `mode`. Did you mean `lte`? Available options are marked with ?.
2025-10-27 20:41:27.219 | prisma:error 
2025-10-27 20:41:27.219 | Invalid `prisma.association.count()` invocation:
2025-10-27 20:41:27.219 | 
2025-10-27 20:41:27.219 | {
2025-10-27 20:41:27.219 |   select: {
2025-10-27 20:41:27.219 |     _count: {
2025-10-27 20:41:27.219 |       select: {
2025-10-27 20:41:27.219 |         _all: true
2025-10-27 20:41:27.219 |       }
2025-10-27 20:41:27.219 |     }
2025-10-27 20:41:27.219 |   },
2025-10-27 20:41:27.219 |   where: {
2025-10-27 20:41:27.219 |     AND: [
2025-10-27 20:41:27.219 |       {
2025-10-27 20:41:27.219 |         OR: [
2025-10-27 20:41:27.219 |           {
2025-10-27 20:41:27.219 |             name: {
2025-10-27 20:41:27.219 |               contains: "fotboll",
2025-10-27 20:41:27.219 |               mode: "insensitive"
2025-10-27 20:41:27.219 |             }
2025-10-27 20:41:27.219 |           },
2025-10-27 20:41:27.219 |           {
2025-10-27 20:41:27.219 |             orgNumber: {
2025-10-27 20:41:27.219 |               contains: "fotboll",
2025-10-27 20:41:27.219 |               mode: "insensitive"
2025-10-27 20:41:27.219 |             }
2025-10-27 20:41:27.219 |           },
2025-10-27 20:41:27.219 |           {
2025-10-27 20:41:27.219 |             streetAddress: {
2025-10-27 20:41:27.219 |               contains: "fotboll",
2025-10-27 20:41:27.219 |               mode: "insensitive"
2025-10-27 20:41:27.219 |             }
2025-10-27 20:41:27.219 |           },
2025-10-27 20:41:27.219 |           {
2025-10-27 20:41:27.219 |             city: {
2025-10-27 20:41:27.219 |               contains: "fotboll",
2025-10-27 20:41:27.219 |               mode: "insensitive"
2025-10-27 20:41:27.219 |             }
2025-10-27 20:41:27.219 |           },
2025-10-27 20:41:27.219 |           {
2025-10-27 20:41:27.219 |             municipality: {
2025-10-27 20:41:27.219 |               contains: "fotboll",
2025-10-27 20:41:27.219 |               mode: "insensitive"
2025-10-27 20:41:27.219 |             }
2025-10-27 20:41:27.219 |           },
2025-10-27 20:41:27.219 |           {
2025-10-27 20:41:27.219 |             email: {
2025-10-27 20:41:27.219 |               contains: "fotboll",
2025-10-27 20:41:27.219 |               mode: "insensitive"
2025-10-27 20:41:27.219 |             }
2025-10-27 20:41:27.219 |           },
2025-10-27 20:41:27.219 |           {
2025-10-27 20:41:27.219 |             phone: {
2025-10-27 20:41:27.219 |               contains: "fotboll",
2025-10-27 20:41:27.219 |               mode: "insensitive"
2025-10-27 20:41:27.219 |             }
2025-10-27 20:41:27.219 |           },
2025-10-27 20:41:27.219 |           {
2025-10-27 20:41:27.219 |             homepageUrl: {
2025-10-27 20:41:27.219 |               contains: "fotboll",
2025-10-27 20:41:27.219 |               mode: "insensitive"
2025-10-27 20:41:27.219 |             }
2025-10-27 20:41:27.219 |           },
2025-10-27 20:41:27.219 |           {
2025-10-27 20:41:27.219 |             descriptionFreeText: {
2025-10-27 20:41:27.219 |               contains: "fotboll",
2025-10-27 20:41:27.219 |               mode: "insensitive"
2025-10-27 20:41:27.219 |             }
2025-10-27 20:41:27.219 |           },
2025-10-27 20:41:27.219 |           {
2025-10-27 20:41:27.219 |             sourceSystem: {
2025-10-27 20:41:27.219 |               contains: "fotboll",
2025-10-27 20:41:27.219 |               mode: "insensitive"
2025-10-27 20:41:27.219 |             }
2025-10-27 20:41:27.219 |           },
2025-10-27 20:41:27.219 |           {
2025-10-27 20:41:27.219 |             tags: {
2025-10-27 20:41:27.219 |               some: {
2025-10-27 20:41:27.219 |                 name: {
2025-10-27 20:41:27.219 |                   contains: "fotboll",
2025-10-27 20:41:27.219 |                   mode: "insensitive"
2025-10-27 20:41:27.219 |                 }
2025-10-27 20:41:27.219 |               }
2025-10-27 20:41:27.219 |             }
2025-10-27 20:41:27.219 |           },
2025-10-27 20:41:27.219 |           {
2025-10-27 20:41:27.219 |             contacts: {
2025-10-27 20:41:27.219 |               some: {
2025-10-27 20:41:27.219 |                 OR: [
2025-10-27 20:41:27.219 |                   {
2025-10-27 20:41:27.219 |                     name: {
2025-10-27 20:41:27.219 |                       contains: "fotboll",
2025-10-27 20:41:27.219 |                       mode: "insensitive"
2025-10-27 20:41:27.219 |                     }
2025-10-27 20:41:27.219 |                   },
2025-10-27 20:41:27.219 |                   {
2025-10-27 20:41:27.219 |                     role: {
2025-10-27 20:41:27.219 |                       contains: "fotboll",
2025-10-27 20:41:27.219 |                       mode: "insensitive"
2025-10-27 20:41:27.219 |                     }
2025-10-27 20:41:27.219 |                   },
2025-10-27 20:41:27.219 |                   {
2025-10-27 20:41:27.219 |                     email: {
2025-10-27 20:41:27.219 |                       contains: "fotboll",
2025-10-27 20:41:27.219 |                       mode: "insensitive"
2025-10-27 20:41:27.219 |                     }
2025-10-27 20:41:27.219 |                   },
2025-10-27 20:41:27.219 |                   {
2025-10-27 20:41:27.219 |                     phone: {
2025-10-27 20:41:27.219 |                       contains: "fotboll",
2025-10-27 20:41:27.219 |                       mode: "insensitive"
2025-10-27 20:41:27.219 |                     }
2025-10-27 20:41:27.219 |                   },
2025-10-27 20:41:27.219 |                   {
2025-10-27 20:41:27.219 |                     mobile: {
2025-10-27 20:41:27.219 |                       contains: "fotboll",
2025-10-27 20:41:27.219 |                       mode: "insensitive"
2025-10-27 20:41:27.219 |                     }
2025-10-27 20:41:27.219 |                   }
2025-10-27 20:41:27.219 |                 ]
2025-10-27 20:41:27.219 |               }
2025-10-27 20:41:27.219 |             }
2025-10-27 20:41:27.219 |           }
2025-10-27 20:41:27.219 |         ]
2025-10-27 20:41:27.219 |       }
2025-10-27 20:41:27.219 |     ]
2025-10-27 20:41:27.219 |   }
2025-10-27 20:41:27.219 | }
2025-10-27 20:41:27.219 | 
2025-10-27 20:41:27.219 | Unknown argument `mode`. Did you mean `lte`? Available options are marked with ?.
2025-10-27 20:41:27.222 |  GET /api/trpc/association.list?batch=1&input=%7B%220%22%3A%7B%22json%22%3A%7B%22page%22%3A1%2C%22limit%22%3A10%2C%22search%22%3A%22fotboll%22%2C%22crmStatuses%22%3Anull%2C%22pipelines%22%3Anull%2C%22types%22%3Anull%2C%22activities%22%3Anull%2C%22tags%22%3Anull%2C%22hasEmail%22%3Anull%2C%22hasPhone%22%3Anull%2C%22isMember%22%3Anull%2C%22assignedToId%22%3Anull%2C%22municipality%22%3Anull%2C%22municipalityId%22%3Anull%2C%22dateRange%22%3Anull%2C%22lastActivityDays%22%3Anull%2C%22sortBy%22%3A%22updatedAt%22%2C%22sortDirection%22%3A%22desc%22%2C%22useSearchIndex%22%3Afalse%7D%2C%22meta%22%3A%7B%22values%22%3A%7B%22crmStatuses%22%3A%5B%22undefined%22%5D%2C%22pipelines%22%3A%5B%22undefined%22%5D%2C%22types%22%3A%5B%22undefined%22%5D%2C%22activities%22%3A%5B%22undefined%22%5D%2C%22tags%22%3A%5B%22undefined%22%5D%2C%22hasEmail%22%3A%5B%22undefined%22%5D%2C%22hasPhone%22%3A%5B%22undefined%22%5D%2C%22isMember%22%3A%5B%22undefined%22%5D%2C%22assignedToId%22%3A%5B%22undefined%22%5D%2C%22municipality%22%3A%5B%22undefined%22%5D%2C%22municipalityId%22%3A%5B%22undefined%22%5D%2C%22dateRange%22%3A%5B%22undefined%22%5D%2C%22lastActivityDays%22%3A%5B%22undefined%22%5D%7D%2C%22v%22%3A1%7D%7D%7D 500 in 86ms
2025-10-27 20:41:27.225 | prisma:error 
2025-10-27 20:41:27.225 | Invalid `prisma.association.findMany()` invocation:
2025-10-27 20:41:27.225 | 
2025-10-27 20:41:27.225 | {
2025-10-27 20:41:27.225 |   where: {
2025-10-27 20:41:27.225 |     AND: [
2025-10-27 20:41:27.225 |       {
2025-10-27 20:41:27.225 |         OR: [
2025-10-27 20:41:27.225 |           {
2025-10-27 20:41:27.225 |             name: {
2025-10-27 20:41:27.225 |               contains: "fotboll",
2025-10-27 20:41:27.225 |               mode: "insensitive"
2025-10-27 20:41:27.225 |             }
2025-10-27 20:41:27.225 |           },
2025-10-27 20:41:27.225 |           {
2025-10-27 20:41:27.225 |             orgNumber: {
2025-10-27 20:41:27.225 |               contains: "fotboll",
2025-10-27 20:41:27.225 |               mode: "insensitive"
2025-10-27 20:41:27.225 |             }
2025-10-27 20:41:27.225 |           },
2025-10-27 20:41:27.225 |           {
2025-10-27 20:41:27.225 |             streetAddress: {
2025-10-27 20:41:27.225 |               contains: "fotboll",
2025-10-27 20:41:27.225 |               mode: "insensitive"
2025-10-27 20:41:27.225 |             }
2025-10-27 20:41:27.225 |           },
2025-10-27 20:41:27.225 |           {
2025-10-27 20:41:27.225 |             city: {
2025-10-27 20:41:27.225 |               contains: "fotboll",
2025-10-27 20:41:27.225 |               mode: "insensitive"
2025-10-27 20:41:27.225 |             }
2025-10-27 20:41:27.225 |           },
2025-10-27 20:41:27.225 |           {
2025-10-27 20:41:27.225 |             municipality: {
2025-10-27 20:41:27.225 |               contains: "fotboll",
2025-10-27 20:41:27.225 |               mode: "insensitive"
2025-10-27 20:41:27.225 |             }
2025-10-27 20:41:27.225 |           },
2025-10-27 20:41:27.225 |           {
2025-10-27 20:41:27.225 |             email: {
2025-10-27 20:41:27.225 |               contains: "fotboll",
2025-10-27 20:41:27.225 |               mode: "insensitive"
2025-10-27 20:41:27.225 |             }
2025-10-27 20:41:27.225 |           },
2025-10-27 20:41:27.225 |           {
2025-10-27 20:41:27.225 |             phone: {
2025-10-27 20:41:27.225 |               contains: "fotboll",
2025-10-27 20:41:27.225 |               mode: "insensitive"
2025-10-27 20:41:27.225 |             }
2025-10-27 20:41:27.225 |           },
2025-10-27 20:41:27.225 |           {
2025-10-27 20:41:27.225 |             homepageUrl: {
2025-10-27 20:41:27.225 |               contains: "fotboll",
2025-10-27 20:41:27.225 |               mode: "insensitive"
2025-10-27 20:41:27.225 |             }
2025-10-27 20:41:27.225 |           },
2025-10-27 20:41:27.225 |           {
2025-10-27 20:41:27.225 |             descriptionFreeText: {
2025-10-27 20:41:27.225 |               contains: "fotboll",
2025-10-27 20:41:27.225 |               mode: "insensitive"
2025-10-27 20:41:27.225 |             }
2025-10-27 20:41:27.225 |           },
2025-10-27 20:41:27.225 |           {
2025-10-27 20:41:27.225 |             sourceSystem: {
2025-10-27 20:41:27.225 |               contains: "fotboll",
2025-10-27 20:41:27.225 |               mode: "insensitive"
2025-10-27 20:41:27.225 |             }
2025-10-27 20:41:27.225 |           },
2025-10-27 20:41:27.225 |           {
2025-10-27 20:41:27.225 |             tags: {
2025-10-27 20:41:27.225 |               some: {
2025-10-27 20:41:27.225 |                 name: {
2025-10-27 20:41:27.225 |                   contains: "fotboll",
2025-10-27 20:41:27.225 |                   mode: "insensitive"
2025-10-27 20:41:27.225 |                 }
2025-10-27 20:41:27.225 |               }
2025-10-27 20:41:27.225 |             }
2025-10-27 20:41:27.225 |           },
2025-10-27 20:41:27.225 |           {
2025-10-27 20:41:27.225 |             contacts: {
2025-10-27 20:41:27.225 |               some: {
2025-10-27 20:41:27.225 |                 OR: [
2025-10-27 20:41:27.225 |                   {
2025-10-27 20:41:27.225 |                     name: {
2025-10-27 20:41:27.225 |                       contains: "fotboll",
2025-10-27 20:41:27.225 |                       mode: "insensitive"
2025-10-27 20:41:27.225 |                     }
2025-10-27 20:41:27.225 |                   },
2025-10-27 20:41:27.225 |                   {
2025-10-27 20:41:27.225 |                     role: {
2025-10-27 20:41:27.225 |                       contains: "fotboll",
2025-10-27 20:41:27.225 |                       mode: "insensitive"
2025-10-27 20:41:27.225 |                     }
2025-10-27 20:41:27.225 |                   },
2025-10-27 20:41:27.225 |                   {
2025-10-27 20:41:27.225 |                     email: {
2025-10-27 20:41:27.225 |                       contains: "fotboll",
2025-10-27 20:41:27.225 |                       mode: "insensitive"
2025-10-27 20:41:27.225 |                     }
2025-10-27 20:41:27.225 |                   },
2025-10-27 20:41:27.225 |                   {
2025-10-27 20:41:27.225 |                     phone: {
2025-10-27 20:41:27.225 |                       contains: "fotboll",
2025-10-27 20:41:27.225 |                       mode: "insensitive"
2025-10-27 20:41:27.225 |                     }
2025-10-27 20:41:27.225 |                   },
2025-10-27 20:41:27.225 |                   {
2025-10-27 20:41:27.225 |                     mobile: {
2025-10-27 20:41:27.225 |                       contains: "fotboll",
2025-10-27 20:41:27.225 |                       mode: "insensitive"
2025-10-27 20:41:27.225 |                     }
2025-10-27 20:41:27.225 |                   }
2025-10-27 20:41:27.225 |                 ]
2025-10-27 20:41:27.225 |               }
2025-10-27 20:41:27.225 |             }
2025-10-27 20:41:27.225 |           }
2025-10-27 20:41:27.225 |         ]
2025-10-27 20:41:27.225 |       }
2025-10-27 20:41:27.225 |     ]
2025-10-27 20:41:27.225 |   },
2025-10-27 20:41:27.225 |   skip: 0,
2025-10-27 20:41:27.225 |   take: 10,
2025-10-27 20:41:27.225 |   include: {
2025-10-27 20:41:27.225 |     contacts: {
2025-10-27 20:41:27.225 |       where: {
2025-10-27 20:41:27.225 |         isPrimary: true
2025-10-27 20:41:27.225 |       },
2025-10-27 20:41:27.225 |       take: 1
2025-10-27 20:41:27.225 |     },
2025-10-27 20:41:27.225 |     tags: true,
2025-10-27 20:41:27.225 |     _count: {
2025-10-27 20:41:27.225 |       select: {
2025-10-27 20:41:27.225 |         contacts: true,
2025-10-27 20:41:27.225 |         notes: true
2025-10-27 20:41:27.225 |       }
2025-10-27 20:41:27.225 |     },
2025-10-27 20:41:27.225 |     assignedTo: true,
2025-10-27 20:41:27.225 |     activityLog: {
2025-10-27 20:41:27.225 |       orderBy: {
2025-10-27 20:41:27.225 |         createdAt: "desc"
2025-10-27 20:41:27.225 |       },
2025-10-27 20:41:27.225 |       take: 1
2025-10-27 20:41:27.225 |     }
2025-10-27 20:41:27.225 |   },
2025-10-27 20:41:27.225 |   orderBy: {
2025-10-27 20:41:27.225 |     updatedAt: "desc"
2025-10-27 20:41:27.225 |   }
2025-10-27 20:41:27.225 | }
2025-10-27 20:41:27.225 | 
2025-10-27 20:41:27.225 | Unknown argument `mode`. Did you mean `lte`? Available options are marked with ?.
2025-10-27 20:41:29.374 | prisma:error 
2025-10-27 20:41:29.374 | Invalid `prisma.association.findMany()` invocation:
2025-10-27 20:41:29.374 | 
2025-10-27 20:41:29.374 | {
2025-10-27 20:41:29.374 |   where: {
2025-10-27 20:41:29.374 |     AND: [
2025-10-27 20:41:29.374 |       {
2025-10-27 20:41:29.374 |         OR: [
2025-10-27 20:41:29.374 |           {
2025-10-27 20:41:29.374 |             name: {
2025-10-27 20:41:29.374 |               contains: "fotboll",
2025-10-27 20:41:29.374 |               mode: "insensitive"
2025-10-27 20:41:29.374 |             }
2025-10-27 20:41:29.374 |           },
2025-10-27 20:41:29.374 |           {
2025-10-27 20:41:29.374 |             orgNumber: {
2025-10-27 20:41:29.374 |               contains: "fotboll",
2025-10-27 20:41:29.374 |               mode: "insensitive"
2025-10-27 20:41:29.374 |             }
2025-10-27 20:41:29.374 |           },
2025-10-27 20:41:29.374 |           {
2025-10-27 20:41:29.374 |             streetAddress: {
2025-10-27 20:41:29.374 |               contains: "fotboll",
2025-10-27 20:41:29.374 |               mode: "insensitive"
2025-10-27 20:41:29.374 |             }
2025-10-27 20:41:29.374 |           },
2025-10-27 20:41:29.374 |           {
2025-10-27 20:41:29.374 |             city: {
2025-10-27 20:41:29.374 |               contains: "fotboll",
2025-10-27 20:41:29.374 |               mode: "insensitive"
2025-10-27 20:41:29.374 |             }
2025-10-27 20:41:29.374 |           },
2025-10-27 20:41:29.374 |           {
2025-10-27 20:41:29.374 |             municipality: {
2025-10-27 20:41:29.374 |               contains: "fotboll",
2025-10-27 20:41:29.374 |               mode: "insensitive"
2025-10-27 20:41:29.374 |             }
2025-10-27 20:41:29.374 |           },
2025-10-27 20:41:29.374 |           {
2025-10-27 20:41:29.374 |             email: {
2025-10-27 20:41:29.374 |               contains: "fotboll",
2025-10-27 20:41:29.374 |               mode: "insensitive"
2025-10-27 20:41:29.374 |             }
2025-10-27 20:41:29.374 |           },
2025-10-27 20:41:29.374 |           {
2025-10-27 20:41:29.374 |             phone: {
2025-10-27 20:41:29.374 |               contains: "fotboll",
2025-10-27 20:41:29.374 |               mode: "insensitive"
2025-10-27 20:41:29.374 |             }
2025-10-27 20:41:29.374 |           },
2025-10-27 20:41:29.374 |           {
2025-10-27 20:41:29.374 |             homepageUrl: {
2025-10-27 20:41:29.374 |               contains: "fotboll",
2025-10-27 20:41:29.374 |               mode: "insensitive"
2025-10-27 20:41:29.374 |             }
2025-10-27 20:41:29.374 |           },
2025-10-27 20:41:29.374 |           {
2025-10-27 20:41:29.374 |             descriptionFreeText: {
2025-10-27 20:41:29.374 |               contains: "fotboll",
2025-10-27 20:41:29.374 |               mode: "insensitive"
2025-10-27 20:41:29.374 |             }
2025-10-27 20:41:29.374 |           },
2025-10-27 20:41:29.374 |           {
2025-10-27 20:41:29.374 |             sourceSystem: {
2025-10-27 20:41:29.374 |               contains: "fotboll",
2025-10-27 20:41:29.374 |               mode: "insensitive"
2025-10-27 20:41:29.374 |             }
2025-10-27 20:41:29.374 |           },
2025-10-27 20:41:29.374 |           {
2025-10-27 20:41:29.374 |             tags: {
2025-10-27 20:41:29.374 |               some: {
2025-10-27 20:41:29.374 |                 name: {
2025-10-27 20:41:29.374 |                   contains: "fotboll",
2025-10-27 20:41:29.374 |                   mode: "insensitive"
2025-10-27 20:41:29.374 |                 }
2025-10-27 20:41:29.374 |               }
2025-10-27 20:41:29.374 |             }
2025-10-27 20:41:29.374 |           },
2025-10-27 20:41:29.374 |           {
2025-10-27 20:41:29.374 |             contacts: {
2025-10-27 20:41:29.374 |               some: {
2025-10-27 20:41:29.374 |                 OR: [
2025-10-27 20:41:29.374 |                   {
2025-10-27 20:41:29.374 |                     name: {
2025-10-27 20:41:29.374 |                       contains: "fotboll",
2025-10-27 20:41:29.374 |                       mode: "insensitive"
2025-10-27 20:41:29.374 |                     }
2025-10-27 20:41:29.374 |                   },
2025-10-27 20:41:29.374 |                   {
2025-10-27 20:41:29.374 |                     role: {
2025-10-27 20:41:29.374 |                       contains: "fotboll",
2025-10-27 20:41:29.374 |                       mode: "insensitive"
2025-10-27 20:41:29.374 |                     }
2025-10-27 20:41:29.374 |                   },
2025-10-27 20:41:29.374 |                   {
2025-10-27 20:41:29.374 |                     email: {
2025-10-27 20:41:29.374 |                       contains: "fotboll",
2025-10-27 20:41:29.375 |                       mode: "insensitive"
2025-10-27 20:41:29.375 |                     }
2025-10-27 20:41:29.375 |                   },
2025-10-27 20:41:29.375 |                   {
2025-10-27 20:41:29.375 |                     phone: {
2025-10-27 20:41:29.375 |                       contains: "fotboll",
2025-10-27 20:41:29.375 |                       mode: "insensitive"
2025-10-27 20:41:29.375 |                     }
2025-10-27 20:41:29.375 |                   },
2025-10-27 20:41:29.375 |                   {
2025-10-27 20:41:29.375 |                     mobile: {
2025-10-27 20:41:29.375 |                       contains: "fotboll",
2025-10-27 20:41:29.375 |                       mode: "insensitive"
2025-10-27 20:41:29.375 |                     }
2025-10-27 20:41:29.375 |                   }
2025-10-27 20:41:29.375 |                 ]
2025-10-27 20:41:29.375 |               }
2025-10-27 20:41:29.375 |             }
2025-10-27 20:41:29.375 |           }
2025-10-27 20:41:29.375 |         ]
2025-10-27 20:41:29.375 |       }
2025-10-27 20:41:29.375 |     ]
2025-10-27 20:41:29.375 |   },
2025-10-27 20:41:29.375 |   skip: 0,
2025-10-27 20:41:29.375 |   take: 10,
2025-10-27 20:41:29.375 |   include: {
2025-10-27 20:41:29.375 |     contacts: {
2025-10-27 20:41:29.375 |       where: {
2025-10-27 20:41:29.375 |         isPrimary: true
2025-10-27 20:41:29.375 |       },
2025-10-27 20:41:29.375 |       take: 1
2025-10-27 20:41:29.375 |     },
2025-10-27 20:41:29.375 |     tags: true,
2025-10-27 20:41:29.375 |     _count: {
2025-10-27 20:41:29.375 |       select: {
2025-10-27 20:41:29.375 |         contacts: true,
2025-10-27 20:41:29.375 |         notes: true
2025-10-27 20:41:29.375 |       }
2025-10-27 20:41:29.375 |     },
2025-10-27 20:41:29.375 |     assignedTo: true,
2025-10-27 20:41:29.375 |     activityLog: {
2025-10-27 20:41:29.375 |       orderBy: {
2025-10-27 20:41:29.375 |         createdAt: "desc"
2025-10-27 20:41:29.375 |       },
2025-10-27 20:41:29.375 |       take: 1
2025-10-27 20:41:29.375 |     }
2025-10-27 20:41:29.375 |   },
2025-10-27 20:41:29.375 |   orderBy: {
2025-10-27 20:41:29.375 |     updatedAt: "desc"
2025-10-27 20:41:29.375 |   }
2025-10-27 20:41:29.375 | }
2025-10-27 20:41:29.375 | 
2025-10-27 20:41:29.375 | Unknown argument `mode`. Did you mean `lte`? Available options are marked with ?.
2025-10-27 20:41:29.377 |  GET /api/trpc/association.list?batch=1&input=%7B%220%22%3A%7B%22json%22%3A%7B%22page%22%3A1%2C%22limit%22%3A10%2C%22search%22%3A%22fotboll%22%2C%22crmStatuses%22%3Anull%2C%22pipelines%22%3Anull%2C%22types%22%3Anull%2C%22activities%22%3Anull%2C%22tags%22%3Anull%2C%22hasEmail%22%3Anull%2C%22hasPhone%22%3Anull%2C%22isMember%22%3Anull%2C%22assignedToId%22%3Anull%2C%22municipality%22%3Anull%2C%22municipalityId%22%3Anull%2C%22dateRange%22%3Anull%2C%22lastActivityDays%22%3Anull%2C%22sortBy%22%3A%22updatedAt%22%2C%22sortDirection%22%3A%22desc%22%2C%22useSearchIndex%22%3Afalse%7D%2C%22meta%22%3A%7B%22values%22%3A%7B%22crmStatuses%22%3A%5B%22undefined%22%5D%2C%22pipelines%22%3A%5B%22undefined%22%5D%2C%22types%22%3A%5B%22undefined%22%5D%2C%22activities%22%3A%5B%22undefined%22%5D%2C%22tags%22%3A%5B%22undefined%22%5D%2C%22hasEmail%22%3A%5B%22undefined%22%5D%2C%22hasPhone%22%3A%5B%22undefined%22%5D%2C%22isMember%22%3A%5B%22undefined%22%5D%2C%22assignedToId%22%3A%5B%22undefined%22%5D%2C%22municipality%22%3A%5B%22undefined%22%5D%2C%22municipalityId%22%3A%5B%22undefined%22%5D%2C%22dateRange%22%3A%5B%22undefined%22%5D%2C%22lastActivityDays%22%3A%5B%22undefined%22%5D%7D%2C%22v%22%3A1%7D%7D%7D 500 in 86ms
2025-10-27 20:41:29.380 | prisma:error 
2025-10-27 20:41:29.380 | Invalid `prisma.association.count()` invocation:
2025-10-27 20:41:29.380 | 
2025-10-27 20:41:29.380 | {
2025-10-27 20:41:29.380 |   select: {
2025-10-27 20:41:29.380 |     _count: {
2025-10-27 20:41:29.380 |       select: {
2025-10-27 20:41:29.380 |         _all: true
2025-10-27 20:41:29.380 |       }
2025-10-27 20:41:29.380 |     }
2025-10-27 20:41:29.380 |   },
2025-10-27 20:41:29.380 |   where: {
2025-10-27 20:41:29.380 |     AND: [
2025-10-27 20:41:29.380 |       {
2025-10-27 20:41:29.380 |         OR: [
2025-10-27 20:41:29.380 |           {
2025-10-27 20:41:29.380 |             name: {
2025-10-27 20:41:29.380 |               contains: "fotboll",
2025-10-27 20:41:29.380 |               mode: "insensitive"
2025-10-27 20:41:29.380 |             }
2025-10-27 20:41:29.380 |           },
2025-10-27 20:41:29.380 |           {
2025-10-27 20:41:29.380 |             orgNumber: {
2025-10-27 20:41:29.380 |               contains: "fotboll",
2025-10-27 20:41:29.380 |               mode: "insensitive"
2025-10-27 20:41:29.380 |             }
2025-10-27 20:41:29.380 |           },
2025-10-27 20:41:29.380 |           {
2025-10-27 20:41:29.380 |             streetAddress: {
2025-10-27 20:41:29.380 |               contains: "fotboll",
2025-10-27 20:41:29.380 |               mode: "insensitive"
2025-10-27 20:41:29.380 |             }
2025-10-27 20:41:29.380 |           },
2025-10-27 20:41:29.380 |           {
2025-10-27 20:41:29.380 |             city: {
2025-10-27 20:41:29.380 |               contains: "fotboll",
2025-10-27 20:41:29.380 |               mode: "insensitive"
2025-10-27 20:41:29.380 |             }
2025-10-27 20:41:29.380 |           },
2025-10-27 20:41:29.380 |           {
2025-10-27 20:41:29.380 |             municipality: {
2025-10-27 20:41:29.380 |               contains: "fotboll",
2025-10-27 20:41:29.380 |               mode: "insensitive"
2025-10-27 20:41:29.380 |             }
2025-10-27 20:41:29.380 |           },
2025-10-27 20:41:29.380 |           {
2025-10-27 20:41:29.380 |             email: {
2025-10-27 20:41:29.380 |               contains: "fotboll",
2025-10-27 20:41:29.380 |               mode: "insensitive"
2025-10-27 20:41:29.380 |             }
2025-10-27 20:41:29.380 |           },
2025-10-27 20:41:29.380 |           {
2025-10-27 20:41:29.380 |             phone: {
2025-10-27 20:41:29.380 |               contains: "fotboll",
2025-10-27 20:41:29.380 |               mode: "insensitive"
2025-10-27 20:41:29.380 |             }
2025-10-27 20:41:29.380 |           },
2025-10-27 20:41:29.380 |           {
2025-10-27 20:41:29.380 |             homepageUrl: {
2025-10-27 20:41:29.380 |               contains: "fotboll",
2025-10-27 20:41:29.380 |               mode: "insensitive"
2025-10-27 20:41:29.380 |             }
2025-10-27 20:41:29.380 |           },
2025-10-27 20:41:29.380 |           {
2025-10-27 20:41:29.380 |             descriptionFreeText: {
2025-10-27 20:41:29.380 |               contains: "fotboll",
2025-10-27 20:41:29.380 |               mode: "insensitive"
2025-10-27 20:41:29.380 |             }
2025-10-27 20:41:29.380 |           },
2025-10-27 20:41:29.380 |           {
2025-10-27 20:41:29.380 |             sourceSystem: {
2025-10-27 20:41:29.380 |               contains: "fotboll",
2025-10-27 20:41:29.380 |               mode: "insensitive"
2025-10-27 20:41:29.380 |             }
2025-10-27 20:41:29.380 |           },
2025-10-27 20:41:29.380 |           {
2025-10-27 20:41:29.380 |             tags: {
2025-10-27 20:41:29.380 |               some: {
2025-10-27 20:41:29.380 |                 name: {
2025-10-27 20:41:29.380 |                   contains: "fotboll",
2025-10-27 20:41:29.380 |                   mode: "insensitive"
2025-10-27 20:41:29.380 |                 }
2025-10-27 20:41:29.380 |               }
2025-10-27 20:41:29.380 |             }
2025-10-27 20:41:29.380 |           },
2025-10-27 20:41:29.380 |           {
2025-10-27 20:41:29.380 |             contacts: {
2025-10-27 20:41:29.380 |               some: {
2025-10-27 20:41:29.380 |                 OR: [
2025-10-27 20:41:29.380 |                   {
2025-10-27 20:41:29.380 |                     name: {
2025-10-27 20:41:29.380 |                       contains: "fotboll",
2025-10-27 20:41:29.380 |                       mode: "insensitive"
2025-10-27 20:41:29.380 |                     }
2025-10-27 20:41:29.380 |                   },
2025-10-27 20:41:29.380 |                   {
2025-10-27 20:41:29.380 |                     role: {
2025-10-27 20:41:29.380 |                       contains: "fotboll",
2025-10-27 20:41:29.380 |                       mode: "insensitive"
2025-10-27 20:41:29.380 |                     }
2025-10-27 20:41:29.380 |                   },
2025-10-27 20:41:29.380 |                   {
2025-10-27 20:41:29.380 |                     email: {
2025-10-27 20:41:29.380 |                       contains: "fotboll",
2025-10-27 20:41:29.380 |                       mode: "insensitive"
2025-10-27 20:41:29.380 |                     }
2025-10-27 20:41:29.380 |                   },
2025-10-27 20:41:29.380 |                   {
2025-10-27 20:41:29.380 |                     phone: {
2025-10-27 20:41:29.380 |                       contains: "fotboll",
2025-10-27 20:41:29.380 |                       mode: "insensitive"
2025-10-27 20:41:29.380 |                     }
2025-10-27 20:41:29.380 |                   },
2025-10-27 20:41:29.380 |                   {
2025-10-27 20:41:29.380 |                     mobile: {
2025-10-27 20:41:29.380 |                       contains: "fotboll",
2025-10-27 20:41:29.380 |                       mode: "insensitive"
2025-10-27 20:41:29.380 |                     }
2025-10-27 20:41:29.380 |                   }
2025-10-27 20:41:29.380 |                 ]
2025-10-27 20:41:29.380 |               }
2025-10-27 20:41:29.380 |             }
2025-10-27 20:41:29.380 |           }
2025-10-27 20:41:29.380 |         ]
2025-10-27 20:41:29.380 |       }
2025-10-27 20:41:29.380 |     ]
2025-10-27 20:41:29.380 |   }
2025-10-27 20:41:29.380 | }
2025-10-27 20:41:29.380 | 
2025-10-27 20:41:29.380 | Unknown argument `mode`. Did you mean `lte`? Available options are marked with ?.
2025-10-27 20:41:33.531 | prisma:error 
2025-10-27 20:41:33.531 | Invalid `prisma.association.count()` invocation:
2025-10-27 20:41:33.531 | 
2025-10-27 20:41:33.531 | {
2025-10-27 20:41:33.531 |   select: {
2025-10-27 20:41:33.531 |     _count: {
2025-10-27 20:41:33.531 |       select: {
2025-10-27 20:41:33.531 |         _all: true
2025-10-27 20:41:33.531 |       }
2025-10-27 20:41:33.531 |     }
2025-10-27 20:41:33.531 |   },
2025-10-27 20:41:33.531 |   where: {
2025-10-27 20:41:33.531 |     AND: [
2025-10-27 20:41:33.531 |       {
2025-10-27 20:41:33.531 |         OR: [
2025-10-27 20:41:33.531 |           {
2025-10-27 20:41:33.531 |             name: {
2025-10-27 20:41:33.531 |               contains: "fotboll",
2025-10-27 20:41:33.531 |               mode: "insensitive"
2025-10-27 20:41:33.531 |             }
2025-10-27 20:41:33.531 |           },
2025-10-27 20:41:33.531 |           {
2025-10-27 20:41:33.531 |             orgNumber: {
2025-10-27 20:41:33.531 |               contains: "fotboll",
2025-10-27 20:41:33.531 |               mode: "insensitive"
2025-10-27 20:41:33.531 |             }
2025-10-27 20:41:33.531 |           },
2025-10-27 20:41:33.531 |           {
2025-10-27 20:41:33.531 |             streetAddress: {
2025-10-27 20:41:33.531 |               contains: "fotboll",
2025-10-27 20:41:33.531 |               mode: "insensitive"
2025-10-27 20:41:33.531 |             }
2025-10-27 20:41:33.531 |           },
2025-10-27 20:41:33.531 |           {
2025-10-27 20:41:33.531 |             city: {
2025-10-27 20:41:33.531 |               contains: "fotboll",
2025-10-27 20:41:33.531 |               mode: "insensitive"
2025-10-27 20:41:33.531 |             }
2025-10-27 20:41:33.531 |           },
2025-10-27 20:41:33.531 |           {
2025-10-27 20:41:33.531 |             municipality: {
2025-10-27 20:41:33.531 |               contains: "fotboll",
2025-10-27 20:41:33.531 |               mode: "insensitive"
2025-10-27 20:41:33.531 |             }
2025-10-27 20:41:33.531 |           },
2025-10-27 20:41:33.531 |           {
2025-10-27 20:41:33.531 |             email: {
2025-10-27 20:41:33.531 |               contains: "fotboll",
2025-10-27 20:41:33.531 |               mode: "insensitive"
2025-10-27 20:41:33.531 |             }
2025-10-27 20:41:33.531 |           },
2025-10-27 20:41:33.531 |           {
2025-10-27 20:41:33.531 |             phone: {
2025-10-27 20:41:33.531 |               contains: "fotboll",
2025-10-27 20:41:33.531 |               mode: "insensitive"
2025-10-27 20:41:33.531 |             }
2025-10-27 20:41:33.531 |           },
2025-10-27 20:41:33.531 |           {
2025-10-27 20:41:33.531 |             homepageUrl: {
2025-10-27 20:41:33.531 |               contains: "fotboll",
2025-10-27 20:41:33.531 |               mode: "insensitive"
2025-10-27 20:41:33.531 |             }
2025-10-27 20:41:33.531 |           },
2025-10-27 20:41:33.531 |           {
2025-10-27 20:41:33.531 |             descriptionFreeText: {
2025-10-27 20:41:33.531 |               contains: "fotboll",
2025-10-27 20:41:33.531 |               mode: "insensitive"
2025-10-27 20:41:33.531 |             }
2025-10-27 20:41:33.531 |           },
2025-10-27 20:41:33.531 |           {
2025-10-27 20:41:33.531 |             sourceSystem: {
2025-10-27 20:41:33.531 |               contains: "fotboll",
2025-10-27 20:41:33.531 |               mode: "insensitive"
2025-10-27 20:41:33.531 |             }
2025-10-27 20:41:33.531 |           },
2025-10-27 20:41:33.531 |           {
2025-10-27 20:41:33.531 |             tags: {
2025-10-27 20:41:33.531 |               some: {
2025-10-27 20:41:33.531 |                 name: {
2025-10-27 20:41:33.531 |                   contains: "fotboll",
2025-10-27 20:41:33.531 |                   mode: "insensitive"
2025-10-27 20:41:33.531 |                 }
2025-10-27 20:41:33.531 |               }
2025-10-27 20:41:33.531 |             }
2025-10-27 20:41:33.531 |           },
2025-10-27 20:41:33.531 |           {
2025-10-27 20:41:33.531 |             contacts: {
2025-10-27 20:41:33.531 |               some: {
2025-10-27 20:41:33.531 |                 OR: [
2025-10-27 20:41:33.531 |                   {
2025-10-27 20:41:33.531 |                     name: {
2025-10-27 20:41:33.531 |                       contains: "fotboll",
2025-10-27 20:41:33.531 |                       mode: "insensitive"
2025-10-27 20:41:33.531 |                     }
2025-10-27 20:41:33.531 |                   },
2025-10-27 20:41:33.531 |                   {
2025-10-27 20:41:33.531 |                     role: {
2025-10-27 20:41:33.531 |                       contains: "fotboll",
2025-10-27 20:41:33.531 |                       mode: "insensitive"
2025-10-27 20:41:33.531 |                     }
2025-10-27 20:41:33.531 |                   },
2025-10-27 20:41:33.531 |                   {
2025-10-27 20:41:33.531 |                     email: {
2025-10-27 20:41:33.531 |                       contains: "fotboll",
2025-10-27 20:41:33.531 |                       mode: "insensitive"
2025-10-27 20:41:33.531 |                     }
2025-10-27 20:41:33.531 |                   },
2025-10-27 20:41:33.531 |                   {
2025-10-27 20:41:33.531 |                     phone: {
2025-10-27 20:41:33.531 |                       contains: "fotboll",
2025-10-27 20:41:33.531 |                       mode: "insensitive"
2025-10-27 20:41:33.531 |                     }
2025-10-27 20:41:33.531 |                   },
2025-10-27 20:41:33.531 |                   {
2025-10-27 20:41:33.531 |                     mobile: {
2025-10-27 20:41:33.531 |                       contains: "fotboll",
2025-10-27 20:41:33.531 |                       mode: "insensitive"
2025-10-27 20:41:33.531 |                     }
2025-10-27 20:41:33.531 |                   }
2025-10-27 20:41:33.531 |                 ]
2025-10-27 20:41:33.531 |               }
2025-10-27 20:41:33.531 |             }
2025-10-27 20:41:33.531 |           }
2025-10-27 20:41:33.531 |         ]
2025-10-27 20:41:33.531 |       }
2025-10-27 20:41:33.531 |     ]
2025-10-27 20:41:33.531 |   }
2025-10-27 20:41:33.531 | }
2025-10-27 20:41:33.531 | 
2025-10-27 20:41:33.531 | Unknown argument `mode`. Did you mean `lte`? Available options are marked with ?.
2025-10-27 20:41:33.534 |  GET /api/trpc/association.list?batch=1&input=%7B%220%22%3A%7B%22json%22%3A%7B%22page%22%3A1%2C%22limit%22%3A10%2C%22search%22%3A%22fotboll%22%2C%22crmStatuses%22%3Anull%2C%22pipelines%22%3Anull%2C%22types%22%3Anull%2C%22activities%22%3Anull%2C%22tags%22%3Anull%2C%22hasEmail%22%3Anull%2C%22hasPhone%22%3Anull%2C%22isMember%22%3Anull%2C%22assignedToId%22%3Anull%2C%22municipality%22%3Anull%2C%22municipalityId%22%3Anull%2C%22dateRange%22%3Anull%2C%22lastActivityDays%22%3Anull%2C%22sortBy%22%3A%22updatedAt%22%2C%22sortDirection%22%3A%22desc%22%2C%22useSearchIndex%22%3Afalse%7D%2C%22meta%22%3A%7B%22values%22%3A%7B%22crmStatuses%22%3A%5B%22undefined%22%5D%2C%22pipelines%22%3A%5B%22undefined%22%5D%2C%22types%22%3A%5B%22undefined%22%5D%2C%22activities%22%3A%5B%22undefined%22%5D%2C%22tags%22%3A%5B%22undefined%22%5D%2C%22hasEmail%22%3A%5B%22undefined%22%5D%2C%22hasPhone%22%3A%5B%22undefined%22%5D%2C%22isMember%22%3A%5B%22undefined%22%5D%2C%22assignedToId%22%3A%5B%22undefined%22%5D%2C%22municipality%22%3A%5B%22undefined%22%5D%2C%22municipalityId%22%3A%5B%22undefined%22%5D%2C%22dateRange%22%3A%5B%22undefined%22%5D%2C%22lastActivityDays%22%3A%5B%22undefined%22%5D%7D%2C%22v%22%3A1%7D%7D%7D 500 in 92ms
2025-10-27 20:41:33.537 | prisma:error 
2025-10-27 20:41:33.537 | Invalid `prisma.association.findMany()` invocation:
2025-10-27 20:41:33.537 | 
2025-10-27 20:41:33.537 | {
2025-10-27 20:41:33.537 |   where: {
2025-10-27 20:41:33.537 |     AND: [
2025-10-27 20:41:33.537 |       {
2025-10-27 20:41:33.537 |         OR: [
2025-10-27 20:41:33.537 |           {
2025-10-27 20:41:33.537 |             name: {
2025-10-27 20:41:33.537 |               contains: "fotboll",
2025-10-27 20:41:33.537 |               mode: "insensitive"
2025-10-27 20:41:33.537 |             }
2025-10-27 20:41:33.537 |           },
2025-10-27 20:41:33.537 |           {
2025-10-27 20:41:33.537 |             orgNumber: {
2025-10-27 20:41:33.537 |               contains: "fotboll",
2025-10-27 20:41:33.537 |               mode: "insensitive"
2025-10-27 20:41:33.537 |             }
2025-10-27 20:41:33.537 |           },
2025-10-27 20:41:33.537 |           {
2025-10-27 20:41:33.537 |             streetAddress: {
2025-10-27 20:41:33.537 |               contains: "fotboll",
2025-10-27 20:41:33.537 |               mode: "insensitive"
2025-10-27 20:41:33.537 |             }
2025-10-27 20:41:33.537 |           },
2025-10-27 20:41:33.537 |           {
2025-10-27 20:41:33.537 |             city: {
2025-10-27 20:41:33.537 |               contains: "fotboll",
2025-10-27 20:41:33.537 |               mode: "insensitive"
2025-10-27 20:41:33.537 |             }
2025-10-27 20:41:33.537 |           },
2025-10-27 20:41:33.537 |           {
2025-10-27 20:41:33.537 |             municipality: {
2025-10-27 20:41:33.537 |               contains: "fotboll",
2025-10-27 20:41:33.537 |               mode: "insensitive"
2025-10-27 20:41:33.537 |             }
2025-10-27 20:41:33.537 |           },
2025-10-27 20:41:33.537 |           {
2025-10-27 20:41:33.537 |             email: {
2025-10-27 20:41:33.537 |               contains: "fotboll",
2025-10-27 20:41:33.537 |               mode: "insensitive"
2025-10-27 20:41:33.537 |             }
2025-10-27 20:41:33.537 |           },
2025-10-27 20:41:33.537 |           {
2025-10-27 20:41:33.537 |             phone: {
2025-10-27 20:41:33.537 |               contains: "fotboll",
2025-10-27 20:41:33.537 |               mode: "insensitive"
2025-10-27 20:41:33.537 |             }
2025-10-27 20:41:33.537 |           },
2025-10-27 20:41:33.537 |           {
2025-10-27 20:41:33.537 |             homepageUrl: {
2025-10-27 20:41:33.537 |               contains: "fotboll",
2025-10-27 20:41:33.537 |               mode: "insensitive"
2025-10-27 20:41:33.537 |             }
2025-10-27 20:41:33.537 |           },
2025-10-27 20:41:33.537 |           {
2025-10-27 20:41:33.537 |             descriptionFreeText: {
2025-10-27 20:41:33.537 |               contains: "fotboll",
2025-10-27 20:41:33.537 |               mode: "insensitive"
2025-10-27 20:41:33.537 |             }
2025-10-27 20:41:33.537 |           },
2025-10-27 20:41:33.537 |           {
2025-10-27 20:41:33.537 |             sourceSystem: {
2025-10-27 20:41:33.537 |               contains: "fotboll",
2025-10-27 20:41:33.537 |               mode: "insensitive"
2025-10-27 20:41:33.537 |             }
2025-10-27 20:41:33.537 |           },
2025-10-27 20:41:33.537 |           {
2025-10-27 20:41:33.537 |             tags: {
2025-10-27 20:41:33.537 |               some: {
2025-10-27 20:41:33.537 |                 name: {
2025-10-27 20:41:33.537 |                   contains: "fotboll",
2025-10-27 20:41:33.537 |                   mode: "insensitive"
2025-10-27 20:41:33.537 |                 }
2025-10-27 20:41:33.537 |               }
2025-10-27 20:41:33.537 |             }
2025-10-27 20:41:33.537 |           },
2025-10-27 20:41:33.537 |           {
2025-10-27 20:41:33.537 |             contacts: {
2025-10-27 20:41:33.537 |               some: {
2025-10-27 20:41:33.537 |                 OR: [
2025-10-27 20:41:33.537 |                   {
2025-10-27 20:41:33.537 |                     name: {
2025-10-27 20:41:33.537 |                       contains: "fotboll",
2025-10-27 20:41:33.537 |                       mode: "insensitive"
2025-10-27 20:41:33.537 |                     }
2025-10-27 20:41:33.537 |                   },
2025-10-27 20:41:33.537 |                   {
2025-10-27 20:41:33.537 |                     role: {
2025-10-27 20:41:33.537 |                       contains: "fotboll",
2025-10-27 20:41:33.537 |                       mode: "insensitive"
2025-10-27 20:41:33.537 |                     }
2025-10-27 20:41:33.537 |                   },
2025-10-27 20:41:33.537 |                   {
2025-10-27 20:41:33.537 |                     email: {
2025-10-27 20:41:33.537 |                       contains: "fotboll",
2025-10-27 20:41:33.537 |                       mode: "insensitive"
2025-10-27 20:41:33.537 |                     }
2025-10-27 20:41:33.537 |                   },
2025-10-27 20:41:33.537 |                   {
2025-10-27 20:41:33.537 |                     phone: {
2025-10-27 20:41:33.537 |                       contains: "fotboll",
2025-10-27 20:41:33.537 |                       mode: "insensitive"
2025-10-27 20:41:33.537 |                     }
2025-10-27 20:41:33.537 |                   },
2025-10-27 20:41:33.537 |                   {
2025-10-27 20:41:33.537 |                     mobile: {
2025-10-27 20:41:33.537 |                       contains: "fotboll",
2025-10-27 20:41:33.537 |                       mode: "insensitive"
2025-10-27 20:41:33.537 |                     }
2025-10-27 20:41:33.537 |                   }
2025-10-27 20:41:33.537 |                 ]
2025-10-27 20:41:33.537 |               }
2025-10-27 20:41:33.537 |             }
2025-10-27 20:41:33.537 |           }
2025-10-27 20:41:33.537 |         ]
2025-10-27 20:41:33.537 |       }
2025-10-27 20:41:33.537 |     ]
2025-10-27 20:41:33.537 |   },
2025-10-27 20:41:33.537 |   skip: 0,
2025-10-27 20:41:33.537 |   take: 10,
2025-10-27 20:41:33.537 |   include: {
2025-10-27 20:41:33.537 |     contacts: {
2025-10-27 20:41:33.537 |       where: {
2025-10-27 20:41:33.537 |         isPrimary: true
2025-10-27 20:41:33.537 |       },
2025-10-27 20:41:33.537 |       take: 1
2025-10-27 20:41:33.537 |     },
2025-10-27 20:41:33.537 |     tags: true,
2025-10-27 20:41:33.537 |     _count: {
2025-10-27 20:41:33.537 |       select: {
2025-10-27 20:41:33.537 |         contacts: true,
2025-10-27 20:41:33.537 |         notes: true
2025-10-27 20:41:33.537 |       }
2025-10-27 20:41:33.537 |     },
2025-10-27 20:41:33.537 |     assignedTo: true,
2025-10-27 20:41:33.537 |     activityLog: {
2025-10-27 20:41:33.537 |       orderBy: {
2025-10-27 20:41:33.537 |         createdAt: "desc"
2025-10-27 20:41:33.537 |       },
2025-10-27 20:41:33.537 |       take: 1
2025-10-27 20:41:33.537 |     }
2025-10-27 20:41:33.537 |   },
2025-10-27 20:41:33.537 |   orderBy: {
2025-10-27 20:41:33.537 |     updatedAt: "desc"
2025-10-27 20:41:33.537 |   }
2025-10-27 20:41:33.537 | }
2025-10-27 20:41:33.537 | 
2025-10-27 20:41:33.537 | Unknown argument `mode`. Did you mean `lte`? Available options are marked with ?.
2025-10-28 06:46:05.660 |  GET /api/auth/session 200 in 180ms
2025-10-28 06:46:05.797 | prisma:error 
2025-10-28 06:46:05.797 | Invalid `prisma.association.count()` invocation:
2025-10-28 06:46:05.797 | 
2025-10-28 06:46:05.797 | {
2025-10-28 06:46:05.797 |   select: {
2025-10-28 06:46:05.797 |     _count: {
2025-10-28 06:46:05.797 |       select: {
2025-10-28 06:46:05.797 |         _all: true
2025-10-28 06:46:05.797 |       }
2025-10-28 06:46:05.797 |     }
2025-10-28 06:46:05.797 |   },
2025-10-28 06:46:05.797 |   where: {
2025-10-28 06:46:05.797 |     AND: [
2025-10-28 06:46:05.797 |       {
2025-10-28 06:46:05.797 |         OR: [
2025-10-28 06:46:05.797 |           {
2025-10-28 06:46:05.797 |             name: {
2025-10-28 06:46:05.797 |               contains: "fotboll",
2025-10-28 06:46:05.797 |               mode: "insensitive"
2025-10-28 06:46:05.797 |             }
2025-10-28 06:46:05.797 |           },
2025-10-28 06:46:05.797 |           {
2025-10-28 06:46:05.797 |             orgNumber: {
2025-10-28 06:46:05.797 |               contains: "fotboll",
2025-10-28 06:46:05.797 |               mode: "insensitive"
2025-10-28 06:46:05.797 |             }
2025-10-28 06:46:05.797 |           },
2025-10-28 06:46:05.797 |           {
2025-10-28 06:46:05.797 |             streetAddress: {
2025-10-28 06:46:05.797 |               contains: "fotboll",
2025-10-28 06:46:05.797 |               mode: "insensitive"
2025-10-28 06:46:05.797 |             }
2025-10-28 06:46:05.797 |           },
2025-10-28 06:46:05.797 |           {
2025-10-28 06:46:05.797 |             city: {
2025-10-28 06:46:05.797 |               contains: "fotboll",
2025-10-28 06:46:05.797 |               mode: "insensitive"
2025-10-28 06:46:05.797 |             }
2025-10-28 06:46:05.797 |           },
2025-10-28 06:46:05.797 |           {
2025-10-28 06:46:05.797 |             municipality: {
2025-10-28 06:46:05.797 |               contains: "fotboll",
2025-10-28 06:46:05.797 |               mode: "insensitive"
2025-10-28 06:46:05.797 |             }
2025-10-28 06:46:05.797 |           },
2025-10-28 06:46:05.797 |           {
2025-10-28 06:46:05.797 |             email: {
2025-10-28 06:46:05.797 |               contains: "fotboll",
2025-10-28 06:46:05.797 |               mode: "insensitive"
2025-10-28 06:46:05.797 |             }
2025-10-28 06:46:05.797 |           },
2025-10-28 06:46:05.797 |           {
2025-10-28 06:46:05.797 |             phone: {
2025-10-28 06:46:05.797 |               contains: "fotboll",
2025-10-28 06:46:05.797 |               mode: "insensitive"
2025-10-28 06:46:05.797 |             }
2025-10-28 06:46:05.797 |           },
2025-10-28 06:46:05.797 |           {
2025-10-28 06:46:05.797 |             homepageUrl: {
2025-10-28 06:46:05.797 |               contains: "fotboll",
2025-10-28 06:46:05.797 |               mode: "insensitive"
2025-10-28 06:46:05.797 |             }
2025-10-28 06:46:05.797 |           },
2025-10-28 06:46:05.797 |           {
2025-10-28 06:46:05.797 |             descriptionFreeText: {
2025-10-28 06:46:05.797 |               contains: "fotboll",
2025-10-28 06:46:05.797 |               mode: "insensitive"
2025-10-28 06:46:05.797 |             }
2025-10-28 06:46:05.797 |           },
2025-10-28 06:46:05.797 |           {
2025-10-28 06:46:05.797 |             sourceSystem: {
2025-10-28 06:46:05.797 |               contains: "fotboll",
2025-10-28 06:46:05.797 |               mode: "insensitive"
2025-10-28 06:46:05.797 |             }
2025-10-28 06:46:05.797 |           },
2025-10-28 06:46:05.797 |           {
2025-10-28 06:46:05.797 |             tags: {
2025-10-28 06:46:05.797 |               some: {
2025-10-28 06:46:05.797 |                 name: {
2025-10-28 06:46:05.797 |                   contains: "fotboll",
2025-10-28 06:46:05.797 |                   mode: "insensitive"
2025-10-28 06:46:05.797 |                 }
2025-10-28 06:46:05.797 |               }
2025-10-28 06:46:05.797 |             }
2025-10-28 06:46:05.797 |           },
2025-10-28 06:46:05.797 |           {
2025-10-28 06:46:05.797 |             contacts: {
2025-10-28 06:46:05.797 |               some: {
2025-10-28 06:46:05.797 |                 OR: [
2025-10-28 06:46:05.797 |                   {
2025-10-28 06:46:05.797 |                     name: {
2025-10-28 06:46:05.797 |                       contains: "fotboll",
2025-10-28 06:46:05.797 |                       mode: "insensitive"
2025-10-28 06:46:05.797 |                     }
2025-10-28 06:46:05.797 |                   },
2025-10-28 06:46:05.797 |                   {
2025-10-28 06:46:05.797 |                     role: {
2025-10-28 06:46:05.797 |                       contains: "fotboll",
2025-10-28 06:46:05.797 |                       mode: "insensitive"
2025-10-28 06:46:05.797 |                     }
2025-10-28 06:46:05.797 |                   },
2025-10-28 06:46:05.797 |                   {
2025-10-28 06:46:05.797 |                     email: {
2025-10-28 06:46:05.797 |                       contains: "fotboll",
2025-10-28 06:46:05.797 |                       mode: "insensitive"
2025-10-28 06:46:05.797 |                     }
2025-10-28 06:46:05.797 |                   },
2025-10-28 06:46:05.797 |                   {
2025-10-28 06:46:05.797 |                     phone: {
2025-10-28 06:46:05.797 |                       contains: "fotboll",
2025-10-28 06:46:05.797 |                       mode: "insensitive"
2025-10-28 06:46:05.797 |                     }
2025-10-28 06:46:05.797 |                   },
2025-10-28 06:46:05.797 |                   {
2025-10-28 06:46:05.797 |                     mobile: {
2025-10-28 06:46:05.797 |                       contains: "fotboll",
2025-10-28 06:46:05.797 |                       mode: "insensitive"
2025-10-28 06:46:05.797 |                     }
2025-10-28 06:46:05.797 |                   }
2025-10-28 06:46:05.797 |                 ]
2025-10-28 06:46:05.797 |               }
2025-10-28 06:46:05.797 |             }
2025-10-28 06:46:05.797 |           }
2025-10-28 06:46:05.797 |         ]
2025-10-28 06:46:05.797 |       }
2025-10-28 06:46:05.797 |     ]
2025-10-28 06:46:05.797 |   }
2025-10-28 06:46:05.797 | }
2025-10-28 06:46:05.797 | 
2025-10-28 06:46:05.797 | Unknown argument `mode`. Did you mean `lte`? Available options are marked with ?.
2025-10-28 06:46:05.800 | prisma:error 
2025-10-28 06:46:05.801 | Invalid `prisma.association.findMany()` invocation:
2025-10-28 06:46:05.801 | 
2025-10-28 06:46:05.801 | {
2025-10-28 06:46:05.801 |   where: {
2025-10-28 06:46:05.801 |     AND: [
2025-10-28 06:46:05.801 |       {
2025-10-28 06:46:05.801 |         OR: [
2025-10-28 06:46:05.801 |           {
2025-10-28 06:46:05.801 |             name: {
2025-10-28 06:46:05.801 |               contains: "fotboll",
2025-10-28 06:46:05.801 |               mode: "insensitive"
2025-10-28 06:46:05.801 |             }
2025-10-28 06:46:05.801 |           },
2025-10-28 06:46:05.801 |           {
2025-10-28 06:46:05.801 |             orgNumber: {
2025-10-28 06:46:05.801 |               contains: "fotboll",
2025-10-28 06:46:05.801 |               mode: "insensitive"
2025-10-28 06:46:05.801 |             }
2025-10-28 06:46:05.801 |           },
2025-10-28 06:46:05.801 |           {
2025-10-28 06:46:05.801 |             streetAddress: {
2025-10-28 06:46:05.801 |               contains: "fotboll",
2025-10-28 06:46:05.801 |               mode: "insensitive"
2025-10-28 06:46:05.801 |             }
2025-10-28 06:46:05.801 |           },
2025-10-28 06:46:05.801 |           {
2025-10-28 06:46:05.801 |             city: {
2025-10-28 06:46:05.801 |               contains: "fotboll",
2025-10-28 06:46:05.801 |               mode: "insensitive"
2025-10-28 06:46:05.801 |             }
2025-10-28 06:46:05.801 |           },
2025-10-28 06:46:05.801 |           {
2025-10-28 06:46:05.801 |             municipality: {
2025-10-28 06:46:05.801 |               contains: "fotboll",
2025-10-28 06:46:05.801 |               mode: "insensitive"
2025-10-28 06:46:05.801 |             }
2025-10-28 06:46:05.801 |           },
2025-10-28 06:46:05.801 |           {
2025-10-28 06:46:05.801 |             email: {
2025-10-28 06:46:05.801 |               contains: "fotboll",
2025-10-28 06:46:05.801 |               mode: "insensitive"
2025-10-28 06:46:05.801 |             }
2025-10-28 06:46:05.801 |           },
2025-10-28 06:46:05.801 |           {
2025-10-28 06:46:05.801 |             phone: {
2025-10-28 06:46:05.801 |               contains: "fotboll",
2025-10-28 06:46:05.801 |               mode: "insensitive"
2025-10-28 06:46:05.801 |             }
2025-10-28 06:46:05.801 |           },
2025-10-28 06:46:05.801 |           {
2025-10-28 06:46:05.801 |             homepageUrl: {
2025-10-28 06:46:05.801 |               contains: "fotboll",
2025-10-28 06:46:05.801 |               mode: "insensitive"
2025-10-28 06:46:05.801 |             }
2025-10-28 06:46:05.801 |           },
2025-10-28 06:46:05.801 |           {
2025-10-28 06:46:05.801 |             descriptionFreeText: {
2025-10-28 06:46:05.801 |               contains: "fotboll",
2025-10-28 06:46:05.801 |               mode: "insensitive"
2025-10-28 06:46:05.801 |             }
2025-10-28 06:46:05.801 |           },
2025-10-28 06:46:05.801 |           {
2025-10-28 06:46:05.801 |             sourceSystem: {
2025-10-28 06:46:05.801 |               contains: "fotboll",
2025-10-28 06:46:05.801 |               mode: "insensitive"
2025-10-28 06:46:05.801 |             }
2025-10-28 06:46:05.801 |           },
2025-10-28 06:46:05.801 |           {
2025-10-28 06:46:05.801 |             tags: {
2025-10-28 06:46:05.801 |               some: {
2025-10-28 06:46:05.801 |                 name: {
2025-10-28 06:46:05.801 |                   contains: "fotboll",
2025-10-28 06:46:05.801 |                   mode: "insensitive"
2025-10-28 06:46:05.801 |                 }
2025-10-28 06:46:05.801 |               }
2025-10-28 06:46:05.801 |             }
2025-10-28 06:46:05.801 |           },
2025-10-28 06:46:05.801 |           {
2025-10-28 06:46:05.801 |             contacts: {
2025-10-28 06:46:05.801 |               some: {
2025-10-28 06:46:05.801 |                 OR: [
2025-10-28 06:46:05.801 |                   {
2025-10-28 06:46:05.801 |                     name: {
2025-10-28 06:46:05.801 |                       contains: "fotboll",
2025-10-28 06:46:05.801 |                       mode: "insensitive"
2025-10-28 06:46:05.801 |                     }
2025-10-28 06:46:05.801 |                   },
2025-10-28 06:46:05.801 |                   {
2025-10-28 06:46:05.801 |                     role: {
2025-10-28 06:46:05.801 |                       contains: "fotboll",
2025-10-28 06:46:05.801 |                       mode: "insensitive"
2025-10-28 06:46:05.801 |                     }
2025-10-28 06:46:05.801 |                   },
2025-10-28 06:46:05.801 |                   {
2025-10-28 06:46:05.801 |                     email: {
2025-10-28 06:46:05.801 |                       contains: "fotboll",
2025-10-28 06:46:05.801 |                       mode: "insensitive"
2025-10-28 06:46:05.801 |                     }
2025-10-28 06:46:05.801 |                   },
2025-10-28 06:46:05.801 |                   {
2025-10-28 06:46:05.801 |                     phone: {
2025-10-28 06:46:05.801 |                       contains: "fotboll",
2025-10-28 06:46:05.801 |                       mode: "insensitive"
2025-10-28 06:46:05.801 |                     }
2025-10-28 06:46:05.801 |                   },
2025-10-28 06:46:05.801 |                   {
2025-10-28 06:46:05.801 |                     mobile: {
2025-10-28 06:46:05.801 |                       contains: "fotboll",
2025-10-28 06:46:05.801 |                       mode: "insensitive"
2025-10-28 06:46:05.801 |                     }
2025-10-28 06:46:05.801 |                   }
2025-10-28 06:46:05.801 |                 ]
2025-10-28 06:46:05.801 |               }
2025-10-28 06:46:05.801 |             }
2025-10-28 06:46:05.801 |           }
2025-10-28 06:46:05.801 |         ]
2025-10-28 06:46:05.801 |       }
2025-10-28 06:46:05.801 |     ]
2025-10-28 06:46:05.801 |   },
2025-10-28 06:46:05.801 |   skip: 0,
2025-10-28 06:46:05.801 |   take: 10,
2025-10-28 06:46:05.801 |   include: {
2025-10-28 06:46:05.801 |     contacts: {
2025-10-28 06:46:05.801 |       where: {
2025-10-28 06:46:05.801 |         isPrimary: true
2025-10-28 06:46:05.801 |       },
2025-10-28 06:46:05.801 |       take: 1
2025-10-28 06:46:05.801 |     },
2025-10-28 06:46:05.801 |     tags: true,
2025-10-28 06:46:05.801 |     _count: {
2025-10-28 06:46:05.801 |       select: {
2025-10-28 06:46:05.801 |         contacts: true,
2025-10-28 06:46:05.801 |         notes: true
2025-10-28 06:46:05.801 |       }
2025-10-28 06:46:05.801 |     },
2025-10-28 06:46:05.801 |     assignedTo: true,
2025-10-28 06:46:05.801 |     activityLog: {
2025-10-28 06:46:05.801 |       orderBy: {
2025-10-28 06:46:05.801 |         createdAt: "desc"
2025-10-28 06:46:05.801 |       },
2025-10-28 06:46:05.801 |       take: 1
2025-10-28 06:46:05.801 |     }
2025-10-28 06:46:05.801 |   },
2025-10-28 06:46:05.801 |   orderBy: {
2025-10-28 06:46:05.801 |     updatedAt: "desc"
2025-10-28 06:46:05.801 |   }
2025-10-28 06:46:05.801 | }
2025-10-28 06:46:05.801 | 
2025-10-28 06:46:05.801 | Unknown argument `mode`. Did you mean `lte`? Available options are marked with ?.
2025-10-28 06:46:05.801 | prisma:query SELECT `crm_db`.`Tag`.`id`, `crm_db`.`Tag`.`name`, `crm_db`.`Tag`.`color`, `crm_db`.`Tag`.`createdAt` FROM `crm_db`.`Tag` WHERE 1=1 ORDER BY `crm_db`.`Tag`.`createdAt` DESC
2025-10-28 06:46:05.889 |  GET /api/trpc/tags.list,municipality.list,users.list,association.list?batch=1&input=%7B%220%22%3A%7B%22json%22%3Anull%2C%22meta%22%3A%7B%22values%22%3A%5B%22undefined%22%5D%2C%22v%22%3A1%7D%7D%2C%221%22%3A%7B%22json%22%3A%7B%22limit%22%3A400%2C%22sortBy%22%3A%22name%22%2C%22sortOrder%22%3A%22asc%22%7D%7D%2C%222%22%3A%7B%22json%22%3A%7B%22page%22%3A1%2C%22limit%22%3A200%7D%7D%2C%223%22%3A%7B%22json%22%3A%7B%22page%22%3A1%2C%22limit%22%3A10%2C%22search%22%3A%22fotboll%22%2C%22crmStatuses%22%3Anull%2C%22pipelines%22%3Anull%2C%22types%22%3Anull%2C%22activities%22%3Anull%2C%22tags%22%3Anull%2C%22hasEmail%22%3Anull%2C%22hasPhone%22%3Anull%2C%22isMember%22%3Anull%2C%22assignedToId%22%3Anull%2C%22municipality%22%3Anull%2C%22municipalityId%22%3Anull%2C%22dateRange%22%3Anull%2C%22lastActivityDays%22%3Anull%2C%22sortBy%22%3A%22updatedAt%22%2C%22sortDirection%22%3A%22desc%22%2C%22useSearchIndex%22%3Afalse%7D%2C%22meta%22%3A%7B%22values%22%3A%7B%22crmStatuses%22%3A%5B%22undefined%22%5D%2C%22pipelines%22%3A%5B%22undefined%22%5D%2C%22types%22%3A%5B%22undefined%22%5D%2C%22activities%22%3A%5B%22undefined%22%5D%2C%22tags%22%3A%5B%22undefined%22%5D%2C%22hasEmail%22%3A%5B%22undefined%22%5D%2C%22hasPhone%22%3A%5B%22undefined%22%5D%2C%22isMember%22%3A%5B%22undefined%22%5D%2C%22assignedToId%22%3A%5B%22undefined%22%5D%2C%22municipality%22%3A%5B%22undefined%22%5D%2C%22municipalityId%22%3A%5B%22undefined%22%5D%2C%22dateRange%22%3A%5B%22undefined%22%5D%2C%22lastActivityDays%22%3A%5B%22undefined%22%5D%7D%2C%22v%22%3A1%7D%7D%7D 207 in 254ms
2025-10-28 06:46:05.913 |  GET /api/auth/session 200 in 159ms
2025-10-28 07:01:29.263 |  GET /api/auth/session 200 in 109ms
2025-10-28 07:01:29.372 | prisma:query SELECT `crm_db`.`Tag`.`id`, `crm_db`.`Tag`.`name`, `crm_db`.`Tag`.`color`, `crm_db`.`Tag`.`createdAt` FROM `crm_db`.`Tag` WHERE 1=1 ORDER BY `crm_db`.`Tag`.`createdAt` DESC
2025-10-28 07:01:29.399 | prisma:error 
2025-10-28 07:01:29.399 | Invalid `prisma.association.findMany()` invocation:
2025-10-28 07:01:29.399 | 
2025-10-28 07:01:29.399 | {
2025-10-28 07:01:29.399 |   where: {
2025-10-28 07:01:29.399 |     AND: [
2025-10-28 07:01:29.399 |       {
2025-10-28 07:01:29.399 |         OR: [
2025-10-28 07:01:29.399 |           {
2025-10-28 07:01:29.399 |             name: {
2025-10-28 07:01:29.399 |               contains: "fotboll",
2025-10-28 07:01:29.399 |               mode: "insensitive"
2025-10-28 07:01:29.399 |             }
2025-10-28 07:01:29.399 |           },
2025-10-28 07:01:29.399 |           {
2025-10-28 07:01:29.399 |             orgNumber: {
2025-10-28 07:01:29.399 |               contains: "fotboll",
2025-10-28 07:01:29.399 |               mode: "insensitive"
2025-10-28 07:01:29.399 |             }
2025-10-28 07:01:29.399 |           },
2025-10-28 07:01:29.399 |           {
2025-10-28 07:01:29.399 |             streetAddress: {
2025-10-28 07:01:29.399 |               contains: "fotboll",
2025-10-28 07:01:29.399 |               mode: "insensitive"
2025-10-28 07:01:29.399 |             }
2025-10-28 07:01:29.399 |           },
2025-10-28 07:01:29.399 |           {
2025-10-28 07:01:29.399 |             city: {
2025-10-28 07:01:29.399 |               contains: "fotboll",
2025-10-28 07:01:29.399 |               mode: "insensitive"
2025-10-28 07:01:29.399 |             }
2025-10-28 07:01:29.399 |           },
2025-10-28 07:01:29.399 |           {
2025-10-28 07:01:29.399 |             municipality: {
2025-10-28 07:01:29.399 |               contains: "fotboll",
2025-10-28 07:01:29.399 |               mode: "insensitive"
2025-10-28 07:01:29.399 |             }
2025-10-28 07:01:29.399 |           },
2025-10-28 07:01:29.399 |           {
2025-10-28 07:01:29.399 |             email: {
2025-10-28 07:01:29.399 |               contains: "fotboll",
2025-10-28 07:01:29.399 |               mode: "insensitive"
2025-10-28 07:01:29.399 |             }
2025-10-28 07:01:29.399 |           },
2025-10-28 07:01:29.399 |           {
2025-10-28 07:01:29.399 |             phone: {
2025-10-28 07:01:29.399 |               contains: "fotboll",
2025-10-28 07:01:29.399 |               mode: "insensitive"
2025-10-28 07:01:29.399 |             }
2025-10-28 07:01:29.399 |           },
2025-10-28 07:01:29.399 |           {
2025-10-28 07:01:29.399 |             homepageUrl: {
2025-10-28 07:01:29.399 |               contains: "fotboll",
2025-10-28 07:01:29.399 |               mode: "insensitive"
2025-10-28 07:01:29.399 |             }
2025-10-28 07:01:29.399 |           },
2025-10-28 07:01:29.399 |           {
2025-10-28 07:01:29.399 |             descriptionFreeText: {
2025-10-28 07:01:29.399 |               contains: "fotboll",
2025-10-28 07:01:29.399 |               mode: "insensitive"
2025-10-28 07:01:29.399 |             }
2025-10-28 07:01:29.399 |           },
2025-10-28 07:01:29.399 |           {
2025-10-28 07:01:29.399 |             sourceSystem: {
2025-10-28 07:01:29.399 |               contains: "fotboll",
2025-10-28 07:01:29.399 |               mode: "insensitive"
2025-10-28 07:01:29.399 |             }
2025-10-28 07:01:29.399 |           },
2025-10-28 07:01:29.399 |           {
2025-10-28 07:01:29.399 |             tags: {
2025-10-28 07:01:29.399 |               some: {
2025-10-28 07:01:29.399 |                 name: {
2025-10-28 07:01:29.399 |                   contains: "fotboll",
2025-10-28 07:01:29.399 |                   mode: "insensitive"
2025-10-28 07:01:29.399 |                 }
2025-10-28 07:01:29.399 |               }
2025-10-28 07:01:29.399 |             }
2025-10-28 07:01:29.399 |           },
2025-10-28 07:01:29.399 |           {
2025-10-28 07:01:29.399 |             contacts: {
2025-10-28 07:01:29.399 |               some: {
2025-10-28 07:01:29.399 |                 OR: [
2025-10-28 07:01:29.399 |                   {
2025-10-28 07:01:29.399 |                     name: {
2025-10-28 07:01:29.399 |                       contains: "fotboll",
2025-10-28 07:01:29.399 |                       mode: "insensitive"
2025-10-28 07:01:29.399 |                     }
2025-10-28 07:01:29.399 |                   },
2025-10-28 07:01:29.399 |                   {
2025-10-28 07:01:29.399 |                     role: {
2025-10-28 07:01:29.399 |                       contains: "fotboll",
2025-10-28 07:01:29.399 |                       mode: "insensitive"
2025-10-28 07:01:29.399 |                     }
2025-10-28 07:01:29.399 |                   },
2025-10-28 07:01:29.399 |                   {
2025-10-28 07:01:29.399 |                     email: {
2025-10-28 07:01:29.399 |                       contains: "fotboll",
2025-10-28 07:01:29.399 |                       mode: "insensitive"
2025-10-28 07:01:29.399 |                     }
2025-10-28 07:01:29.399 |                   },
2025-10-28 07:01:29.399 |                   {
2025-10-28 07:01:29.399 |                     phone: {
2025-10-28 07:01:29.399 |                       contains: "fotboll",
2025-10-28 07:01:29.399 |                       mode: "insensitive"
2025-10-28 07:01:29.399 |                     }
2025-10-28 07:01:29.399 |                   },
2025-10-28 07:01:29.399 |                   {
2025-10-28 07:01:29.399 |                     mobile: {
2025-10-28 07:01:29.399 |                       contains: "fotboll",
2025-10-28 07:01:29.399 |                       mode: "insensitive"
2025-10-28 07:01:29.399 |                     }
2025-10-28 07:01:29.399 |                   }
2025-10-28 07:01:29.399 |                 ]
2025-10-28 07:01:29.399 |               }
2025-10-28 07:01:29.399 |             }
2025-10-28 07:01:29.399 |           }
2025-10-28 07:01:29.399 |         ]
2025-10-28 07:01:29.399 |       }
2025-10-28 07:01:29.399 |     ]
2025-10-28 07:01:29.399 |   },
2025-10-28 07:01:29.399 |   skip: 0,
2025-10-28 07:01:29.399 |   take: 10,
2025-10-28 07:01:29.399 |   include: {
2025-10-28 07:01:29.399 |     contacts: {
2025-10-28 07:01:29.399 |       where: {
2025-10-28 07:01:29.399 |         isPrimary: true
2025-10-28 07:01:29.399 |       },
2025-10-28 07:01:29.399 |       take: 1
2025-10-28 07:01:29.399 |     },
2025-10-28 07:01:29.399 |     tags: true,
2025-10-28 07:01:29.399 |     _count: {
2025-10-28 07:01:29.399 |       select: {
2025-10-28 07:01:29.399 |         contacts: true,
2025-10-28 07:01:29.399 |         notes: true
2025-10-28 07:01:29.399 |       }
2025-10-28 07:01:29.399 |     },
2025-10-28 07:01:29.399 |     assignedTo: true,
2025-10-28 07:01:29.399 |     activityLog: {
2025-10-28 07:01:29.399 |       orderBy: {
2025-10-28 07:01:29.399 |         createdAt: "desc"
2025-10-28 07:01:29.399 |       },
2025-10-28 07:01:29.399 |       take: 1
2025-10-28 07:01:29.399 |     }
2025-10-28 07:01:29.399 |   },
2025-10-28 07:01:29.399 |   orderBy: {
2025-10-28 07:01:29.399 |     updatedAt: "desc"
2025-10-28 07:01:29.399 |   }
2025-10-28 07:01:29.399 | }
2025-10-28 07:01:29.399 | 
2025-10-28 07:01:29.399 | Unknown argument `mode`. Did you mean `lte`? Available options are marked with ?.
2025-10-28 07:01:29.465 | prisma:error 
2025-10-28 07:01:29.465 | Invalid `prisma.association.count()` invocation:
2025-10-28 07:01:29.465 | 
2025-10-28 07:01:29.465 | {
2025-10-28 07:01:29.465 |   select: {
2025-10-28 07:01:29.465 |     _count: {
2025-10-28 07:01:29.465 |       select: {
2025-10-28 07:01:29.465 |         _all: true
2025-10-28 07:01:29.465 |       }
2025-10-28 07:01:29.465 |     }
2025-10-28 07:01:29.465 |   },
2025-10-28 07:01:29.465 |   where: {
2025-10-28 07:01:29.465 |     AND: [
2025-10-28 07:01:29.465 |       {
2025-10-28 07:01:29.465 |         OR: [
2025-10-28 07:01:29.465 |           {
2025-10-28 07:01:29.465 |             name: {
2025-10-28 07:01:29.465 |               contains: "fotboll",
2025-10-28 07:01:29.465 |               mode: "insensitive"
2025-10-28 07:01:29.465 |             }
2025-10-28 07:01:29.465 |           },
2025-10-28 07:01:29.465 |           {
2025-10-28 07:01:29.465 |             orgNumber: {
2025-10-28 07:01:29.465 |               contains: "fotboll",
2025-10-28 07:01:29.465 |               mode: "insensitive"
2025-10-28 07:01:29.465 |             }
2025-10-28 07:01:29.465 |           },
2025-10-28 07:01:29.465 |           {
2025-10-28 07:01:29.465 |             streetAddress: {
2025-10-28 07:01:29.465 |               contains: "fotboll",
2025-10-28 07:01:29.465 |               mode: "insensitive"
2025-10-28 07:01:29.465 |             }
2025-10-28 07:01:29.465 |           },
2025-10-28 07:01:29.465 |           {
2025-10-28 07:01:29.465 |             city: {
2025-10-28 07:01:29.465 |               contains: "fotboll",
2025-10-28 07:01:29.465 |               mode: "insensitive"
2025-10-28 07:01:29.465 |             }
2025-10-28 07:01:29.465 |           },
2025-10-28 07:01:29.465 |           {
2025-10-28 07:01:29.465 |             municipality: {
2025-10-28 07:01:29.465 |               contains: "fotboll",
2025-10-28 07:01:29.465 |               mode: "insensitive"
2025-10-28 07:01:29.465 |             }
2025-10-28 07:01:29.465 |           },
2025-10-28 07:01:29.465 |           {
2025-10-28 07:01:29.465 |             email: {
2025-10-28 07:01:29.465 |               contains: "fotboll",
2025-10-28 07:01:29.465 |               mode: "insensitive"
2025-10-28 07:01:29.465 |             }
2025-10-28 07:01:29.465 |           },
2025-10-28 07:01:29.465 |           {
2025-10-28 07:01:29.465 |             phone: {
2025-10-28 07:01:29.465 |               contains: "fotboll",
2025-10-28 07:01:29.465 |               mode: "insensitive"
2025-10-28 07:01:29.465 |             }
2025-10-28 07:01:29.465 |           },
2025-10-28 07:01:29.465 |           {
2025-10-28 07:01:29.465 |             homepageUrl: {
2025-10-28 07:01:29.465 |               contains: "fotboll",
2025-10-28 07:01:29.465 |               mode: "insensitive"
2025-10-28 07:01:29.465 |             }
2025-10-28 07:01:29.465 |           },
2025-10-28 07:01:29.465 |           {
2025-10-28 07:01:29.465 |             descriptionFreeText: {
2025-10-28 07:01:29.465 |               contains: "fotboll",
2025-10-28 07:01:29.465 |               mode: "insensitive"
2025-10-28 07:01:29.465 |             }
2025-10-28 07:01:29.465 |           },
2025-10-28 07:01:29.465 |           {
2025-10-28 07:01:29.465 |             sourceSystem: {
2025-10-28 07:01:29.465 |               contains: "fotboll",
2025-10-28 07:01:29.465 |               mode: "insensitive"
2025-10-28 07:01:29.465 |             }
2025-10-28 07:01:29.465 |           },
2025-10-28 07:01:29.465 |           {
2025-10-28 07:01:29.465 |             tags: {
2025-10-28 07:01:29.465 |               some: {
2025-10-28 07:01:29.465 |                 name: {
2025-10-28 07:01:29.465 |                   contains: "fotboll",
2025-10-28 07:01:29.465 |                   mode: "insensitive"
2025-10-28 07:01:29.465 |                 }
2025-10-28 07:01:29.465 |               }
2025-10-28 07:01:29.465 |             }
2025-10-28 07:01:29.465 |           },
2025-10-28 07:01:29.465 |           {
2025-10-28 07:01:29.465 |             contacts: {
2025-10-28 07:01:29.465 |               some: {
2025-10-28 07:01:29.465 |                 OR: [
2025-10-28 07:01:29.465 |                   {
2025-10-28 07:01:29.465 |                     name: {
2025-10-28 07:01:29.465 |                       contains: "fotboll",
2025-10-28 07:01:29.465 |                       mode: "insensitive"
2025-10-28 07:01:29.465 |                     }
2025-10-28 07:01:29.465 |                   },
2025-10-28 07:01:29.465 |                   {
2025-10-28 07:01:29.465 |                     role: {
2025-10-28 07:01:29.465 |                       contains: "fotboll",
2025-10-28 07:01:29.465 |                       mode: "insensitive"
2025-10-28 07:01:29.465 |                     }
2025-10-28 07:01:29.465 |                   },
2025-10-28 07:01:29.465 |                   {
2025-10-28 07:01:29.465 |                     email: {
2025-10-28 07:01:29.465 |                       contains: "fotboll",
2025-10-28 07:01:29.465 |                       mode: "insensitive"
2025-10-28 07:01:29.465 |                     }
2025-10-28 07:01:29.465 |                   },
2025-10-28 07:01:29.465 |                   {
2025-10-28 07:01:29.465 |                     phone: {
2025-10-28 07:01:29.465 |                       contains: "fotboll",
2025-10-28 07:01:29.465 |                       mode: "insensitive"
2025-10-28 07:01:29.465 |                     }
2025-10-28 07:01:29.465 |                   },
2025-10-28 07:01:29.466 |                   {
2025-10-28 07:01:29.466 |                     mobile: {
2025-10-28 07:01:29.466 |                       contains: "fotboll",
2025-10-28 07:01:29.466 |                       mode: "insensitive"
2025-10-28 07:01:29.466 |                     }
2025-10-28 07:01:29.466 |                   }
2025-10-28 07:01:29.466 |                 ]
2025-10-28 07:01:29.466 |               }
2025-10-28 07:01:29.466 |             }
2025-10-28 07:01:29.466 |           }
2025-10-28 07:01:29.466 |         ]
2025-10-28 07:01:29.466 |       }
2025-10-28 07:01:29.466 |     ]
2025-10-28 07:01:29.466 |   }
2025-10-28 07:01:29.466 | }
2025-10-28 07:01:29.466 | 
2025-10-28 07:01:29.466 | Unknown argument `mode`. Did you mean `lte`? Available options are marked with ?.
2025-10-28 07:01:29.466 |  GET /api/trpc/tags.list,municipality.list,users.list,association.list?batch=1&input=%7B%220%22%3A%7B%22json%22%3Anull%2C%22meta%22%3A%7B%22values%22%3A%5B%22undefined%22%5D%2C%22v%22%3A1%7D%7D%2C%221%22%3A%7B%22json%22%3A%7B%22limit%22%3A400%2C%22sortBy%22%3A%22name%22%2C%22sortOrder%22%3A%22asc%22%7D%7D%2C%222%22%3A%7B%22json%22%3A%7B%22page%22%3A1%2C%22limit%22%3A200%7D%7D%2C%223%22%3A%7B%22json%22%3A%7B%22page%22%3A1%2C%22limit%22%3A10%2C%22search%22%3A%22fotboll%22%2C%22crmStatuses%22%3Anull%2C%22pipelines%22%3Anull%2C%22types%22%3Anull%2C%22activities%22%3Anull%2C%22tags%22%3Anull%2C%22hasEmail%22%3Anull%2C%22hasPhone%22%3Anull%2C%22isMember%22%3Anull%2C%22assignedToId%22%3Anull%2C%22municipality%22%3Anull%2C%22municipalityId%22%3Anull%2C%22dateRange%22%3Anull%2C%22lastActivityDays%22%3Anull%2C%22sortBy%22%3A%22updatedAt%22%2C%22sortDirection%22%3A%22desc%22%2C%22useSearchIndex%22%3Afalse%7D%2C%22meta%22%3A%7B%22values%22%3A%7B%22crmStatuses%22%3A%5B%22undefined%22%5D%2C%22pipelines%22%3A%5B%22undefined%22%5D%2C%22types%22%3A%5B%22undefined%22%5D%2C%22activities%22%3A%5B%22undefined%22%5D%2C%22tags%22%3A%5B%22undefined%22%5D%2C%22hasEmail%22%3A%5B%22undefined%22%5D%2C%22hasPhone%22%3A%5B%22undefined%22%5D%2C%22isMember%22%3A%5B%22undefined%22%5D%2C%22assignedToId%22%3A%5B%22undefined%22%5D%2C%22municipality%22%3A%5B%22undefined%22%5D%2C%22municipalityId%22%3A%5B%22undefined%22%5D%2C%22dateRange%22%3A%5B%22undefined%22%5D%2C%22lastActivityDays%22%3A%5B%22undefined%22%5D%7D%2C%22v%22%3A1%7D%7D%7D 207 in 248ms
2025-10-28 07:01:29.490 |  GET /api/auth/session 200 in 186ms
2025-10-28 08:12:21.274 | Environment variables loaded from .env
2025-10-28 08:12:21.281 | Prisma schema loaded from prisma/schema.prisma
2025-10-28 08:12:22.188 | 
2025-10-28 08:12:22.188 | ✔ Generated Prisma Client (v6.18.0) to ./node_modules/@prisma/client in 435ms
2025-10-28 08:12:22.188 | 
2025-10-28 08:12:22.188 | Start by importing your Prisma Client (See: https://pris.ly/d/importing-client)
2025-10-28 08:12:22.188 | 
2025-10-28 08:12:22.188 | Tip: Want to turn off tips and other hints? https://pris.ly/tip-4-nohints
2025-10-28 08:12:22.188 | 
2025-10-28 08:12:24.419 | Environment variables loaded from .env
2025-10-28 08:12:24.427 | Prisma schema loaded from prisma/schema.prisma
2025-10-28 08:12:24.433 | Datasource "db": MySQL database "crm_db" at "mysql:3306"
2025-10-28 08:12:24.469 | 
2025-10-28 08:12:24.470 | Error: P1001: Can't reach database server at `mysql:3306`
2025-10-28 08:12:24.470 | 
2025-10-28 08:12:24.470 | Please make sure your database server is running at `mysql:3306`.
2025-10-28 08:12:27.500 | Environment variables loaded from .env
2025-10-28 08:12:27.511 | Prisma schema loaded from prisma/schema.prisma
2025-10-28 08:12:28.404 | 
2025-10-28 08:12:28.404 | ✔ Generated Prisma Client (v6.18.0) to ./node_modules/@prisma/client in 391ms
2025-10-28 08:12:28.404 | 
2025-10-28 08:12:28.404 | Start by importing your Prisma Client (See: https://pris.ly/d/importing-client)
2025-10-28 08:12:28.405 | 
2025-10-28 08:12:28.405 | Tip: Want to turn off tips and other hints? https://pris.ly/tip-4-nohints
2025-10-28 08:12:28.405 | 
2025-10-28 08:12:30.993 | Environment variables loaded from .env
2025-10-28 08:12:31.000 | Prisma schema loaded from prisma/schema.prisma
2025-10-28 08:12:31.004 | Datasource "db": MySQL database "crm_db" at "mysql:3306"
2025-10-28 08:12:31.068 | 
2025-10-28 08:12:31.068 | 2 migrations found in prisma/migrations
2025-10-28 08:12:31.068 | 
2025-10-28 08:12:31.131 | 
2025-10-28 08:12:31.132 | No pending migrations to apply.
2025-10-28 08:12:31.381 | 
2025-10-28 08:12:31.382 | > medlemsregistret-crm@0.1.0 dev
2025-10-28 08:12:31.382 | > next dev -p 3000
2025-10-28 08:12:31.382 | 
2025-10-28 08:12:33.823 |    ▲ Next.js 15.1.6
2025-10-28 08:12:33.824 |    - Local:        http://localhost:3000
2025-10-28 08:12:33.824 |    - Network:      http://172.18.0.5:3000
2025-10-28 08:12:33.824 |    - Environments: .env
2025-10-28 08:12:33.824 | 
2025-10-28 08:12:33.824 |  ✓ Starting...
2025-10-28 08:12:36.117 |  ✓ Ready in 2.8s
2025-10-28 09:13:25.376 |  ○ Compiling /middleware ...
2025-10-28 09:13:26.653 |  ✓ Compiled /middleware in 1779ms (258 modules)
2025-10-28 09:13:27.529 |  ○ Compiling / ...
2025-10-28 09:13:27.763 | <w> [webpack.cache.PackFileCacheStrategy] Serializing big strings (128kiB) impacts deserialization performance (consider using Buffer instead and decode when needed)
2025-10-28 09:13:34.003 |  ✓ Compiled / in 7s (943 modules)
2025-10-28 09:13:34.917 |  GET / 200 in 7924ms
2025-10-28 09:13:34.992 |  ✓ Compiled in 970ms (474 modules)
2025-10-28 09:13:51.399 |  GET / 200 in 84ms
2025-10-28 09:13:52.480 |  ○ Compiling /dashboard ...
2025-10-28 09:14:00.875 |  ✓ Compiled /dashboard in 8.9s (3585 modules)
2025-10-28 09:14:01.456 |  GET /dashboard 200 in 9466ms
2025-10-28 09:14:02.270 |  GET /api/auth/session 200 in 10328ms
2025-10-28 09:14:03.255 |  GET /api/auth/session 200 in 584ms
2025-10-28 09:14:04.693 |  ○ Compiling /api/trpc/[trpc] ...
2025-10-28 09:14:07.878 |  ✓ Compiled /api/trpc/[trpc] in 3.7s (4240 modules)
2025-10-28 09:14:09.029 | prisma:query SELECT COUNT(*) AS `_count$_all` FROM (SELECT `crm_db`.`Association`.`id` FROM `crm_db`.`Association` WHERE (`crm_db`.`Association`.`crmStatus` = ? AND `crm_db`.`Association`.`isDeleted` = ?)) AS `sub`
2025-10-28 09:14:09.029 | prisma:query SELECT COUNT(*) AS `_count$_all` FROM (SELECT `crm_db`.`Association`.`id` FROM `crm_db`.`Association` WHERE (`crm_db`.`Association`.`crmStatus` = ? AND `crm_db`.`Association`.`isDeleted` = ?)) AS `sub`
2025-10-28 09:14:09.031 | prisma:query SELECT `crm_db`.`Activity`.`id`, `crm_db`.`Activity`.`associationId`, `crm_db`.`Activity`.`type`, `crm_db`.`Activity`.`description`, `crm_db`.`Activity`.`metadata`, `crm_db`.`Activity`.`userId`, `crm_db`.`Activity`.`userName`, `crm_db`.`Activity`.`createdAt` FROM `crm_db`.`Activity` WHERE `crm_db`.`Activity`.`createdAt` >= ? ORDER BY `crm_db`.`Activity`.`createdAt` DESC LIMIT ? OFFSET ?
2025-10-28 09:14:09.031 | prisma:query SELECT `crm_db`.`Group`.`id`, `crm_db`.`Group`.`name`, `crm_db`.`Group`.`description`, `crm_db`.`Group`.`searchQuery`, `crm_db`.`Group`.`autoUpdate`, `crm_db`.`Group`.`createdById`, `crm_db`.`Group`.`createdAt`, `crm_db`.`Group`.`updatedAt`, COALESCE(`aggr_selection_0_GroupMembership`.`_aggr_count_memberships`, 0) AS `_aggr_count_memberships` FROM `crm_db`.`Group` LEFT JOIN (SELECT `crm_db`.`GroupMembership`.`groupId`, COUNT(*) AS `_aggr_count_memberships` FROM `crm_db`.`GroupMembership` WHERE 1=1 GROUP BY `crm_db`.`GroupMembership`.`groupId`) AS `aggr_selection_0_GroupMembership` ON (`crm_db`.`Group`.`id` = `aggr_selection_0_GroupMembership`.`groupId`) WHERE 1=1 ORDER BY `crm_db`.`Group`.`updatedAt` DESC
2025-10-28 09:14:09.031 | prisma:query SELECT `crm_db`.`User`.`id`, `crm_db`.`User`.`name` FROM `crm_db`.`User` WHERE `crm_db`.`User`.`id` IN (?)
2025-10-28 09:14:09.032 | prisma:query SELECT `crm_db`.`User`.`id`, `crm_db`.`User`.`name`, `crm_db`.`User`.`email` FROM `crm_db`.`User` WHERE `crm_db`.`User`.`id` IN (?)
2025-10-28 09:14:09.033 | prisma:query SELECT `crm_db`.`Task`.`id`, `crm_db`.`Task`.`title`, `crm_db`.`Task`.`description`, `crm_db`.`Task`.`dueDate`, `crm_db`.`Task`.`status`, `crm_db`.`Task`.`priority`, `crm_db`.`Task`.`associationId`, `crm_db`.`Task`.`assignedToId`, `crm_db`.`Task`.`createdById`, `crm_db`.`Task`.`completedAt`, `crm_db`.`Task`.`createdAt`, `crm_db`.`Task`.`updatedAt` FROM `crm_db`.`Task` WHERE `crm_db`.`Task`.`status` IN (?,?,?) ORDER BY `crm_db`.`Task`.`status` ASC, `crm_db`.`Task`.`dueDate` ASC, `crm_db`.`Task`.`createdAt` DESC LIMIT ? OFFSET ?
2025-10-28 09:14:09.033 | prisma:query SELECT `crm_db`.`User`.`id`, `crm_db`.`User`.`name`, `crm_db`.`User`.`email` FROM `crm_db`.`User` WHERE `crm_db`.`User`.`id` IN (?)
2025-10-28 09:14:09.046 | prisma:query SELECT COUNT(*) AS `_count$_all` FROM (SELECT `crm_db`.`Association`.`id` FROM `crm_db`.`Association` WHERE `crm_db`.`Association`.`isDeleted` = ?) AS `sub`
2025-10-28 09:14:09.046 | prisma:query SELECT COUNT(*) AS `_count$_all` FROM (SELECT `crm_db`.`Association`.`id` FROM `crm_db`.`Association` WHERE 1=1) AS `sub`
2025-10-28 09:14:09.054 | prisma:query SELECT COUNT(*) AS `_count$_all` FROM (SELECT `crm_db`.`Association`.`id` FROM `crm_db`.`Association` WHERE (`crm_db`.`Association`.`isMember` = ? AND `crm_db`.`Association`.`memberSince` <= ?)) AS `sub`
2025-10-28 09:14:09.077 | prisma:query SELECT COUNT(*) AS `_count$_all` FROM (SELECT `crm_db`.`Association`.`id` FROM `crm_db`.`Association` WHERE (`crm_db`.`Association`.`isMember` = ? AND `crm_db`.`Association`.`memberSince` <= ?)) AS `sub`
2025-10-28 09:14:09.098 | prisma:query SELECT COUNT(*) AS `_count$_all` FROM (SELECT `crm_db`.`Association`.`id` FROM `crm_db`.`Association` WHERE (`crm_db`.`Association`.`isMember` = ? AND `crm_db`.`Association`.`memberSince` <= ?)) AS `sub`
2025-10-28 09:14:09.120 | prisma:query SELECT COUNT(*) AS `_count$_all` FROM (SELECT `crm_db`.`Association`.`id` FROM `crm_db`.`Association` WHERE (`crm_db`.`Association`.`isMember` = ? AND `crm_db`.`Association`.`memberSince` <= ?)) AS `sub`
2025-10-28 09:14:09.125 | prisma:query SELECT COUNT(*) AS `_count$_all` FROM (SELECT `crm_db`.`Association`.`id` FROM `crm_db`.`Association` WHERE (`crm_db`.`Association`.`isMember` = ? AND `crm_db`.`Association`.`isDeleted` = ?)) AS `sub`
2025-10-28 09:14:09.144 | prisma:query SELECT COUNT(*) AS `_count$_all` FROM (SELECT `crm_db`.`Association`.`id` FROM `crm_db`.`Association` WHERE (`crm_db`.`Association`.`isMember` = ? AND `crm_db`.`Association`.`memberSince` <= ?)) AS `sub`
2025-10-28 09:14:09.155 | prisma:query SELECT COUNT(*) AS `_count$_all`, `crm_db`.`Association`.`municipalityId` FROM `crm_db`.`Association` WHERE (`crm_db`.`Association`.`municipalityId` IS NOT NULL AND `crm_db`.`Association`.`isDeleted` = ?) GROUP BY `crm_db`.`Association`.`municipalityId` ORDER BY COUNT(`crm_db`.`Association`.`municipalityId`) DESC LIMIT ? OFFSET ?
2025-10-28 09:14:09.158 | prisma:query SELECT `crm_db`.`Municipality`.`id`, `crm_db`.`Municipality`.`name` FROM `crm_db`.`Municipality` WHERE `crm_db`.`Municipality`.`id` IN (?,?,?,?,?)
2025-10-28 09:14:09.165 | prisma:query SELECT COUNT(*) AS `_count$_all` FROM (SELECT `crm_db`.`Association`.`id` FROM `crm_db`.`Association` WHERE (`crm_db`.`Association`.`isMember` = ? AND `crm_db`.`Association`.`memberSince` <= ?)) AS `sub`
2025-10-28 09:14:09.187 | prisma:query SELECT COUNT(*) AS `_count$_all` FROM (SELECT `crm_db`.`Association`.`id` FROM `crm_db`.`Association` WHERE (`crm_db`.`Association`.`isMember` = ? AND `crm_db`.`Association`.`memberSince` <= ?)) AS `sub`
2025-10-28 09:14:09.207 | prisma:query SELECT COUNT(*) AS `_count$_all` FROM (SELECT `crm_db`.`Association`.`id` FROM `crm_db`.`Association` WHERE (`crm_db`.`Association`.`isMember` = ? AND `crm_db`.`Association`.`memberSince` <= ?)) AS `sub`
2025-10-28 09:14:09.232 | prisma:query SELECT COUNT(*) AS `_count$_all` FROM (SELECT `crm_db`.`Association`.`id` FROM `crm_db`.`Association` WHERE (`crm_db`.`Association`.`isMember` = ? AND `crm_db`.`Association`.`memberSince` <= ?)) AS `sub`
2025-10-28 09:14:09.266 | prisma:query SELECT COUNT(*) AS `_count$_all` FROM (SELECT `crm_db`.`Association`.`id` FROM `crm_db`.`Association` WHERE (`crm_db`.`Association`.`isMember` = ? AND `crm_db`.`Association`.`memberSince` <= ?)) AS `sub`
2025-10-28 09:14:09.300 | prisma:query SELECT COUNT(*) AS `_count$_all` FROM (SELECT `crm_db`.`Association`.`id` FROM `crm_db`.`Association` WHERE (`crm_db`.`Association`.`isMember` = ? AND `crm_db`.`Association`.`memberSince` <= ?)) AS `sub`
2025-10-28 09:14:09.321 | prisma:query SELECT COUNT(*) AS `_count$_all` FROM (SELECT `crm_db`.`Association`.`id` FROM `crm_db`.`Association` WHERE (`crm_db`.`Association`.`isMember` = ? AND `crm_db`.`Association`.`memberSince` <= ?)) AS `sub`
2025-10-28 09:14:09.394 | prisma:query SELECT `crm_db`.`Association`.`id`, `crm_db`.`Association`.`sourceSystem`, `crm_db`.`Association`.`municipalityId`, `crm_db`.`Association`.`municipality`, `crm_db`.`Association`.`scrapeRunId`, `crm_db`.`Association`.`scrapedAt`, `crm_db`.`Association`.`detailUrl`, `crm_db`.`Association`.`name`, `crm_db`.`Association`.`orgNumber`, `crm_db`.`Association`.`types`, `crm_db`.`Association`.`activities`, `crm_db`.`Association`.`categories`, `crm_db`.`Association`.`homepageUrl`, `crm_db`.`Association`.`streetAddress`, `crm_db`.`Association`.`postalCode`, `crm_db`.`Association`.`city`, `crm_db`.`Association`.`email`, `crm_db`.`Association`.`phone`, `crm_db`.`Association`.`description`, `crm_db`.`Association`.`descriptionFreeText`, `crm_db`.`Association`.`crmStatus`, `crm_db`.`Association`.`isMember`, `crm_db`.`Association`.`memberSince`, `crm_db`.`Association`.`pipeline`, `crm_db`.`Association`.`assignedToId`, `crm_db`.`Association`.`listPageIndex`, `crm_db`.`Association`.`positionOnPage`, `crm_db`.`Association`.`paginationModel`, `crm_db`.`Association`.`filterState`, `crm_db`.`Association`.`extras`, `crm_db`.`Association`.`createdAt`, `crm_db`.`Association`.`updatedAt`, `crm_db`.`Association`.`importBatchId`, `crm_db`.`Association`.`deletedAt`, `crm_db`.`Association`.`isDeleted`, COALESCE(`aggr_selection_0_Contact`.`_aggr_count_contacts`, 0) AS `_aggr_count_contacts`, COALESCE(`aggr_selection_1_Note`.`_aggr_count_notes`, 0) AS `_aggr_count_notes` FROM `crm_db`.`Association` LEFT JOIN (SELECT `crm_db`.`Contact`.`associationId`, COUNT(*) AS `_aggr_count_contacts` FROM `crm_db`.`Contact` WHERE 1=1 GROUP BY `crm_db`.`Contact`.`associationId`) AS `aggr_selection_0_Contact` ON (`crm_db`.`Association`.`id` = `aggr_selection_0_Contact`.`associationId`) LEFT JOIN (SELECT `crm_db`.`Note`.`associationId`, COUNT(*) AS `_aggr_count_notes` FROM `crm_db`.`Note` WHERE 1=1 GROUP BY `crm_db`.`Note`.`associationId`) AS `aggr_selection_1_Note` ON (`crm_db`.`Association`.`id` = `aggr_selection_1_Note`.`associationId`) WHERE 1=1 ORDER BY `crm_db`.`Association`.`updatedAt` DESC LIMIT ? OFFSET ?
2025-10-28 09:14:09.396 | prisma:query SELECT `crm_db`.`Contact`.`id`, `crm_db`.`Contact`.`associationId`, `crm_db`.`Contact`.`name`, `crm_db`.`Contact`.`role`, `crm_db`.`Contact`.`email`, `crm_db`.`Contact`.`phone`, `crm_db`.`Contact`.`mobile`, `crm_db`.`Contact`.`linkedinUrl`, `crm_db`.`Contact`.`facebookUrl`, `crm_db`.`Contact`.`twitterUrl`, `crm_db`.`Contact`.`instagramUrl`, `crm_db`.`Contact`.`isPrimary`, `crm_db`.`Contact`.`createdAt`, `crm_db`.`Contact`.`updatedAt` FROM `crm_db`.`Contact` WHERE (`crm_db`.`Contact`.`isPrimary` = ? AND `crm_db`.`Contact`.`associationId` IN (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)) ORDER BY `crm_db`.`Contact`.`id` ASC
2025-10-28 09:14:09.398 | prisma:query SELECT `crm_db`.`_AssociationTags`.`A`, `crm_db`.`_AssociationTags`.`B` FROM `crm_db`.`_AssociationTags` WHERE `crm_db`.`_AssociationTags`.`A` IN (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
2025-10-28 09:14:09.399 | prisma:query SELECT `crm_db`.`Activity`.`id`, `crm_db`.`Activity`.`associationId`, `crm_db`.`Activity`.`type`, `crm_db`.`Activity`.`description`, `crm_db`.`Activity`.`metadata`, `crm_db`.`Activity`.`userId`, `crm_db`.`Activity`.`userName`, `crm_db`.`Activity`.`createdAt` FROM `crm_db`.`Activity` WHERE `crm_db`.`Activity`.`associationId` IN (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?) ORDER BY `crm_db`.`Activity`.`createdAt` DESC
2025-10-28 09:14:09.422 |  GET /api/trpc/association.getStats,activities.recent,association.getMemberGrowth,tasks.list,association.list,groups.list?batch=1&input=%7B%220%22%3A%7B%22json%22%3Anull%2C%22meta%22%3A%7B%22values%22%3A%5B%22undefined%22%5D%2C%22v%22%3A1%7D%7D%2C%221%22%3A%7B%22json%22%3A%7B%22limit%22%3A10%7D%7D%2C%222%22%3A%7B%22json%22%3A%7B%22months%22%3A12%7D%7D%2C%223%22%3A%7B%22json%22%3A%7B%22status%22%3A%5B%22OPEN%22%2C%22IN_PROGRESS%22%2C%22BLOCKED%22%5D%2C%22limit%22%3A8%7D%7D%2C%224%22%3A%7B%22json%22%3A%7B%22page%22%3A1%2C%22limit%22%3A20%7D%7D%2C%225%22%3A%7B%22json%22%3Anull%2C%22meta%22%3A%7B%22values%22%3A%5B%22undefined%22%5D%2C%22v%22%3A1%7D%7D%7D 200 in 5258ms
2025-10-28 09:14:10.174 |  ○ Compiling /municipalities ...
2025-10-28 09:14:11.704 |  ✓ Compiled /municipalities in 2s (4381 modules)
2025-10-28 09:14:12.053 |  GET /api/trpc/ai.nextSteps?batch=1&input=%7B%220%22%3A%7B%22json%22%3A%7B%22associationId%22%3A%22cmh9mi1ud15i6b5nwg20dxwu9%22%7D%7D%7D 200 in 2420ms
2025-10-28 09:14:12.054 | prisma:query SELECT `crm_db`.`Association`.`id`, `crm_db`.`Association`.`sourceSystem`, `crm_db`.`Association`.`municipalityId`, `crm_db`.`Association`.`municipality`, `crm_db`.`Association`.`scrapeRunId`, `crm_db`.`Association`.`scrapedAt`, `crm_db`.`Association`.`detailUrl`, `crm_db`.`Association`.`name`, `crm_db`.`Association`.`orgNumber`, `crm_db`.`Association`.`types`, `crm_db`.`Association`.`activities`, `crm_db`.`Association`.`categories`, `crm_db`.`Association`.`homepageUrl`, `crm_db`.`Association`.`streetAddress`, `crm_db`.`Association`.`postalCode`, `crm_db`.`Association`.`city`, `crm_db`.`Association`.`email`, `crm_db`.`Association`.`phone`, `crm_db`.`Association`.`description`, `crm_db`.`Association`.`descriptionFreeText`, `crm_db`.`Association`.`crmStatus`, `crm_db`.`Association`.`isMember`, `crm_db`.`Association`.`memberSince`, `crm_db`.`Association`.`pipeline`, `crm_db`.`Association`.`assignedToId`, `crm_db`.`Association`.`listPageIndex`, `crm_db`.`Association`.`positionOnPage`, `crm_db`.`Association`.`paginationModel`, `crm_db`.`Association`.`filterState`, `crm_db`.`Association`.`extras`, `crm_db`.`Association`.`createdAt`, `crm_db`.`Association`.`updatedAt`, `crm_db`.`Association`.`importBatchId`, `crm_db`.`Association`.`deletedAt`, `crm_db`.`Association`.`isDeleted` FROM `crm_db`.`Association` WHERE (`crm_db`.`Association`.`id` = ? AND 1=1) LIMIT ? OFFSET ?
2025-10-28 09:14:12.054 | prisma:query SELECT `crm_db`.`Note`.`id`, `crm_db`.`Note`.`associationId`, `crm_db`.`Note`.`content`, `crm_db`.`Note`.`tags`, `crm_db`.`Note`.`authorId`, `crm_db`.`Note`.`authorName`, `crm_db`.`Note`.`createdAt`, `crm_db`.`Note`.`updatedAt` FROM `crm_db`.`Note` WHERE `crm_db`.`Note`.`associationId` IN (?) ORDER BY `crm_db`.`Note`.`createdAt` DESC LIMIT ? OFFSET ?
2025-10-28 09:14:12.054 | prisma:query SELECT `crm_db`.`Activity`.`id`, `crm_db`.`Activity`.`associationId`, `crm_db`.`Activity`.`type`, `crm_db`.`Activity`.`description`, `crm_db`.`Activity`.`metadata`, `crm_db`.`Activity`.`userId`, `crm_db`.`Activity`.`userName`, `crm_db`.`Activity`.`createdAt` FROM `crm_db`.`Activity` WHERE `crm_db`.`Activity`.`associationId` IN (?) ORDER BY `crm_db`.`Activity`.`createdAt` DESC LIMIT ? OFFSET ?
2025-10-28 09:14:12.056 |  GET /municipalities 200 in 2459ms
2025-10-28 09:14:12.336 | prisma:query SELECT `crm_db`.`Municipality`.`id`, `crm_db`.`Municipality`.`name`, `crm_db`.`Municipality`.`code`, `crm_db`.`Municipality`.`county`, `crm_db`.`Municipality`.`region`, `crm_db`.`Municipality`.`latitude`, `crm_db`.`Municipality`.`longitude`, `crm_db`.`Municipality`.`population`, `crm_db`.`Municipality`.`homepage`, `crm_db`.`Municipality`.`createdAt`, `crm_db`.`Municipality`.`updatedAt`, `crm_db`.`Municipality`.`platform`, `crm_db`.`Municipality`.`province`, `crm_db`.`Municipality`.`registerStatus`, `crm_db`.`Municipality`.`registerUrl`, `crm_db`.`Municipality`.`registryEndpoint`, `crm_db`.`Municipality`.`countyCode`, COALESCE(`aggr_selection_0_Association`.`_aggr_count_associations`, 0) AS `_aggr_count_associations` FROM `crm_db`.`Municipality` LEFT JOIN (SELECT `crm_db`.`Association`.`municipalityId`, COUNT(*) AS `_aggr_count_associations` FROM `crm_db`.`Association` WHERE 1=1 GROUP BY `crm_db`.`Association`.`municipalityId`) AS `aggr_selection_0_Association` ON (`crm_db`.`Municipality`.`id` = `aggr_selection_0_Association`.`municipalityId`) WHERE 1=1 ORDER BY `crm_db`.`Municipality`.`name` ASC LIMIT ? OFFSET ?
2025-10-28 09:14:12.392 |  GET /api/trpc/municipality.list?batch=1&input=%7B%220%22%3A%7B%22json%22%3A%7B%22search%22%3Anull%2C%22limit%22%3A290%2C%22sortBy%22%3A%22name%22%2C%22sortOrder%22%3A%22asc%22%7D%2C%22meta%22%3A%7B%22values%22%3A%7B%22search%22%3A%5B%22undefined%22%5D%7D%2C%22v%22%3A1%7D%7D%7D 200 in 171ms
2025-10-28 09:14:17.214 | prisma:query SELECT `crm_db`.`Municipality`.`id`, `crm_db`.`Municipality`.`name`, `crm_db`.`Municipality`.`code`, `crm_db`.`Municipality`.`county`, `crm_db`.`Municipality`.`region`, `crm_db`.`Municipality`.`latitude`, `crm_db`.`Municipality`.`longitude`, `crm_db`.`Municipality`.`population`, `crm_db`.`Municipality`.`homepage`, `crm_db`.`Municipality`.`createdAt`, `crm_db`.`Municipality`.`updatedAt`, `crm_db`.`Municipality`.`platform`, `crm_db`.`Municipality`.`province`, `crm_db`.`Municipality`.`registerStatus`, `crm_db`.`Municipality`.`registerUrl`, `crm_db`.`Municipality`.`registryEndpoint`, `crm_db`.`Municipality`.`countyCode`, COALESCE(`aggr_selection_0_Association`.`_aggr_count_associations`, 0) AS `_aggr_count_associations` FROM `crm_db`.`Municipality` LEFT JOIN (SELECT `crm_db`.`Association`.`municipalityId`, COUNT(*) AS `orderby_aggregator` FROM `crm_db`.`Association` WHERE 1=1 GROUP BY `crm_db`.`Association`.`municipalityId`) AS `orderby_1_Association` ON (`crm_db`.`Municipality`.`id` = `orderby_1_Association`.`municipalityId`) LEFT JOIN (SELECT `crm_db`.`Association`.`municipalityId`, COUNT(*) AS `_aggr_count_associations` FROM `crm_db`.`Association` WHERE 1=1 GROUP BY `crm_db`.`Association`.`municipalityId`) AS `aggr_selection_0_Association` ON (`crm_db`.`Municipality`.`id` = `aggr_selection_0_Association`.`municipalityId`) WHERE 1=1 ORDER BY COALESCE(`orderby_1_Association`.`orderby_aggregator`, ?) ASC LIMIT ? OFFSET ?
2025-10-28 09:14:17.254 |  GET /api/trpc/municipality.list?batch=1&input=%7B%220%22%3A%7B%22json%22%3A%7B%22search%22%3Anull%2C%22limit%22%3A290%2C%22sortBy%22%3A%22associations%22%2C%22sortOrder%22%3A%22asc%22%7D%2C%22meta%22%3A%7B%22values%22%3A%7B%22search%22%3A%5B%22undefined%22%5D%7D%2C%22v%22%3A1%7D%7D%7D 200 in 143ms
2025-10-28 09:14:30.208 | prisma:query SELECT 1
2025-10-28 09:14:30.238 | prisma:query SELECT `crm_db`.`Municipality`.`id`, `crm_db`.`Municipality`.`name`, `crm_db`.`Municipality`.`code`, `crm_db`.`Municipality`.`county`, `crm_db`.`Municipality`.`region`, `crm_db`.`Municipality`.`latitude`, `crm_db`.`Municipality`.`longitude`, `crm_db`.`Municipality`.`population`, `crm_db`.`Municipality`.`homepage`, `crm_db`.`Municipality`.`createdAt`, `crm_db`.`Municipality`.`updatedAt`, `crm_db`.`Municipality`.`platform`, `crm_db`.`Municipality`.`province`, `crm_db`.`Municipality`.`registerStatus`, `crm_db`.`Municipality`.`registerUrl`, `crm_db`.`Municipality`.`registryEndpoint`, `crm_db`.`Municipality`.`countyCode`, COALESCE(`aggr_selection_0_Association`.`_aggr_count_associations`, 0) AS `_aggr_count_associations` FROM `crm_db`.`Municipality` LEFT JOIN (SELECT `crm_db`.`Association`.`municipalityId`, COUNT(*) AS `orderby_aggregator` FROM `crm_db`.`Association` WHERE 1=1 GROUP BY `crm_db`.`Association`.`municipalityId`) AS `orderby_1_Association` ON (`crm_db`.`Municipality`.`id` = `orderby_1_Association`.`municipalityId`) LEFT JOIN (SELECT `crm_db`.`Association`.`municipalityId`, COUNT(*) AS `_aggr_count_associations` FROM `crm_db`.`Association` WHERE 1=1 GROUP BY `crm_db`.`Association`.`municipalityId`) AS `aggr_selection_0_Association` ON (`crm_db`.`Municipality`.`id` = `aggr_selection_0_Association`.`municipalityId`) WHERE 1=1 ORDER BY COALESCE(`orderby_1_Association`.`orderby_aggregator`, ?) DESC LIMIT ? OFFSET ?
2025-10-28 09:14:30.269 |  GET /api/trpc/municipality.list?batch=1&input=%7B%220%22%3A%7B%22json%22%3A%7B%22search%22%3Anull%2C%22limit%22%3A290%2C%22sortBy%22%3A%22associations%22%2C%22sortOrder%22%3A%22desc%22%7D%2C%22meta%22%3A%7B%22values%22%3A%7B%22search%22%3A%5B%22undefined%22%5D%7D%2C%22v%22%3A1%7D%7D%7D 200 in 129ms
2025-10-28 09:14:33.464 | prisma:query SELECT `crm_db`.`Municipality`.`id`, `crm_db`.`Municipality`.`name`, `crm_db`.`Municipality`.`code`, `crm_db`.`Municipality`.`county`, `crm_db`.`Municipality`.`region`, `crm_db`.`Municipality`.`latitude`, `crm_db`.`Municipality`.`longitude`, `crm_db`.`Municipality`.`population`, `crm_db`.`Municipality`.`homepage`, `crm_db`.`Municipality`.`createdAt`, `crm_db`.`Municipality`.`updatedAt`, `crm_db`.`Municipality`.`platform`, `crm_db`.`Municipality`.`province`, `crm_db`.`Municipality`.`registerStatus`, `crm_db`.`Municipality`.`registerUrl`, `crm_db`.`Municipality`.`registryEndpoint`, `crm_db`.`Municipality`.`countyCode`, COALESCE(`aggr_selection_0_Association`.`_aggr_count_associations`, 0) AS `_aggr_count_associations` FROM `crm_db`.`Municipality` LEFT JOIN (SELECT `crm_db`.`Association`.`municipalityId`, COUNT(*) AS `orderby_aggregator` FROM `crm_db`.`Association` WHERE 1=1 GROUP BY `crm_db`.`Association`.`municipalityId`) AS `orderby_1_Association` ON (`crm_db`.`Municipality`.`id` = `orderby_1_Association`.`municipalityId`) LEFT JOIN (SELECT `crm_db`.`Association`.`municipalityId`, COUNT(*) AS `_aggr_count_associations` FROM `crm_db`.`Association` WHERE 1=1 GROUP BY `crm_db`.`Association`.`municipalityId`) AS `aggr_selection_0_Association` ON (`crm_db`.`Municipality`.`id` = `aggr_selection_0_Association`.`municipalityId`) WHERE 1=1 ORDER BY COALESCE(`orderby_1_Association`.`orderby_aggregator`, ?) ASC LIMIT ? OFFSET ?
2025-10-28 09:14:33.490 |  GET /api/trpc/municipality.list?batch=1&input=%7B%220%22%3A%7B%22json%22%3A%7B%22search%22%3Anull%2C%22limit%22%3A290%2C%22sortBy%22%3A%22associations%22%2C%22sortOrder%22%3A%22asc%22%7D%2C%22meta%22%3A%7B%22values%22%3A%7B%22search%22%3A%5B%22undefined%22%5D%7D%2C%22v%22%3A1%7D%7D%7D 200 in 122ms
2025-10-28 09:14:39.969 |  ○ Compiling /associations ...
2025-10-28 09:14:41.429 |  ✓ Compiled /associations in 1962ms (4454 modules)
2025-10-28 09:14:41.572 |  GET /associations?municipalityId=cmh3mc2h3006jb5ckrxvvd1o9&municipality=V%C3%A4ster%C3%A5s 200 in 2146ms
2025-10-28 09:14:42.080 | prisma:query SELECT 1
2025-10-28 09:14:42.080 | prisma:query SELECT 1
2025-10-28 09:14:42.081 | prisma:query SELECT 1
2025-10-28 09:14:42.083 | prisma:query SELECT `crm_db`.`Municipality`.`id`, `crm_db`.`Municipality`.`name`, `crm_db`.`Municipality`.`code`, `crm_db`.`Municipality`.`county`, `crm_db`.`Municipality`.`region`, `crm_db`.`Municipality`.`latitude`, `crm_db`.`Municipality`.`longitude`, `crm_db`.`Municipality`.`population`, `crm_db`.`Municipality`.`homepage`, `crm_db`.`Municipality`.`createdAt`, `crm_db`.`Municipality`.`updatedAt`, `crm_db`.`Municipality`.`platform`, `crm_db`.`Municipality`.`province`, `crm_db`.`Municipality`.`registerStatus`, `crm_db`.`Municipality`.`registerUrl`, `crm_db`.`Municipality`.`registryEndpoint`, `crm_db`.`Municipality`.`countyCode` FROM `crm_db`.`Municipality` WHERE (`crm_db`.`Municipality`.`id` = ? AND 1=1) LIMIT ? OFFSET ?
2025-10-28 09:14:42.085 | prisma:query SELECT `crm_db`.`Tag`.`id`, `crm_db`.`Tag`.`name`, `crm_db`.`Tag`.`color`, `crm_db`.`Tag`.`createdAt` FROM `crm_db`.`Tag` WHERE 1=1 ORDER BY `crm_db`.`Tag`.`createdAt` DESC
2025-10-28 09:14:42.087 | prisma:query SELECT COUNT(*) AS `_count$_all` FROM (SELECT `crm_db`.`Association`.`id` FROM `crm_db`.`Association` WHERE (`crm_db`.`Association`.`municipality` = ? AND `crm_db`.`Association`.`municipalityId` = ?)) AS `sub`
2025-10-28 09:14:42.138 | prisma:query SELECT `crm_db`.`Association`.`id`, `crm_db`.`Association`.`sourceSystem`, `crm_db`.`Association`.`municipalityId`, `crm_db`.`Association`.`municipality`, `crm_db`.`Association`.`scrapeRunId`, `crm_db`.`Association`.`scrapedAt`, `crm_db`.`Association`.`detailUrl`, `crm_db`.`Association`.`name`, `crm_db`.`Association`.`orgNumber`, `crm_db`.`Association`.`types`, `crm_db`.`Association`.`activities`, `crm_db`.`Association`.`categories`, `crm_db`.`Association`.`homepageUrl`, `crm_db`.`Association`.`streetAddress`, `crm_db`.`Association`.`postalCode`, `crm_db`.`Association`.`city`, `crm_db`.`Association`.`email`, `crm_db`.`Association`.`phone`, `crm_db`.`Association`.`description`, `crm_db`.`Association`.`descriptionFreeText`, `crm_db`.`Association`.`crmStatus`, `crm_db`.`Association`.`isMember`, `crm_db`.`Association`.`memberSince`, `crm_db`.`Association`.`pipeline`, `crm_db`.`Association`.`assignedToId`, `crm_db`.`Association`.`listPageIndex`, `crm_db`.`Association`.`positionOnPage`, `crm_db`.`Association`.`paginationModel`, `crm_db`.`Association`.`filterState`, `crm_db`.`Association`.`extras`, `crm_db`.`Association`.`createdAt`, `crm_db`.`Association`.`updatedAt`, `crm_db`.`Association`.`importBatchId`, `crm_db`.`Association`.`deletedAt`, `crm_db`.`Association`.`isDeleted`, COALESCE(`aggr_selection_0_Contact`.`_aggr_count_contacts`, 0) AS `_aggr_count_contacts`, COALESCE(`aggr_selection_1_Note`.`_aggr_count_notes`, 0) AS `_aggr_count_notes` FROM `crm_db`.`Association` LEFT JOIN (SELECT `crm_db`.`Contact`.`associationId`, COUNT(*) AS `_aggr_count_contacts` FROM `crm_db`.`Contact` WHERE 1=1 GROUP BY `crm_db`.`Contact`.`associationId`) AS `aggr_selection_0_Contact` ON (`crm_db`.`Association`.`id` = `aggr_selection_0_Contact`.`associationId`) LEFT JOIN (SELECT `crm_db`.`Note`.`associationId`, COUNT(*) AS `_aggr_count_notes` FROM `crm_db`.`Note` WHERE 1=1 GROUP BY `crm_db`.`Note`.`associationId`) AS `aggr_selection_1_Note` ON (`crm_db`.`Association`.`id` = `aggr_selection_1_Note`.`associationId`) WHERE (`crm_db`.`Association`.`municipality` = ? AND `crm_db`.`Association`.`municipalityId` = ?) ORDER BY `crm_db`.`Association`.`updatedAt` DESC LIMIT ? OFFSET ?
2025-10-28 09:14:42.139 | prisma:query SELECT `crm_db`.`Contact`.`id`, `crm_db`.`Contact`.`associationId`, `crm_db`.`Contact`.`name`, `crm_db`.`Contact`.`role`, `crm_db`.`Contact`.`email`, `crm_db`.`Contact`.`phone`, `crm_db`.`Contact`.`mobile`, `crm_db`.`Contact`.`linkedinUrl`, `crm_db`.`Contact`.`facebookUrl`, `crm_db`.`Contact`.`twitterUrl`, `crm_db`.`Contact`.`instagramUrl`, `crm_db`.`Contact`.`isPrimary`, `crm_db`.`Contact`.`createdAt`, `crm_db`.`Contact`.`updatedAt` FROM `crm_db`.`Contact` WHERE (`crm_db`.`Contact`.`isPrimary` = ? AND `crm_db`.`Contact`.`associationId` IN (?,?,?,?,?,?,?,?,?,?)) ORDER BY `crm_db`.`Contact`.`id` ASC
2025-10-28 09:14:42.140 | prisma:query SELECT `crm_db`.`_AssociationTags`.`A`, `crm_db`.`_AssociationTags`.`B` FROM `crm_db`.`_AssociationTags` WHERE `crm_db`.`_AssociationTags`.`A` IN (?,?,?,?,?,?,?,?,?,?)
2025-10-28 09:14:42.140 | prisma:query SELECT `crm_db`.`Activity`.`id`, `crm_db`.`Activity`.`associationId`, `crm_db`.`Activity`.`type`, `crm_db`.`Activity`.`description`, `crm_db`.`Activity`.`metadata`, `crm_db`.`Activity`.`userId`, `crm_db`.`Activity`.`userName`, `crm_db`.`Activity`.`createdAt` FROM `crm_db`.`Activity` WHERE `crm_db`.`Activity`.`associationId` IN (?,?,?,?,?,?,?,?,?,?) ORDER BY `crm_db`.`Activity`.`createdAt` DESC
2025-10-28 09:14:42.190 |  GET /api/trpc/municipality.getById,association.list,tags.list,municipality.list,users.list?batch=1&input=%7B%220%22%3A%7B%22json%22%3A%7B%22id%22%3A%22cmh3mc2h3006jb5ckrxvvd1o9%22%7D%7D%2C%221%22%3A%7B%22json%22%3A%7B%22page%22%3A1%2C%22limit%22%3A10%2C%22search%22%3Anull%2C%22crmStatuses%22%3Anull%2C%22pipelines%22%3Anull%2C%22types%22%3Anull%2C%22activities%22%3Anull%2C%22tags%22%3Anull%2C%22hasEmail%22%3Anull%2C%22hasPhone%22%3Anull%2C%22isMember%22%3Anull%2C%22assignedToId%22%3Anull%2C%22municipality%22%3A%22V%C3%A4ster%C3%A5s%22%2C%22municipalityId%22%3A%22cmh3mc2h3006jb5ckrxvvd1o9%22%2C%22dateRange%22%3Anull%2C%22lastActivityDays%22%3Anull%2C%22sortBy%22%3A%22updatedAt%22%2C%22sortDirection%22%3A%22desc%22%2C%22useSearchIndex%22%3Afalse%7D%2C%22meta%22%3A%7B%22values%22%3A%7B%22search%22%3A%5B%22undefined%22%5D%2C%22crmStatuses%22%3A%5B%22undefined%22%5D%2C%22pipelines%22%3A%5B%22undefined%22%5D%2C%22types%22%3A%5B%22undefined%22%5D%2C%22activities%22%3A%5B%22undefined%22%5D%2C%22tags%22%3A%5B%22undefined%22%5D%2C%22hasEmail%22%3A%5B%22undefined%22%5D%2C%22hasPhone%22%3A%5B%22undefined%22%5D%2C%22isMember%22%3A%5B%22undefined%22%5D%2C%22assignedToId%22%3A%5B%22undefined%22%5D%2C%22dateRange%22%3A%5B%22undefined%22%5D%2C%22lastActivityDays%22%3A%5B%22undefined%22%5D%7D%2C%22v%22%3A1%7D%7D%2C%222%22%3A%7B%22json%22%3Anull%2C%22meta%22%3A%7B%22values%22%3A%5B%22undefined%22%5D%2C%22v%22%3A1%7D%7D%2C%223%22%3A%7B%22json%22%3A%7B%22limit%22%3A400%2C%22sortBy%22%3A%22name%22%2C%22sortOrder%22%3A%22asc%22%7D%7D%2C%224%22%3A%7B%22json%22%3A%7B%22page%22%3A1%2C%22limit%22%3A200%7D%7D%7D 207 in 317ms
2025-10-28 09:14:43.319 |  GET /api/trpc/municipality.list,users.list?batch=1&input=%7B%220%22%3A%7B%22json%22%3A%7B%22limit%22%3A400%2C%22sortBy%22%3A%22name%22%2C%22sortOrder%22%3A%22asc%22%7D%7D%2C%221%22%3A%7B%22json%22%3A%7B%22page%22%3A1%2C%22limit%22%3A200%7D%7D%7D 400 in 68ms
2025-10-28 09:14:45.449 |  GET /api/trpc/municipality.list,users.list?batch=1&input=%7B%220%22%3A%7B%22json%22%3A%7B%22limit%22%3A400%2C%22sortBy%22%3A%22name%22%2C%22sortOrder%22%3A%22asc%22%7D%7D%2C%221%22%3A%7B%22json%22%3A%7B%22page%22%3A1%2C%22limit%22%3A200%7D%7D%7D 400 in 70ms
2025-10-28 09:14:49.077 | prisma:query SELECT 1
2025-10-28 09:14:49.093 | prisma:query SELECT COUNT(*) AS `_count$_all` FROM (SELECT `crm_db`.`Association`.`id` FROM `crm_db`.`Association` WHERE (`crm_db`.`Association`.`municipality` = ? AND `crm_db`.`Association`.`municipalityId` = ? AND (`crm_db`.`Association`.`name` LIKE ? OR `crm_db`.`Association`.`orgNumber` LIKE ? OR `crm_db`.`Association`.`streetAddress` LIKE ? OR `crm_db`.`Association`.`city` LIKE ? OR `crm_db`.`Association`.`municipality` LIKE ? OR `crm_db`.`Association`.`email` LIKE ? OR `crm_db`.`Association`.`phone` LIKE ? OR `crm_db`.`Association`.`homepageUrl` LIKE ? OR `crm_db`.`Association`.`descriptionFreeText` LIKE ? OR `crm_db`.`Association`.`sourceSystem` LIKE ? OR EXISTS(SELECT `t0`.`A` FROM `crm_db`.`_AssociationTags` AS `t0` INNER JOIN `crm_db`.`Tag` AS `j0` ON (`j0`.`id`) = (`t0`.`B`) WHERE (`j0`.`name` LIKE ? AND (`crm_db`.`Association`.`id`) = (`t0`.`A`) AND `t0`.`A` IS NOT NULL)) OR EXISTS(SELECT `t1`.`associationId` FROM `crm_db`.`Contact` AS `t1` WHERE ((`t1`.`name` LIKE ? OR `t1`.`role` LIKE ? OR `t1`.`email` LIKE ? OR `t1`.`phone` LIKE ? OR `t1`.`mobile` LIKE ?) AND (`crm_db`.`Association`.`id`) = (`t1`.`associationId`) AND `t1`.`associationId` IS NOT NULL))))) AS `sub`
2025-10-28 09:14:49.149 | prisma:query SELECT `crm_db`.`Association`.`id`, `crm_db`.`Association`.`sourceSystem`, `crm_db`.`Association`.`municipalityId`, `crm_db`.`Association`.`municipality`, `crm_db`.`Association`.`scrapeRunId`, `crm_db`.`Association`.`scrapedAt`, `crm_db`.`Association`.`detailUrl`, `crm_db`.`Association`.`name`, `crm_db`.`Association`.`orgNumber`, `crm_db`.`Association`.`types`, `crm_db`.`Association`.`activities`, `crm_db`.`Association`.`categories`, `crm_db`.`Association`.`homepageUrl`, `crm_db`.`Association`.`streetAddress`, `crm_db`.`Association`.`postalCode`, `crm_db`.`Association`.`city`, `crm_db`.`Association`.`email`, `crm_db`.`Association`.`phone`, `crm_db`.`Association`.`description`, `crm_db`.`Association`.`descriptionFreeText`, `crm_db`.`Association`.`crmStatus`, `crm_db`.`Association`.`isMember`, `crm_db`.`Association`.`memberSince`, `crm_db`.`Association`.`pipeline`, `crm_db`.`Association`.`assignedToId`, `crm_db`.`Association`.`listPageIndex`, `crm_db`.`Association`.`positionOnPage`, `crm_db`.`Association`.`paginationModel`, `crm_db`.`Association`.`filterState`, `crm_db`.`Association`.`extras`, `crm_db`.`Association`.`createdAt`, `crm_db`.`Association`.`updatedAt`, `crm_db`.`Association`.`importBatchId`, `crm_db`.`Association`.`deletedAt`, `crm_db`.`Association`.`isDeleted`, COALESCE(`aggr_selection_0_Contact`.`_aggr_count_contacts`, 0) AS `_aggr_count_contacts`, COALESCE(`aggr_selection_1_Note`.`_aggr_count_notes`, 0) AS `_aggr_count_notes` FROM `crm_db`.`Association` LEFT JOIN (SELECT `crm_db`.`Contact`.`associationId`, COUNT(*) AS `_aggr_count_contacts` FROM `crm_db`.`Contact` WHERE 1=1 GROUP BY `crm_db`.`Contact`.`associationId`) AS `aggr_selection_0_Contact` ON (`crm_db`.`Association`.`id` = `aggr_selection_0_Contact`.`associationId`) LEFT JOIN (SELECT `crm_db`.`Note`.`associationId`, COUNT(*) AS `_aggr_count_notes` FROM `crm_db`.`Note` WHERE 1=1 GROUP BY `crm_db`.`Note`.`associationId`) AS `aggr_selection_1_Note` ON (`crm_db`.`Association`.`id` = `aggr_selection_1_Note`.`associationId`) WHERE (`crm_db`.`Association`.`municipality` = ? AND `crm_db`.`Association`.`municipalityId` = ? AND (`crm_db`.`Association`.`name` LIKE ? OR `crm_db`.`Association`.`orgNumber` LIKE ? OR `crm_db`.`Association`.`streetAddress` LIKE ? OR `crm_db`.`Association`.`city` LIKE ? OR `crm_db`.`Association`.`municipality` LIKE ? OR `crm_db`.`Association`.`email` LIKE ? OR `crm_db`.`Association`.`phone` LIKE ? OR `crm_db`.`Association`.`homepageUrl` LIKE ? OR `crm_db`.`Association`.`descriptionFreeText` LIKE ? OR `crm_db`.`Association`.`sourceSystem` LIKE ? OR EXISTS(SELECT `t0`.`A` FROM `crm_db`.`_AssociationTags` AS `t0` INNER JOIN `crm_db`.`Tag` AS `j0` ON (`j0`.`id`) = (`t0`.`B`) WHERE (`j0`.`name` LIKE ? AND (`crm_db`.`Association`.`id`) = (`t0`.`A`) AND `t0`.`A` IS NOT NULL)) OR EXISTS(SELECT `t1`.`associationId` FROM `crm_db`.`Contact` AS `t1` WHERE ((`t1`.`name` LIKE ? OR `t1`.`role` LIKE ? OR `t1`.`email` LIKE ? OR `t1`.`phone` LIKE ? OR `t1`.`mobile` LIKE ?) AND (`crm_db`.`Association`.`id`) = (`t1`.`associationId`) AND `t1`.`associationId` IS NOT NULL)))) ORDER BY `crm_db`.`Association`.`updatedAt` DESC LIMIT ? OFFSET ?
2025-10-28 09:14:49.149 | prisma:query SELECT `crm_db`.`Contact`.`id`, `crm_db`.`Contact`.`associationId`, `crm_db`.`Contact`.`name`, `crm_db`.`Contact`.`role`, `crm_db`.`Contact`.`email`, `crm_db`.`Contact`.`phone`, `crm_db`.`Contact`.`mobile`, `crm_db`.`Contact`.`linkedinUrl`, `crm_db`.`Contact`.`facebookUrl`, `crm_db`.`Contact`.`twitterUrl`, `crm_db`.`Contact`.`instagramUrl`, `crm_db`.`Contact`.`isPrimary`, `crm_db`.`Contact`.`createdAt`, `crm_db`.`Contact`.`updatedAt` FROM `crm_db`.`Contact` WHERE (`crm_db`.`Contact`.`isPrimary` = ? AND `crm_db`.`Contact`.`associationId` IN (?,?,?,?,?,?,?,?,?,?)) ORDER BY `crm_db`.`Contact`.`id` ASC
2025-10-28 09:14:49.149 | prisma:query SELECT `crm_db`.`_AssociationTags`.`A`, `crm_db`.`_AssociationTags`.`B` FROM `crm_db`.`_AssociationTags` WHERE `crm_db`.`_AssociationTags`.`A` IN (?,?,?,?,?,?,?,?,?,?)
2025-10-28 09:14:49.149 | prisma:query SELECT `crm_db`.`Activity`.`id`, `crm_db`.`Activity`.`associationId`, `crm_db`.`Activity`.`type`, `crm_db`.`Activity`.`description`, `crm_db`.`Activity`.`metadata`, `crm_db`.`Activity`.`userId`, `crm_db`.`Activity`.`userName`, `crm_db`.`Activity`.`createdAt` FROM `crm_db`.`Activity` WHERE `crm_db`.`Activity`.`associationId` IN (?,?,?,?,?,?,?,?,?,?) ORDER BY `crm_db`.`Activity`.`createdAt` DESC
2025-10-28 09:14:49.155 |  GET /api/trpc/association.list?batch=1&input=%7B%220%22%3A%7B%22json%22%3A%7B%22page%22%3A1%2C%22limit%22%3A10%2C%22search%22%3A%22f%22%2C%22crmStatuses%22%3Anull%2C%22pipelines%22%3Anull%2C%22types%22%3Anull%2C%22activities%22%3Anull%2C%22tags%22%3Anull%2C%22hasEmail%22%3Anull%2C%22hasPhone%22%3Anull%2C%22isMember%22%3Anull%2C%22assignedToId%22%3Anull%2C%22municipality%22%3A%22V%C3%A4ster%C3%A5s%22%2C%22municipalityId%22%3A%22cmh3mc2h3006jb5ckrxvvd1o9%22%2C%22dateRange%22%3Anull%2C%22lastActivityDays%22%3Anull%2C%22sortBy%22%3A%22updatedAt%22%2C%22sortDirection%22%3A%22desc%22%2C%22useSearchIndex%22%3Afalse%7D%2C%22meta%22%3A%7B%22values%22%3A%7B%22crmStatuses%22%3A%5B%22undefined%22%5D%2C%22pipelines%22%3A%5B%22undefined%22%5D%2C%22types%22%3A%5B%22undefined%22%5D%2C%22activities%22%3A%5B%22undefined%22%5D%2C%22tags%22%3A%5B%22undefined%22%5D%2C%22hasEmail%22%3A%5B%22undefined%22%5D%2C%22hasPhone%22%3A%5B%22undefined%22%5D%2C%22isMember%22%3A%5B%22undefined%22%5D%2C%22assignedToId%22%3A%5B%22undefined%22%5D%2C%22dateRange%22%3A%5B%22undefined%22%5D%2C%22lastActivityDays%22%3A%5B%22undefined%22%5D%7D%2C%22v%22%3A1%7D%7D%7D 200 in 154ms
2025-10-28 09:14:49.231 | prisma:query SELECT COUNT(*) AS `_count$_all` FROM (SELECT `crm_db`.`Association`.`id` FROM `crm_db`.`Association` WHERE (`crm_db`.`Association`.`municipality` = ? AND `crm_db`.`Association`.`municipalityId` = ? AND (`crm_db`.`Association`.`name` LIKE ? OR `crm_db`.`Association`.`orgNumber` LIKE ? OR `crm_db`.`Association`.`streetAddress` LIKE ? OR `crm_db`.`Association`.`city` LIKE ? OR `crm_db`.`Association`.`municipality` LIKE ? OR `crm_db`.`Association`.`email` LIKE ? OR `crm_db`.`Association`.`phone` LIKE ? OR `crm_db`.`Association`.`homepageUrl` LIKE ? OR `crm_db`.`Association`.`descriptionFreeText` LIKE ? OR `crm_db`.`Association`.`sourceSystem` LIKE ? OR EXISTS(SELECT `t0`.`A` FROM `crm_db`.`_AssociationTags` AS `t0` INNER JOIN `crm_db`.`Tag` AS `j0` ON (`j0`.`id`) = (`t0`.`B`) WHERE (`j0`.`name` LIKE ? AND (`crm_db`.`Association`.`id`) = (`t0`.`A`) AND `t0`.`A` IS NOT NULL)) OR EXISTS(SELECT `t1`.`associationId` FROM `crm_db`.`Contact` AS `t1` WHERE ((`t1`.`name` LIKE ? OR `t1`.`role` LIKE ? OR `t1`.`email` LIKE ? OR `t1`.`phone` LIKE ? OR `t1`.`mobile` LIKE ?) AND (`crm_db`.`Association`.`id`) = (`t1`.`associationId`) AND `t1`.`associationId` IS NOT NULL))))) AS `sub`
2025-10-28 09:14:49.279 | prisma:query SELECT `crm_db`.`Association`.`id`, `crm_db`.`Association`.`sourceSystem`, `crm_db`.`Association`.`municipalityId`, `crm_db`.`Association`.`municipality`, `crm_db`.`Association`.`scrapeRunId`, `crm_db`.`Association`.`scrapedAt`, `crm_db`.`Association`.`detailUrl`, `crm_db`.`Association`.`name`, `crm_db`.`Association`.`orgNumber`, `crm_db`.`Association`.`types`, `crm_db`.`Association`.`activities`, `crm_db`.`Association`.`categories`, `crm_db`.`Association`.`homepageUrl`, `crm_db`.`Association`.`streetAddress`, `crm_db`.`Association`.`postalCode`, `crm_db`.`Association`.`city`, `crm_db`.`Association`.`email`, `crm_db`.`Association`.`phone`, `crm_db`.`Association`.`description`, `crm_db`.`Association`.`descriptionFreeText`, `crm_db`.`Association`.`crmStatus`, `crm_db`.`Association`.`isMember`, `crm_db`.`Association`.`memberSince`, `crm_db`.`Association`.`pipeline`, `crm_db`.`Association`.`assignedToId`, `crm_db`.`Association`.`listPageIndex`, `crm_db`.`Association`.`positionOnPage`, `crm_db`.`Association`.`paginationModel`, `crm_db`.`Association`.`filterState`, `crm_db`.`Association`.`extras`, `crm_db`.`Association`.`createdAt`, `crm_db`.`Association`.`updatedAt`, `crm_db`.`Association`.`importBatchId`, `crm_db`.`Association`.`deletedAt`, `crm_db`.`Association`.`isDeleted`, COALESCE(`aggr_selection_0_Contact`.`_aggr_count_contacts`, 0) AS `_aggr_count_contacts`, COALESCE(`aggr_selection_1_Note`.`_aggr_count_notes`, 0) AS `_aggr_count_notes` FROM `crm_db`.`Association` LEFT JOIN (SELECT `crm_db`.`Contact`.`associationId`, COUNT(*) AS `_aggr_count_contacts` FROM `crm_db`.`Contact` WHERE 1=1 GROUP BY `crm_db`.`Contact`.`associationId`) AS `aggr_selection_0_Contact` ON (`crm_db`.`Association`.`id` = `aggr_selection_0_Contact`.`associationId`) LEFT JOIN (SELECT `crm_db`.`Note`.`associationId`, COUNT(*) AS `_aggr_count_notes` FROM `crm_db`.`Note` WHERE 1=1 GROUP BY `crm_db`.`Note`.`associationId`) AS `aggr_selection_1_Note` ON (`crm_db`.`Association`.`id` = `aggr_selection_1_Note`.`associationId`) WHERE (`crm_db`.`Association`.`municipality` = ? AND `crm_db`.`Association`.`municipalityId` = ? AND (`crm_db`.`Association`.`name` LIKE ? OR `crm_db`.`Association`.`orgNumber` LIKE ? OR `crm_db`.`Association`.`streetAddress` LIKE ? OR `crm_db`.`Association`.`city` LIKE ? OR `crm_db`.`Association`.`municipality` LIKE ? OR `crm_db`.`Association`.`email` LIKE ? OR `crm_db`.`Association`.`phone` LIKE ? OR `crm_db`.`Association`.`homepageUrl` LIKE ? OR `crm_db`.`Association`.`descriptionFreeText` LIKE ? OR `crm_db`.`Association`.`sourceSystem` LIKE ? OR EXISTS(SELECT `t0`.`A` FROM `crm_db`.`_AssociationTags` AS `t0` INNER JOIN `crm_db`.`Tag` AS `j0` ON (`j0`.`id`) = (`t0`.`B`) WHERE (`j0`.`name` LIKE ? AND (`crm_db`.`Association`.`id`) = (`t0`.`A`) AND `t0`.`A` IS NOT NULL)) OR EXISTS(SELECT `t1`.`associationId` FROM `crm_db`.`Contact` AS `t1` WHERE ((`t1`.`name` LIKE ? OR `t1`.`role` LIKE ? OR `t1`.`email` LIKE ? OR `t1`.`phone` LIKE ? OR `t1`.`mobile` LIKE ?) AND (`crm_db`.`Association`.`id`) = (`t1`.`associationId`) AND `t1`.`associationId` IS NOT NULL)))) ORDER BY `crm_db`.`Association`.`updatedAt` DESC LIMIT ? OFFSET ?
2025-10-28 09:14:49.279 | prisma:query SELECT `crm_db`.`Contact`.`id`, `crm_db`.`Contact`.`associationId`, `crm_db`.`Contact`.`name`, `crm_db`.`Contact`.`role`, `crm_db`.`Contact`.`email`, `crm_db`.`Contact`.`phone`, `crm_db`.`Contact`.`mobile`, `crm_db`.`Contact`.`linkedinUrl`, `crm_db`.`Contact`.`facebookUrl`, `crm_db`.`Contact`.`twitterUrl`, `crm_db`.`Contact`.`instagramUrl`, `crm_db`.`Contact`.`isPrimary`, `crm_db`.`Contact`.`createdAt`, `crm_db`.`Contact`.`updatedAt` FROM `crm_db`.`Contact` WHERE (`crm_db`.`Contact`.`isPrimary` = ? AND `crm_db`.`Contact`.`associationId` IN (?,?,?,?,?,?,?,?,?,?)) ORDER BY `crm_db`.`Contact`.`id` ASC
2025-10-28 09:14:49.280 | prisma:query SELECT `crm_db`.`_AssociationTags`.`A`, `crm_db`.`_AssociationTags`.`B` FROM `crm_db`.`_AssociationTags` WHERE `crm_db`.`_AssociationTags`.`A` IN (?,?,?,?,?,?,?,?,?,?)
2025-10-28 09:14:49.280 | prisma:query SELECT `crm_db`.`Activity`.`id`, `crm_db`.`Activity`.`associationId`, `crm_db`.`Activity`.`type`, `crm_db`.`Activity`.`description`, `crm_db`.`Activity`.`metadata`, `crm_db`.`Activity`.`userId`, `crm_db`.`Activity`.`userName`, `crm_db`.`Activity`.`createdAt` FROM `crm_db`.`Activity` WHERE `crm_db`.`Activity`.`associationId` IN (?,?,?,?,?,?,?,?,?,?) ORDER BY `crm_db`.`Activity`.`createdAt` DESC
2025-10-28 09:14:49.286 |  GET /api/trpc/association.list?batch=1&input=%7B%220%22%3A%7B%22json%22%3A%7B%22page%22%3A1%2C%22limit%22%3A10%2C%22search%22%3A%22fo%22%2C%22crmStatuses%22%3Anull%2C%22pipelines%22%3Anull%2C%22types%22%3Anull%2C%22activities%22%3Anull%2C%22tags%22%3Anull%2C%22hasEmail%22%3Anull%2C%22hasPhone%22%3Anull%2C%22isMember%22%3Anull%2C%22assignedToId%22%3Anull%2C%22municipality%22%3A%22V%C3%A4ster%C3%A5s%22%2C%22municipalityId%22%3A%22cmh3mc2h3006jb5ckrxvvd1o9%22%2C%22dateRange%22%3Anull%2C%22lastActivityDays%22%3Anull%2C%22sortBy%22%3A%22updatedAt%22%2C%22sortDirection%22%3A%22desc%22%2C%22useSearchIndex%22%3Afalse%7D%2C%22meta%22%3A%7B%22values%22%3A%7B%22crmStatuses%22%3A%5B%22undefined%22%5D%2C%22pipelines%22%3A%5B%22undefined%22%5D%2C%22types%22%3A%5B%22undefined%22%5D%2C%22activities%22%3A%5B%22undefined%22%5D%2C%22tags%22%3A%5B%22undefined%22%5D%2C%22hasEmail%22%3A%5B%22undefined%22%5D%2C%22hasPhone%22%3A%5B%22undefined%22%5D%2C%22isMember%22%3A%5B%22undefined%22%5D%2C%22assignedToId%22%3A%5B%22undefined%22%5D%2C%22dateRange%22%3A%5B%22undefined%22%5D%2C%22lastActivityDays%22%3A%5B%22undefined%22%5D%7D%2C%22v%22%3A1%7D%7D%7D 200 in 129ms
2025-10-28 09:14:49.361 | prisma:query SELECT COUNT(*) AS `_count$_all` FROM (SELECT `crm_db`.`Association`.`id` FROM `crm_db`.`Association` WHERE (`crm_db`.`Association`.`municipality` = ? AND `crm_db`.`Association`.`municipalityId` = ? AND (`crm_db`.`Association`.`name` LIKE ? OR `crm_db`.`Association`.`orgNumber` LIKE ? OR `crm_db`.`Association`.`streetAddress` LIKE ? OR `crm_db`.`Association`.`city` LIKE ? OR `crm_db`.`Association`.`municipality` LIKE ? OR `crm_db`.`Association`.`email` LIKE ? OR `crm_db`.`Association`.`phone` LIKE ? OR `crm_db`.`Association`.`homepageUrl` LIKE ? OR `crm_db`.`Association`.`descriptionFreeText` LIKE ? OR `crm_db`.`Association`.`sourceSystem` LIKE ? OR EXISTS(SELECT `t0`.`A` FROM `crm_db`.`_AssociationTags` AS `t0` INNER JOIN `crm_db`.`Tag` AS `j0` ON (`j0`.`id`) = (`t0`.`B`) WHERE (`j0`.`name` LIKE ? AND (`crm_db`.`Association`.`id`) = (`t0`.`A`) AND `t0`.`A` IS NOT NULL)) OR EXISTS(SELECT `t1`.`associationId` FROM `crm_db`.`Contact` AS `t1` WHERE ((`t1`.`name` LIKE ? OR `t1`.`role` LIKE ? OR `t1`.`email` LIKE ? OR `t1`.`phone` LIKE ? OR `t1`.`mobile` LIKE ?) AND (`crm_db`.`Association`.`id`) = (`t1`.`associationId`) AND `t1`.`associationId` IS NOT NULL))))) AS `sub`
2025-10-28 09:14:49.419 | prisma:query SELECT `crm_db`.`Association`.`id`, `crm_db`.`Association`.`sourceSystem`, `crm_db`.`Association`.`municipalityId`, `crm_db`.`Association`.`municipality`, `crm_db`.`Association`.`scrapeRunId`, `crm_db`.`Association`.`scrapedAt`, `crm_db`.`Association`.`detailUrl`, `crm_db`.`Association`.`name`, `crm_db`.`Association`.`orgNumber`, `crm_db`.`Association`.`types`, `crm_db`.`Association`.`activities`, `crm_db`.`Association`.`categories`, `crm_db`.`Association`.`homepageUrl`, `crm_db`.`Association`.`streetAddress`, `crm_db`.`Association`.`postalCode`, `crm_db`.`Association`.`city`, `crm_db`.`Association`.`email`, `crm_db`.`Association`.`phone`, `crm_db`.`Association`.`description`, `crm_db`.`Association`.`descriptionFreeText`, `crm_db`.`Association`.`crmStatus`, `crm_db`.`Association`.`isMember`, `crm_db`.`Association`.`memberSince`, `crm_db`.`Association`.`pipeline`, `crm_db`.`Association`.`assignedToId`, `crm_db`.`Association`.`listPageIndex`, `crm_db`.`Association`.`positionOnPage`, `crm_db`.`Association`.`paginationModel`, `crm_db`.`Association`.`filterState`, `crm_db`.`Association`.`extras`, `crm_db`.`Association`.`createdAt`, `crm_db`.`Association`.`updatedAt`, `crm_db`.`Association`.`importBatchId`, `crm_db`.`Association`.`deletedAt`, `crm_db`.`Association`.`isDeleted`, COALESCE(`aggr_selection_0_Contact`.`_aggr_count_contacts`, 0) AS `_aggr_count_contacts`, COALESCE(`aggr_selection_1_Note`.`_aggr_count_notes`, 0) AS `_aggr_count_notes` FROM `crm_db`.`Association` LEFT JOIN (SELECT `crm_db`.`Contact`.`associationId`, COUNT(*) AS `_aggr_count_contacts` FROM `crm_db`.`Contact` WHERE 1=1 GROUP BY `crm_db`.`Contact`.`associationId`) AS `aggr_selection_0_Contact` ON (`crm_db`.`Association`.`id` = `aggr_selection_0_Contact`.`associationId`) LEFT JOIN (SELECT `crm_db`.`Note`.`associationId`, COUNT(*) AS `_aggr_count_notes` FROM `crm_db`.`Note` WHERE 1=1 GROUP BY `crm_db`.`Note`.`associationId`) AS `aggr_selection_1_Note` ON (`crm_db`.`Association`.`id` = `aggr_selection_1_Note`.`associationId`) WHERE (`crm_db`.`Association`.`municipality` = ? AND `crm_db`.`Association`.`municipalityId` = ? AND (`crm_db`.`Association`.`name` LIKE ? OR `crm_db`.`Association`.`orgNumber` LIKE ? OR `crm_db`.`Association`.`streetAddress` LIKE ? OR `crm_db`.`Association`.`city` LIKE ? OR `crm_db`.`Association`.`municipality` LIKE ? OR `crm_db`.`Association`.`email` LIKE ? OR `crm_db`.`Association`.`phone` LIKE ? OR `crm_db`.`Association`.`homepageUrl` LIKE ? OR `crm_db`.`Association`.`descriptionFreeText` LIKE ? OR `crm_db`.`Association`.`sourceSystem` LIKE ? OR EXISTS(SELECT `t0`.`A` FROM `crm_db`.`_AssociationTags` AS `t0` INNER JOIN `crm_db`.`Tag` AS `j0` ON (`j0`.`id`) = (`t0`.`B`) WHERE (`j0`.`name` LIKE ? AND (`crm_db`.`Association`.`id`) = (`t0`.`A`) AND `t0`.`A` IS NOT NULL)) OR EXISTS(SELECT `t1`.`associationId` FROM `crm_db`.`Contact` AS `t1` WHERE ((`t1`.`name` LIKE ? OR `t1`.`role` LIKE ? OR `t1`.`email` LIKE ? OR `t1`.`phone` LIKE ? OR `t1`.`mobile` LIKE ?) AND (`crm_db`.`Association`.`id`) = (`t1`.`associationId`) AND `t1`.`associationId` IS NOT NULL)))) ORDER BY `crm_db`.`Association`.`updatedAt` DESC LIMIT ? OFFSET ?
2025-10-28 09:14:49.420 | prisma:query SELECT `crm_db`.`Contact`.`id`, `crm_db`.`Contact`.`associationId`, `crm_db`.`Contact`.`name`, `crm_db`.`Contact`.`role`, `crm_db`.`Contact`.`email`, `crm_db`.`Contact`.`phone`, `crm_db`.`Contact`.`mobile`, `crm_db`.`Contact`.`linkedinUrl`, `crm_db`.`Contact`.`facebookUrl`, `crm_db`.`Contact`.`twitterUrl`, `crm_db`.`Contact`.`instagramUrl`, `crm_db`.`Contact`.`isPrimary`, `crm_db`.`Contact`.`createdAt`, `crm_db`.`Contact`.`updatedAt` FROM `crm_db`.`Contact` WHERE (`crm_db`.`Contact`.`isPrimary` = ? AND `crm_db`.`Contact`.`associationId` IN (?,?,?,?,?,?,?,?,?,?)) ORDER BY `crm_db`.`Contact`.`id` ASC
2025-10-28 09:14:49.421 | prisma:query SELECT `crm_db`.`_AssociationTags`.`A`, `crm_db`.`_AssociationTags`.`B` FROM `crm_db`.`_AssociationTags` WHERE `crm_db`.`_AssociationTags`.`A` IN (?,?,?,?,?,?,?,?,?,?)
2025-10-28 09:14:49.422 | prisma:query SELECT `crm_db`.`Activity`.`id`, `crm_db`.`Activity`.`associationId`, `crm_db`.`Activity`.`type`, `crm_db`.`Activity`.`description`, `crm_db`.`Activity`.`metadata`, `crm_db`.`Activity`.`userId`, `crm_db`.`Activity`.`userName`, `crm_db`.`Activity`.`createdAt` FROM `crm_db`.`Activity` WHERE `crm_db`.`Activity`.`associationId` IN (?,?,?,?,?,?,?,?,?,?) ORDER BY `crm_db`.`Activity`.`createdAt` DESC
2025-10-28 09:14:49.427 |  GET /api/trpc/association.list?batch=1&input=%7B%220%22%3A%7B%22json%22%3A%7B%22page%22%3A1%2C%22limit%22%3A10%2C%22search%22%3A%22fot%22%2C%22crmStatuses%22%3Anull%2C%22pipelines%22%3Anull%2C%22types%22%3Anull%2C%22activities%22%3Anull%2C%22tags%22%3Anull%2C%22hasEmail%22%3Anull%2C%22hasPhone%22%3Anull%2C%22isMember%22%3Anull%2C%22assignedToId%22%3Anull%2C%22municipality%22%3A%22V%C3%A4ster%C3%A5s%22%2C%22municipalityId%22%3A%22cmh3mc2h3006jb5ckrxvvd1o9%22%2C%22dateRange%22%3Anull%2C%22lastActivityDays%22%3Anull%2C%22sortBy%22%3A%22updatedAt%22%2C%22sortDirection%22%3A%22desc%22%2C%22useSearchIndex%22%3Afalse%7D%2C%22meta%22%3A%7B%22values%22%3A%7B%22crmStatuses%22%3A%5B%22undefined%22%5D%2C%22pipelines%22%3A%5B%22undefined%22%5D%2C%22types%22%3A%5B%22undefined%22%5D%2C%22activities%22%3A%5B%22undefined%22%5D%2C%22tags%22%3A%5B%22undefined%22%5D%2C%22hasEmail%22%3A%5B%22undefined%22%5D%2C%22hasPhone%22%3A%5B%22undefined%22%5D%2C%22isMember%22%3A%5B%22undefined%22%5D%2C%22assignedToId%22%3A%5B%22undefined%22%5D%2C%22dateRange%22%3A%5B%22undefined%22%5D%2C%22lastActivityDays%22%3A%5B%22undefined%22%5D%7D%2C%22v%22%3A1%7D%7D%7D 200 in 147ms
2025-10-28 09:14:49.713 |  GET /api/trpc/municipality.list,users.list?batch=1&input=%7B%220%22%3A%7B%22json%22%3A%7B%22limit%22%3A400%2C%22sortBy%22%3A%22name%22%2C%22sortOrder%22%3A%22asc%22%7D%7D%2C%221%22%3A%7B%22json%22%3A%7B%22page%22%3A1%2C%22limit%22%3A200%7D%7D%7D 400 in 77ms
2025-10-28 09:14:49.784 | prisma:query SELECT COUNT(*) AS `_count$_all` FROM (SELECT `crm_db`.`Association`.`id` FROM `crm_db`.`Association` WHERE (`crm_db`.`Association`.`municipality` = ? AND `crm_db`.`Association`.`municipalityId` = ? AND (`crm_db`.`Association`.`name` LIKE ? OR `crm_db`.`Association`.`orgNumber` LIKE ? OR `crm_db`.`Association`.`streetAddress` LIKE ? OR `crm_db`.`Association`.`city` LIKE ? OR `crm_db`.`Association`.`municipality` LIKE ? OR `crm_db`.`Association`.`email` LIKE ? OR `crm_db`.`Association`.`phone` LIKE ? OR `crm_db`.`Association`.`homepageUrl` LIKE ? OR `crm_db`.`Association`.`descriptionFreeText` LIKE ? OR `crm_db`.`Association`.`sourceSystem` LIKE ? OR EXISTS(SELECT `t0`.`A` FROM `crm_db`.`_AssociationTags` AS `t0` INNER JOIN `crm_db`.`Tag` AS `j0` ON (`j0`.`id`) = (`t0`.`B`) WHERE (`j0`.`name` LIKE ? AND (`crm_db`.`Association`.`id`) = (`t0`.`A`) AND `t0`.`A` IS NOT NULL)) OR EXISTS(SELECT `t1`.`associationId` FROM `crm_db`.`Contact` AS `t1` WHERE ((`t1`.`name` LIKE ? OR `t1`.`role` LIKE ? OR `t1`.`email` LIKE ? OR `t1`.`phone` LIKE ? OR `t1`.`mobile` LIKE ?) AND (`crm_db`.`Association`.`id`) = (`t1`.`associationId`) AND `t1`.`associationId` IS NOT NULL))))) AS `sub`
2025-10-28 09:14:49.833 | prisma:query SELECT `crm_db`.`Association`.`id`, `crm_db`.`Association`.`sourceSystem`, `crm_db`.`Association`.`municipalityId`, `crm_db`.`Association`.`municipality`, `crm_db`.`Association`.`scrapeRunId`, `crm_db`.`Association`.`scrapedAt`, `crm_db`.`Association`.`detailUrl`, `crm_db`.`Association`.`name`, `crm_db`.`Association`.`orgNumber`, `crm_db`.`Association`.`types`, `crm_db`.`Association`.`activities`, `crm_db`.`Association`.`categories`, `crm_db`.`Association`.`homepageUrl`, `crm_db`.`Association`.`streetAddress`, `crm_db`.`Association`.`postalCode`, `crm_db`.`Association`.`city`, `crm_db`.`Association`.`email`, `crm_db`.`Association`.`phone`, `crm_db`.`Association`.`description`, `crm_db`.`Association`.`descriptionFreeText`, `crm_db`.`Association`.`crmStatus`, `crm_db`.`Association`.`isMember`, `crm_db`.`Association`.`memberSince`, `crm_db`.`Association`.`pipeline`, `crm_db`.`Association`.`assignedToId`, `crm_db`.`Association`.`listPageIndex`, `crm_db`.`Association`.`positionOnPage`, `crm_db`.`Association`.`paginationModel`, `crm_db`.`Association`.`filterState`, `crm_db`.`Association`.`extras`, `crm_db`.`Association`.`createdAt`, `crm_db`.`Association`.`updatedAt`, `crm_db`.`Association`.`importBatchId`, `crm_db`.`Association`.`deletedAt`, `crm_db`.`Association`.`isDeleted`, COALESCE(`aggr_selection_0_Contact`.`_aggr_count_contacts`, 0) AS `_aggr_count_contacts`, COALESCE(`aggr_selection_1_Note`.`_aggr_count_notes`, 0) AS `_aggr_count_notes` FROM `crm_db`.`Association` LEFT JOIN (SELECT `crm_db`.`Contact`.`associationId`, COUNT(*) AS `_aggr_count_contacts` FROM `crm_db`.`Contact` WHERE 1=1 GROUP BY `crm_db`.`Contact`.`associationId`) AS `aggr_selection_0_Contact` ON (`crm_db`.`Association`.`id` = `aggr_selection_0_Contact`.`associationId`) LEFT JOIN (SELECT `crm_db`.`Note`.`associationId`, COUNT(*) AS `_aggr_count_notes` FROM `crm_db`.`Note` WHERE 1=1 GROUP BY `crm_db`.`Note`.`associationId`) AS `aggr_selection_1_Note` ON (`crm_db`.`Association`.`id` = `aggr_selection_1_Note`.`associationId`) WHERE (`crm_db`.`Association`.`municipality` = ? AND `crm_db`.`Association`.`municipalityId` = ? AND (`crm_db`.`Association`.`name` LIKE ? OR `crm_db`.`Association`.`orgNumber` LIKE ? OR `crm_db`.`Association`.`streetAddress` LIKE ? OR `crm_db`.`Association`.`city` LIKE ? OR `crm_db`.`Association`.`municipality` LIKE ? OR `crm_db`.`Association`.`email` LIKE ? OR `crm_db`.`Association`.`phone` LIKE ? OR `crm_db`.`Association`.`homepageUrl` LIKE ? OR `crm_db`.`Association`.`descriptionFreeText` LIKE ? OR `crm_db`.`Association`.`sourceSystem` LIKE ? OR EXISTS(SELECT `t0`.`A` FROM `crm_db`.`_AssociationTags` AS `t0` INNER JOIN `crm_db`.`Tag` AS `j0` ON (`j0`.`id`) = (`t0`.`B`) WHERE (`j0`.`name` LIKE ? AND (`crm_db`.`Association`.`id`) = (`t0`.`A`) AND `t0`.`A` IS NOT NULL)) OR EXISTS(SELECT `t1`.`associationId` FROM `crm_db`.`Contact` AS `t1` WHERE ((`t1`.`name` LIKE ? OR `t1`.`role` LIKE ? OR `t1`.`email` LIKE ? OR `t1`.`phone` LIKE ? OR `t1`.`mobile` LIKE ?) AND (`crm_db`.`Association`.`id`) = (`t1`.`associationId`) AND `t1`.`associationId` IS NOT NULL)))) ORDER BY `crm_db`.`Association`.`updatedAt` DESC LIMIT ? OFFSET ?
2025-10-28 09:14:49.834 | prisma:query SELECT `crm_db`.`Contact`.`id`, `crm_db`.`Contact`.`associationId`, `crm_db`.`Contact`.`name`, `crm_db`.`Contact`.`role`, `crm_db`.`Contact`.`email`, `crm_db`.`Contact`.`phone`, `crm_db`.`Contact`.`mobile`, `crm_db`.`Contact`.`linkedinUrl`, `crm_db`.`Contact`.`facebookUrl`, `crm_db`.`Contact`.`twitterUrl`, `crm_db`.`Contact`.`instagramUrl`, `crm_db`.`Contact`.`isPrimary`, `crm_db`.`Contact`.`createdAt`, `crm_db`.`Contact`.`updatedAt` FROM `crm_db`.`Contact` WHERE (`crm_db`.`Contact`.`isPrimary` = ? AND `crm_db`.`Contact`.`associationId` IN (?,?,?,?,?,?,?,?,?,?)) ORDER BY `crm_db`.`Contact`.`id` ASC
2025-10-28 09:14:49.834 | prisma:query SELECT `crm_db`.`_AssociationTags`.`A`, `crm_db`.`_AssociationTags`.`B` FROM `crm_db`.`_AssociationTags` WHERE `crm_db`.`_AssociationTags`.`A` IN (?,?,?,?,?,?,?,?,?,?)
2025-10-28 09:14:49.835 | prisma:query SELECT `crm_db`.`Activity`.`id`, `crm_db`.`Activity`.`associationId`, `crm_db`.`Activity`.`type`, `crm_db`.`Activity`.`description`, `crm_db`.`Activity`.`metadata`, `crm_db`.`Activity`.`userId`, `crm_db`.`Activity`.`userName`, `crm_db`.`Activity`.`createdAt` FROM `crm_db`.`Activity` WHERE `crm_db`.`Activity`.`associationId` IN (?,?,?,?,?,?,?,?,?,?) ORDER BY `crm_db`.`Activity`.`createdAt` DESC
2025-10-28 09:14:49.841 |  GET /api/trpc/association.list?batch=1&input=%7B%220%22%3A%7B%22json%22%3A%7B%22page%22%3A1%2C%22limit%22%3A10%2C%22search%22%3A%22fotbo%22%2C%22crmStatuses%22%3Anull%2C%22pipelines%22%3Anull%2C%22types%22%3Anull%2C%22activities%22%3Anull%2C%22tags%22%3Anull%2C%22hasEmail%22%3Anull%2C%22hasPhone%22%3Anull%2C%22isMember%22%3Anull%2C%22assignedToId%22%3Anull%2C%22municipality%22%3A%22V%C3%A4ster%C3%A5s%22%2C%22municipalityId%22%3A%22cmh3mc2h3006jb5ckrxvvd1o9%22%2C%22dateRange%22%3Anull%2C%22lastActivityDays%22%3Anull%2C%22sortBy%22%3A%22updatedAt%22%2C%22sortDirection%22%3A%22desc%22%2C%22useSearchIndex%22%3Afalse%7D%2C%22meta%22%3A%7B%22values%22%3A%7B%22crmStatuses%22%3A%5B%22undefined%22%5D%2C%22pipelines%22%3A%5B%22undefined%22%5D%2C%22types%22%3A%5B%22undefined%22%5D%2C%22activities%22%3A%5B%22undefined%22%5D%2C%22tags%22%3A%5B%22undefined%22%5D%2C%22hasEmail%22%3A%5B%22undefined%22%5D%2C%22hasPhone%22%3A%5B%22undefined%22%5D%2C%22isMember%22%3A%5B%22undefined%22%5D%2C%22assignedToId%22%3A%5B%22undefined%22%5D%2C%22dateRange%22%3A%5B%22undefined%22%5D%2C%22lastActivityDays%22%3A%5B%22undefined%22%5D%7D%2C%22v%22%3A1%7D%7D%7D 200 in 136ms
2025-10-28 09:14:50.012 | prisma:query SELECT COUNT(*) AS `_count$_all` FROM (SELECT `crm_db`.`Association`.`id` FROM `crm_db`.`Association` WHERE (`crm_db`.`Association`.`municipality` = ? AND `crm_db`.`Association`.`municipalityId` = ? AND (`crm_db`.`Association`.`name` LIKE ? OR `crm_db`.`Association`.`orgNumber` LIKE ? OR `crm_db`.`Association`.`streetAddress` LIKE ? OR `crm_db`.`Association`.`city` LIKE ? OR `crm_db`.`Association`.`municipality` LIKE ? OR `crm_db`.`Association`.`email` LIKE ? OR `crm_db`.`Association`.`phone` LIKE ? OR `crm_db`.`Association`.`homepageUrl` LIKE ? OR `crm_db`.`Association`.`descriptionFreeText` LIKE ? OR `crm_db`.`Association`.`sourceSystem` LIKE ? OR EXISTS(SELECT `t0`.`A` FROM `crm_db`.`_AssociationTags` AS `t0` INNER JOIN `crm_db`.`Tag` AS `j0` ON (`j0`.`id`) = (`t0`.`B`) WHERE (`j0`.`name` LIKE ? AND (`crm_db`.`Association`.`id`) = (`t0`.`A`) AND `t0`.`A` IS NOT NULL)) OR EXISTS(SELECT `t1`.`associationId` FROM `crm_db`.`Contact` AS `t1` WHERE ((`t1`.`name` LIKE ? OR `t1`.`role` LIKE ? OR `t1`.`email` LIKE ? OR `t1`.`phone` LIKE ? OR `t1`.`mobile` LIKE ?) AND (`crm_db`.`Association`.`id`) = (`t1`.`associationId`) AND `t1`.`associationId` IS NOT NULL))))) AS `sub`
2025-10-28 09:14:50.056 | prisma:query SELECT `crm_db`.`Association`.`id`, `crm_db`.`Association`.`sourceSystem`, `crm_db`.`Association`.`municipalityId`, `crm_db`.`Association`.`municipality`, `crm_db`.`Association`.`scrapeRunId`, `crm_db`.`Association`.`scrapedAt`, `crm_db`.`Association`.`detailUrl`, `crm_db`.`Association`.`name`, `crm_db`.`Association`.`orgNumber`, `crm_db`.`Association`.`types`, `crm_db`.`Association`.`activities`, `crm_db`.`Association`.`categories`, `crm_db`.`Association`.`homepageUrl`, `crm_db`.`Association`.`streetAddress`, `crm_db`.`Association`.`postalCode`, `crm_db`.`Association`.`city`, `crm_db`.`Association`.`email`, `crm_db`.`Association`.`phone`, `crm_db`.`Association`.`description`, `crm_db`.`Association`.`descriptionFreeText`, `crm_db`.`Association`.`crmStatus`, `crm_db`.`Association`.`isMember`, `crm_db`.`Association`.`memberSince`, `crm_db`.`Association`.`pipeline`, `crm_db`.`Association`.`assignedToId`, `crm_db`.`Association`.`listPageIndex`, `crm_db`.`Association`.`positionOnPage`, `crm_db`.`Association`.`paginationModel`, `crm_db`.`Association`.`filterState`, `crm_db`.`Association`.`extras`, `crm_db`.`Association`.`createdAt`, `crm_db`.`Association`.`updatedAt`, `crm_db`.`Association`.`importBatchId`, `crm_db`.`Association`.`deletedAt`, `crm_db`.`Association`.`isDeleted`, COALESCE(`aggr_selection_0_Contact`.`_aggr_count_contacts`, 0) AS `_aggr_count_contacts`, COALESCE(`aggr_selection_1_Note`.`_aggr_count_notes`, 0) AS `_aggr_count_notes` FROM `crm_db`.`Association` LEFT JOIN (SELECT `crm_db`.`Contact`.`associationId`, COUNT(*) AS `_aggr_count_contacts` FROM `crm_db`.`Contact` WHERE 1=1 GROUP BY `crm_db`.`Contact`.`associationId`) AS `aggr_selection_0_Contact` ON (`crm_db`.`Association`.`id` = `aggr_selection_0_Contact`.`associationId`) LEFT JOIN (SELECT `crm_db`.`Note`.`associationId`, COUNT(*) AS `_aggr_count_notes` FROM `crm_db`.`Note` WHERE 1=1 GROUP BY `crm_db`.`Note`.`associationId`) AS `aggr_selection_1_Note` ON (`crm_db`.`Association`.`id` = `aggr_selection_1_Note`.`associationId`) WHERE (`crm_db`.`Association`.`municipality` = ? AND `crm_db`.`Association`.`municipalityId` = ? AND (`crm_db`.`Association`.`name` LIKE ? OR `crm_db`.`Association`.`orgNumber` LIKE ? OR `crm_db`.`Association`.`streetAddress` LIKE ? OR `crm_db`.`Association`.`city` LIKE ? OR `crm_db`.`Association`.`municipality` LIKE ? OR `crm_db`.`Association`.`email` LIKE ? OR `crm_db`.`Association`.`phone` LIKE ? OR `crm_db`.`Association`.`homepageUrl` LIKE ? OR `crm_db`.`Association`.`descriptionFreeText` LIKE ? OR `crm_db`.`Association`.`sourceSystem` LIKE ? OR EXISTS(SELECT `t0`.`A` FROM `crm_db`.`_AssociationTags` AS `t0` INNER JOIN `crm_db`.`Tag` AS `j0` ON (`j0`.`id`) = (`t0`.`B`) WHERE (`j0`.`name` LIKE ? AND (`crm_db`.`Association`.`id`) = (`t0`.`A`) AND `t0`.`A` IS NOT NULL)) OR EXISTS(SELECT `t1`.`associationId` FROM `crm_db`.`Contact` AS `t1` WHERE ((`t1`.`name` LIKE ? OR `t1`.`role` LIKE ? OR `t1`.`email` LIKE ? OR `t1`.`phone` LIKE ? OR `t1`.`mobile` LIKE ?) AND (`crm_db`.`Association`.`id`) = (`t1`.`associationId`) AND `t1`.`associationId` IS NOT NULL)))) ORDER BY `crm_db`.`Association`.`updatedAt` DESC LIMIT ? OFFSET ?
2025-10-28 09:14:50.057 | prisma:query SELECT `crm_db`.`Contact`.`id`, `crm_db`.`Contact`.`associationId`, `crm_db`.`Contact`.`name`, `crm_db`.`Contact`.`role`, `crm_db`.`Contact`.`email`, `crm_db`.`Contact`.`phone`, `crm_db`.`Contact`.`mobile`, `crm_db`.`Contact`.`linkedinUrl`, `crm_db`.`Contact`.`facebookUrl`, `crm_db`.`Contact`.`twitterUrl`, `crm_db`.`Contact`.`instagramUrl`, `crm_db`.`Contact`.`isPrimary`, `crm_db`.`Contact`.`createdAt`, `crm_db`.`Contact`.`updatedAt` FROM `crm_db`.`Contact` WHERE (`crm_db`.`Contact`.`isPrimary` = ? AND `crm_db`.`Contact`.`associationId` IN (?,?,?,?,?,?,?,?,?,?)) ORDER BY `crm_db`.`Contact`.`id` ASC
2025-10-28 09:14:50.057 | prisma:query SELECT `crm_db`.`_AssociationTags`.`A`, `crm_db`.`_AssociationTags`.`B` FROM `crm_db`.`_AssociationTags` WHERE `crm_db`.`_AssociationTags`.`A` IN (?,?,?,?,?,?,?,?,?,?)
2025-10-28 09:14:50.058 | prisma:query SELECT `crm_db`.`Activity`.`id`, `crm_db`.`Activity`.`associationId`, `crm_db`.`Activity`.`type`, `crm_db`.`Activity`.`description`, `crm_db`.`Activity`.`metadata`, `crm_db`.`Activity`.`userId`, `crm_db`.`Activity`.`userName`, `crm_db`.`Activity`.`createdAt` FROM `crm_db`.`Activity` WHERE `crm_db`.`Activity`.`associationId` IN (?,?,?,?,?,?,?,?,?,?) ORDER BY `crm_db`.`Activity`.`createdAt` DESC
2025-10-28 09:14:50.063 |  GET /api/trpc/association.list?batch=1&input=%7B%220%22%3A%7B%22json%22%3A%7B%22page%22%3A1%2C%22limit%22%3A10%2C%22search%22%3A%22fotbol%22%2C%22crmStatuses%22%3Anull%2C%22pipelines%22%3Anull%2C%22types%22%3Anull%2C%22activities%22%3Anull%2C%22tags%22%3Anull%2C%22hasEmail%22%3Anull%2C%22hasPhone%22%3Anull%2C%22isMember%22%3Anull%2C%22assignedToId%22%3Anull%2C%22municipality%22%3A%22V%C3%A4ster%C3%A5s%22%2C%22municipalityId%22%3A%22cmh3mc2h3006jb5ckrxvvd1o9%22%2C%22dateRange%22%3Anull%2C%22lastActivityDays%22%3Anull%2C%22sortBy%22%3A%22updatedAt%22%2C%22sortDirection%22%3A%22desc%22%2C%22useSearchIndex%22%3Afalse%7D%2C%22meta%22%3A%7B%22values%22%3A%7B%22crmStatuses%22%3A%5B%22undefined%22%5D%2C%22pipelines%22%3A%5B%22undefined%22%5D%2C%22types%22%3A%5B%22undefined%22%5D%2C%22activities%22%3A%5B%22undefined%22%5D%2C%22tags%22%3A%5B%22undefined%22%5D%2C%22hasEmail%22%3A%5B%22undefined%22%5D%2C%22hasPhone%22%3A%5B%22undefined%22%5D%2C%22isMember%22%3A%5B%22undefined%22%5D%2C%22assignedToId%22%3A%5B%22undefined%22%5D%2C%22dateRange%22%3A%5B%22undefined%22%5D%2C%22lastActivityDays%22%3A%5B%22undefined%22%5D%7D%2C%22v%22%3A1%7D%7D%7D 200 in 161ms
2025-10-28 09:14:50.104 | prisma:query SELECT COUNT(*) AS `_count$_all` FROM (SELECT `crm_db`.`Association`.`id` FROM `crm_db`.`Association` WHERE (`crm_db`.`Association`.`municipality` = ? AND `crm_db`.`Association`.`municipalityId` = ? AND (`crm_db`.`Association`.`name` LIKE ? OR `crm_db`.`Association`.`orgNumber` LIKE ? OR `crm_db`.`Association`.`streetAddress` LIKE ? OR `crm_db`.`Association`.`city` LIKE ? OR `crm_db`.`Association`.`municipality` LIKE ? OR `crm_db`.`Association`.`email` LIKE ? OR `crm_db`.`Association`.`phone` LIKE ? OR `crm_db`.`Association`.`homepageUrl` LIKE ? OR `crm_db`.`Association`.`descriptionFreeText` LIKE ? OR `crm_db`.`Association`.`sourceSystem` LIKE ? OR EXISTS(SELECT `t0`.`A` FROM `crm_db`.`_AssociationTags` AS `t0` INNER JOIN `crm_db`.`Tag` AS `j0` ON (`j0`.`id`) = (`t0`.`B`) WHERE (`j0`.`name` LIKE ? AND (`crm_db`.`Association`.`id`) = (`t0`.`A`) AND `t0`.`A` IS NOT NULL)) OR EXISTS(SELECT `t1`.`associationId` FROM `crm_db`.`Contact` AS `t1` WHERE ((`t1`.`name` LIKE ? OR `t1`.`role` LIKE ? OR `t1`.`email` LIKE ? OR `t1`.`phone` LIKE ? OR `t1`.`mobile` LIKE ?) AND (`crm_db`.`Association`.`id`) = (`t1`.`associationId`) AND `t1`.`associationId` IS NOT NULL))))) AS `sub`
2025-10-28 09:14:50.147 | prisma:query SELECT `crm_db`.`Association`.`id`, `crm_db`.`Association`.`sourceSystem`, `crm_db`.`Association`.`municipalityId`, `crm_db`.`Association`.`municipality`, `crm_db`.`Association`.`scrapeRunId`, `crm_db`.`Association`.`scrapedAt`, `crm_db`.`Association`.`detailUrl`, `crm_db`.`Association`.`name`, `crm_db`.`Association`.`orgNumber`, `crm_db`.`Association`.`types`, `crm_db`.`Association`.`activities`, `crm_db`.`Association`.`categories`, `crm_db`.`Association`.`homepageUrl`, `crm_db`.`Association`.`streetAddress`, `crm_db`.`Association`.`postalCode`, `crm_db`.`Association`.`city`, `crm_db`.`Association`.`email`, `crm_db`.`Association`.`phone`, `crm_db`.`Association`.`description`, `crm_db`.`Association`.`descriptionFreeText`, `crm_db`.`Association`.`crmStatus`, `crm_db`.`Association`.`isMember`, `crm_db`.`Association`.`memberSince`, `crm_db`.`Association`.`pipeline`, `crm_db`.`Association`.`assignedToId`, `crm_db`.`Association`.`listPageIndex`, `crm_db`.`Association`.`positionOnPage`, `crm_db`.`Association`.`paginationModel`, `crm_db`.`Association`.`filterState`, `crm_db`.`Association`.`extras`, `crm_db`.`Association`.`createdAt`, `crm_db`.`Association`.`updatedAt`, `crm_db`.`Association`.`importBatchId`, `crm_db`.`Association`.`deletedAt`, `crm_db`.`Association`.`isDeleted`, COALESCE(`aggr_selection_0_Contact`.`_aggr_count_contacts`, 0) AS `_aggr_count_contacts`, COALESCE(`aggr_selection_1_Note`.`_aggr_count_notes`, 0) AS `_aggr_count_notes` FROM `crm_db`.`Association` LEFT JOIN (SELECT `crm_db`.`Contact`.`associationId`, COUNT(*) AS `_aggr_count_contacts` FROM `crm_db`.`Contact` WHERE 1=1 GROUP BY `crm_db`.`Contact`.`associationId`) AS `aggr_selection_0_Contact` ON (`crm_db`.`Association`.`id` = `aggr_selection_0_Contact`.`associationId`) LEFT JOIN (SELECT `crm_db`.`Note`.`associationId`, COUNT(*) AS `_aggr_count_notes` FROM `crm_db`.`Note` WHERE 1=1 GROUP BY `crm_db`.`Note`.`associationId`) AS `aggr_selection_1_Note` ON (`crm_db`.`Association`.`id` = `aggr_selection_1_Note`.`associationId`) WHERE (`crm_db`.`Association`.`municipality` = ? AND `crm_db`.`Association`.`municipalityId` = ? AND (`crm_db`.`Association`.`name` LIKE ? OR `crm_db`.`Association`.`orgNumber` LIKE ? OR `crm_db`.`Association`.`streetAddress` LIKE ? OR `crm_db`.`Association`.`city` LIKE ? OR `crm_db`.`Association`.`municipality` LIKE ? OR `crm_db`.`Association`.`email` LIKE ? OR `crm_db`.`Association`.`phone` LIKE ? OR `crm_db`.`Association`.`homepageUrl` LIKE ? OR `crm_db`.`Association`.`descriptionFreeText` LIKE ? OR `crm_db`.`Association`.`sourceSystem` LIKE ? OR EXISTS(SELECT `t0`.`A` FROM `crm_db`.`_AssociationTags` AS `t0` INNER JOIN `crm_db`.`Tag` AS `j0` ON (`j0`.`id`) = (`t0`.`B`) WHERE (`j0`.`name` LIKE ? AND (`crm_db`.`Association`.`id`) = (`t0`.`A`) AND `t0`.`A` IS NOT NULL)) OR EXISTS(SELECT `t1`.`associationId` FROM `crm_db`.`Contact` AS `t1` WHERE ((`t1`.`name` LIKE ? OR `t1`.`role` LIKE ? OR `t1`.`email` LIKE ? OR `t1`.`phone` LIKE ? OR `t1`.`mobile` LIKE ?) AND (`crm_db`.`Association`.`id`) = (`t1`.`associationId`) AND `t1`.`associationId` IS NOT NULL)))) ORDER BY `crm_db`.`Association`.`updatedAt` DESC LIMIT ? OFFSET ?
2025-10-28 09:14:50.148 | prisma:query SELECT `crm_db`.`Contact`.`id`, `crm_db`.`Contact`.`associationId`, `crm_db`.`Contact`.`name`, `crm_db`.`Contact`.`role`, `crm_db`.`Contact`.`email`, `crm_db`.`Contact`.`phone`, `crm_db`.`Contact`.`mobile`, `crm_db`.`Contact`.`linkedinUrl`, `crm_db`.`Contact`.`facebookUrl`, `crm_db`.`Contact`.`twitterUrl`, `crm_db`.`Contact`.`instagramUrl`, `crm_db`.`Contact`.`isPrimary`, `crm_db`.`Contact`.`createdAt`, `crm_db`.`Contact`.`updatedAt` FROM `crm_db`.`Contact` WHERE (`crm_db`.`Contact`.`isPrimary` = ? AND `crm_db`.`Contact`.`associationId` IN (?,?,?,?,?,?,?,?,?,?)) ORDER BY `crm_db`.`Contact`.`id` ASC
2025-10-28 09:14:50.148 | prisma:query SELECT `crm_db`.`_AssociationTags`.`A`, `crm_db`.`_AssociationTags`.`B` FROM `crm_db`.`_AssociationTags` WHERE `crm_db`.`_AssociationTags`.`A` IN (?,?,?,?,?,?,?,?,?,?)
2025-10-28 09:14:50.149 | prisma:query SELECT `crm_db`.`Activity`.`id`, `crm_db`.`Activity`.`associationId`, `crm_db`.`Activity`.`type`, `crm_db`.`Activity`.`description`, `crm_db`.`Activity`.`metadata`, `crm_db`.`Activity`.`userId`, `crm_db`.`Activity`.`userName`, `crm_db`.`Activity`.`createdAt` FROM `crm_db`.`Activity` WHERE `crm_db`.`Activity`.`associationId` IN (?,?,?,?,?,?,?,?,?,?) ORDER BY `crm_db`.`Activity`.`createdAt` DESC
2025-10-28 09:14:50.154 |  GET /api/trpc/association.list?batch=1&input=%7B%220%22%3A%7B%22json%22%3A%7B%22page%22%3A1%2C%22limit%22%3A10%2C%22search%22%3A%22fotboll%22%2C%22crmStatuses%22%3Anull%2C%22pipelines%22%3Anull%2C%22types%22%3Anull%2C%22activities%22%3Anull%2C%22tags%22%3Anull%2C%22hasEmail%22%3Anull%2C%22hasPhone%22%3Anull%2C%22isMember%22%3Anull%2C%22assignedToId%22%3Anull%2C%22municipality%22%3A%22V%C3%A4ster%C3%A5s%22%2C%22municipalityId%22%3A%22cmh3mc2h3006jb5ckrxvvd1o9%22%2C%22dateRange%22%3Anull%2C%22lastActivityDays%22%3Anull%2C%22sortBy%22%3A%22updatedAt%22%2C%22sortDirection%22%3A%22desc%22%2C%22useSearchIndex%22%3Afalse%7D%2C%22meta%22%3A%7B%22values%22%3A%7B%22crmStatuses%22%3A%5B%22undefined%22%5D%2C%22pipelines%22%3A%5B%22undefined%22%5D%2C%22types%22%3A%5B%22undefined%22%5D%2C%22activities%22%3A%5B%22undefined%22%5D%2C%22tags%22%3A%5B%22undefined%22%5D%2C%22hasEmail%22%3A%5B%22undefined%22%5D%2C%22hasPhone%22%3A%5B%22undefined%22%5D%2C%22isMember%22%3A%5B%22undefined%22%5D%2C%22assignedToId%22%3A%5B%22undefined%22%5D%2C%22dateRange%22%3A%5B%22undefined%22%5D%2C%22lastActivityDays%22%3A%5B%22undefined%22%5D%7D%2C%22v%22%3A1%7D%7D%7D 200 in 129ms
2025-10-28 09:15:44.595 | prisma:query SELECT 1
2025-10-28 09:15:44.597 | prisma:query SELECT 1
2025-10-28 09:15:44.602 | prisma:query SELECT COUNT(*) AS `_count$_all` FROM (SELECT `crm_db`.`Association`.`id` FROM `crm_db`.`Association` WHERE (`crm_db`.`Association`.`municipality` = ? AND `crm_db`.`Association`.`municipalityId` = ? AND (`crm_db`.`Association`.`name` LIKE ? OR `crm_db`.`Association`.`orgNumber` LIKE ? OR `crm_db`.`Association`.`streetAddress` LIKE ? OR `crm_db`.`Association`.`city` LIKE ? OR `crm_db`.`Association`.`municipality` LIKE ? OR `crm_db`.`Association`.`email` LIKE ? OR `crm_db`.`Association`.`phone` LIKE ? OR `crm_db`.`Association`.`homepageUrl` LIKE ? OR `crm_db`.`Association`.`descriptionFreeText` LIKE ? OR `crm_db`.`Association`.`sourceSystem` LIKE ? OR EXISTS(SELECT `t0`.`A` FROM `crm_db`.`_AssociationTags` AS `t0` INNER JOIN `crm_db`.`Tag` AS `j0` ON (`j0`.`id`) = (`t0`.`B`) WHERE (`j0`.`name` LIKE ? AND (`crm_db`.`Association`.`id`) = (`t0`.`A`) AND `t0`.`A` IS NOT NULL)) OR EXISTS(SELECT `t1`.`associationId` FROM `crm_db`.`Contact` AS `t1` WHERE ((`t1`.`name` LIKE ? OR `t1`.`role` LIKE ? OR `t1`.`email` LIKE ? OR `t1`.`phone` LIKE ? OR `t1`.`mobile` LIKE ?) AND (`crm_db`.`Association`.`id`) = (`t1`.`associationId`) AND `t1`.`associationId` IS NOT NULL))))) AS `sub`
2025-10-28 09:15:44.681 | prisma:query SELECT `crm_db`.`Association`.`id`, `crm_db`.`Association`.`sourceSystem`, `crm_db`.`Association`.`municipalityId`, `crm_db`.`Association`.`municipality`, `crm_db`.`Association`.`scrapeRunId`, `crm_db`.`Association`.`scrapedAt`, `crm_db`.`Association`.`detailUrl`, `crm_db`.`Association`.`name`, `crm_db`.`Association`.`orgNumber`, `crm_db`.`Association`.`types`, `crm_db`.`Association`.`activities`, `crm_db`.`Association`.`categories`, `crm_db`.`Association`.`homepageUrl`, `crm_db`.`Association`.`streetAddress`, `crm_db`.`Association`.`postalCode`, `crm_db`.`Association`.`city`, `crm_db`.`Association`.`email`, `crm_db`.`Association`.`phone`, `crm_db`.`Association`.`description`, `crm_db`.`Association`.`descriptionFreeText`, `crm_db`.`Association`.`crmStatus`, `crm_db`.`Association`.`isMember`, `crm_db`.`Association`.`memberSince`, `crm_db`.`Association`.`pipeline`, `crm_db`.`Association`.`assignedToId`, `crm_db`.`Association`.`listPageIndex`, `crm_db`.`Association`.`positionOnPage`, `crm_db`.`Association`.`paginationModel`, `crm_db`.`Association`.`filterState`, `crm_db`.`Association`.`extras`, `crm_db`.`Association`.`createdAt`, `crm_db`.`Association`.`updatedAt`, `crm_db`.`Association`.`importBatchId`, `crm_db`.`Association`.`deletedAt`, `crm_db`.`Association`.`isDeleted`, COALESCE(`aggr_selection_0_Contact`.`_aggr_count_contacts`, 0) AS `_aggr_count_contacts`, COALESCE(`aggr_selection_1_Note`.`_aggr_count_notes`, 0) AS `_aggr_count_notes` FROM `crm_db`.`Association` LEFT JOIN (SELECT `crm_db`.`Contact`.`associationId`, COUNT(*) AS `_aggr_count_contacts` FROM `crm_db`.`Contact` WHERE 1=1 GROUP BY `crm_db`.`Contact`.`associationId`) AS `aggr_selection_0_Contact` ON (`crm_db`.`Association`.`id` = `aggr_selection_0_Contact`.`associationId`) LEFT JOIN (SELECT `crm_db`.`Note`.`associationId`, COUNT(*) AS `_aggr_count_notes` FROM `crm_db`.`Note` WHERE 1=1 GROUP BY `crm_db`.`Note`.`associationId`) AS `aggr_selection_1_Note` ON (`crm_db`.`Association`.`id` = `aggr_selection_1_Note`.`associationId`) WHERE (`crm_db`.`Association`.`municipality` = ? AND `crm_db`.`Association`.`municipalityId` = ? AND (`crm_db`.`Association`.`name` LIKE ? OR `crm_db`.`Association`.`orgNumber` LIKE ? OR `crm_db`.`Association`.`streetAddress` LIKE ? OR `crm_db`.`Association`.`city` LIKE ? OR `crm_db`.`Association`.`municipality` LIKE ? OR `crm_db`.`Association`.`email` LIKE ? OR `crm_db`.`Association`.`phone` LIKE ? OR `crm_db`.`Association`.`homepageUrl` LIKE ? OR `crm_db`.`Association`.`descriptionFreeText` LIKE ? OR `crm_db`.`Association`.`sourceSystem` LIKE ? OR EXISTS(SELECT `t0`.`A` FROM `crm_db`.`_AssociationTags` AS `t0` INNER JOIN `crm_db`.`Tag` AS `j0` ON (`j0`.`id`) = (`t0`.`B`) WHERE (`j0`.`name` LIKE ? AND (`crm_db`.`Association`.`id`) = (`t0`.`A`) AND `t0`.`A` IS NOT NULL)) OR EXISTS(SELECT `t1`.`associationId` FROM `crm_db`.`Contact` AS `t1` WHERE ((`t1`.`name` LIKE ? OR `t1`.`role` LIKE ? OR `t1`.`email` LIKE ? OR `t1`.`phone` LIKE ? OR `t1`.`mobile` LIKE ?) AND (`crm_db`.`Association`.`id`) = (`t1`.`associationId`) AND `t1`.`associationId` IS NOT NULL)))) ORDER BY `crm_db`.`Association`.`updatedAt` DESC LIMIT ? OFFSET ?
2025-10-28 09:15:44.683 | prisma:query SELECT `crm_db`.`Contact`.`id`, `crm_db`.`Contact`.`associationId`, `crm_db`.`Contact`.`name`, `crm_db`.`Contact`.`role`, `crm_db`.`Contact`.`email`, `crm_db`.`Contact`.`phone`, `crm_db`.`Contact`.`mobile`, `crm_db`.`Contact`.`linkedinUrl`, `crm_db`.`Contact`.`facebookUrl`, `crm_db`.`Contact`.`twitterUrl`, `crm_db`.`Contact`.`instagramUrl`, `crm_db`.`Contact`.`isPrimary`, `crm_db`.`Contact`.`createdAt`, `crm_db`.`Contact`.`updatedAt` FROM `crm_db`.`Contact` WHERE (`crm_db`.`Contact`.`isPrimary` = ? AND `crm_db`.`Contact`.`associationId` IN (?,?,?,?,?,?,?,?,?,?)) ORDER BY `crm_db`.`Contact`.`id` ASC
2025-10-28 09:15:44.684 | prisma:query SELECT `crm_db`.`_AssociationTags`.`A`, `crm_db`.`_AssociationTags`.`B` FROM `crm_db`.`_AssociationTags` WHERE `crm_db`.`_AssociationTags`.`A` IN (?,?,?,?,?,?,?,?,?,?)
2025-10-28 09:15:44.685 | prisma:query SELECT `crm_db`.`Activity`.`id`, `crm_db`.`Activity`.`associationId`, `crm_db`.`Activity`.`type`, `crm_db`.`Activity`.`description`, `crm_db`.`Activity`.`metadata`, `crm_db`.`Activity`.`userId`, `crm_db`.`Activity`.`userName`, `crm_db`.`Activity`.`createdAt` FROM `crm_db`.`Activity` WHERE `crm_db`.`Activity`.`associationId` IN (?,?,?,?,?,?,?,?,?,?) ORDER BY `crm_db`.`Activity`.`createdAt` DESC
2025-10-28 09:15:44.694 |  GET /api/trpc/association.list?batch=1&input=%7B%220%22%3A%7B%22json%22%3A%7B%22page%22%3A1%2C%22limit%22%3A10%2C%22search%22%3A%22b%22%2C%22crmStatuses%22%3Anull%2C%22pipelines%22%3Anull%2C%22types%22%3Anull%2C%22activities%22%3Anull%2C%22tags%22%3Anull%2C%22hasEmail%22%3Anull%2C%22hasPhone%22%3Anull%2C%22isMember%22%3Anull%2C%22assignedToId%22%3Anull%2C%22municipality%22%3A%22V%C3%A4ster%C3%A5s%22%2C%22municipalityId%22%3A%22cmh3mc2h3006jb5ckrxvvd1o9%22%2C%22dateRange%22%3Anull%2C%22lastActivityDays%22%3Anull%2C%22sortBy%22%3A%22updatedAt%22%2C%22sortDirection%22%3A%22desc%22%2C%22useSearchIndex%22%3Afalse%7D%2C%22meta%22%3A%7B%22values%22%3A%7B%22crmStatuses%22%3A%5B%22undefined%22%5D%2C%22pipelines%22%3A%5B%22undefined%22%5D%2C%22types%22%3A%5B%22undefined%22%5D%2C%22activities%22%3A%5B%22undefined%22%5D%2C%22tags%22%3A%5B%22undefined%22%5D%2C%22hasEmail%22%3A%5B%22undefined%22%5D%2C%22hasPhone%22%3A%5B%22undefined%22%5D%2C%22isMember%22%3A%5B%22undefined%22%5D%2C%22assignedToId%22%3A%5B%22undefined%22%5D%2C%22dateRange%22%3A%5B%22undefined%22%5D%2C%22lastActivityDays%22%3A%5B%22undefined%22%5D%7D%2C%22v%22%3A1%7D%7D%7D 200 in 201ms
2025-10-28 09:15:44.751 | prisma:query SELECT COUNT(*) AS `_count$_all` FROM (SELECT `crm_db`.`Association`.`id` FROM `crm_db`.`Association` WHERE (`crm_db`.`Association`.`municipality` = ? AND `crm_db`.`Association`.`municipalityId` = ? AND (`crm_db`.`Association`.`name` LIKE ? OR `crm_db`.`Association`.`orgNumber` LIKE ? OR `crm_db`.`Association`.`streetAddress` LIKE ? OR `crm_db`.`Association`.`city` LIKE ? OR `crm_db`.`Association`.`municipality` LIKE ? OR `crm_db`.`Association`.`email` LIKE ? OR `crm_db`.`Association`.`phone` LIKE ? OR `crm_db`.`Association`.`homepageUrl` LIKE ? OR `crm_db`.`Association`.`descriptionFreeText` LIKE ? OR `crm_db`.`Association`.`sourceSystem` LIKE ? OR EXISTS(SELECT `t0`.`A` FROM `crm_db`.`_AssociationTags` AS `t0` INNER JOIN `crm_db`.`Tag` AS `j0` ON (`j0`.`id`) = (`t0`.`B`) WHERE (`j0`.`name` LIKE ? AND (`crm_db`.`Association`.`id`) = (`t0`.`A`) AND `t0`.`A` IS NOT NULL)) OR EXISTS(SELECT `t1`.`associationId` FROM `crm_db`.`Contact` AS `t1` WHERE ((`t1`.`name` LIKE ? OR `t1`.`role` LIKE ? OR `t1`.`email` LIKE ? OR `t1`.`phone` LIKE ? OR `t1`.`mobile` LIKE ?) AND (`crm_db`.`Association`.`id`) = (`t1`.`associationId`) AND `t1`.`associationId` IS NOT NULL))))) AS `sub`
2025-10-28 09:15:44.806 | prisma:query SELECT `crm_db`.`Association`.`id`, `crm_db`.`Association`.`sourceSystem`, `crm_db`.`Association`.`municipalityId`, `crm_db`.`Association`.`municipality`, `crm_db`.`Association`.`scrapeRunId`, `crm_db`.`Association`.`scrapedAt`, `crm_db`.`Association`.`detailUrl`, `crm_db`.`Association`.`name`, `crm_db`.`Association`.`orgNumber`, `crm_db`.`Association`.`types`, `crm_db`.`Association`.`activities`, `crm_db`.`Association`.`categories`, `crm_db`.`Association`.`homepageUrl`, `crm_db`.`Association`.`streetAddress`, `crm_db`.`Association`.`postalCode`, `crm_db`.`Association`.`city`, `crm_db`.`Association`.`email`, `crm_db`.`Association`.`phone`, `crm_db`.`Association`.`description`, `crm_db`.`Association`.`descriptionFreeText`, `crm_db`.`Association`.`crmStatus`, `crm_db`.`Association`.`isMember`, `crm_db`.`Association`.`memberSince`, `crm_db`.`Association`.`pipeline`, `crm_db`.`Association`.`assignedToId`, `crm_db`.`Association`.`listPageIndex`, `crm_db`.`Association`.`positionOnPage`, `crm_db`.`Association`.`paginationModel`, `crm_db`.`Association`.`filterState`, `crm_db`.`Association`.`extras`, `crm_db`.`Association`.`createdAt`, `crm_db`.`Association`.`updatedAt`, `crm_db`.`Association`.`importBatchId`, `crm_db`.`Association`.`deletedAt`, `crm_db`.`Association`.`isDeleted`, COALESCE(`aggr_selection_0_Contact`.`_aggr_count_contacts`, 0) AS `_aggr_count_contacts`, COALESCE(`aggr_selection_1_Note`.`_aggr_count_notes`, 0) AS `_aggr_count_notes` FROM `crm_db`.`Association` LEFT JOIN (SELECT `crm_db`.`Contact`.`associationId`, COUNT(*) AS `_aggr_count_contacts` FROM `crm_db`.`Contact` WHERE 1=1 GROUP BY `crm_db`.`Contact`.`associationId`) AS `aggr_selection_0_Contact` ON (`crm_db`.`Association`.`id` = `aggr_selection_0_Contact`.`associationId`) LEFT JOIN (SELECT `crm_db`.`Note`.`associationId`, COUNT(*) AS `_aggr_count_notes` FROM `crm_db`.`Note` WHERE 1=1 GROUP BY `crm_db`.`Note`.`associationId`) AS `aggr_selection_1_Note` ON (`crm_db`.`Association`.`id` = `aggr_selection_1_Note`.`associationId`) WHERE (`crm_db`.`Association`.`municipality` = ? AND `crm_db`.`Association`.`municipalityId` = ? AND (`crm_db`.`Association`.`name` LIKE ? OR `crm_db`.`Association`.`orgNumber` LIKE ? OR `crm_db`.`Association`.`streetAddress` LIKE ? OR `crm_db`.`Association`.`city` LIKE ? OR `crm_db`.`Association`.`municipality` LIKE ? OR `crm_db`.`Association`.`email` LIKE ? OR `crm_db`.`Association`.`phone` LIKE ? OR `crm_db`.`Association`.`homepageUrl` LIKE ? OR `crm_db`.`Association`.`descriptionFreeText` LIKE ? OR `crm_db`.`Association`.`sourceSystem` LIKE ? OR EXISTS(SELECT `t0`.`A` FROM `crm_db`.`_AssociationTags` AS `t0` INNER JOIN `crm_db`.`Tag` AS `j0` ON (`j0`.`id`) = (`t0`.`B`) WHERE (`j0`.`name` LIKE ? AND (`crm_db`.`Association`.`id`) = (`t0`.`A`) AND `t0`.`A` IS NOT NULL)) OR EXISTS(SELECT `t1`.`associationId` FROM `crm_db`.`Contact` AS `t1` WHERE ((`t1`.`name` LIKE ? OR `t1`.`role` LIKE ? OR `t1`.`email` LIKE ? OR `t1`.`phone` LIKE ? OR `t1`.`mobile` LIKE ?) AND (`crm_db`.`Association`.`id`) = (`t1`.`associationId`) AND `t1`.`associationId` IS NOT NULL)))) ORDER BY `crm_db`.`Association`.`updatedAt` DESC LIMIT ? OFFSET ?
2025-10-28 09:15:44.807 | prisma:query SELECT `crm_db`.`Contact`.`id`, `crm_db`.`Contact`.`associationId`, `crm_db`.`Contact`.`name`, `crm_db`.`Contact`.`role`, `crm_db`.`Contact`.`email`, `crm_db`.`Contact`.`phone`, `crm_db`.`Contact`.`mobile`, `crm_db`.`Contact`.`linkedinUrl`, `crm_db`.`Contact`.`facebookUrl`, `crm_db`.`Contact`.`twitterUrl`, `crm_db`.`Contact`.`instagramUrl`, `crm_db`.`Contact`.`isPrimary`, `crm_db`.`Contact`.`createdAt`, `crm_db`.`Contact`.`updatedAt` FROM `crm_db`.`Contact` WHERE (`crm_db`.`Contact`.`isPrimary` = ? AND `crm_db`.`Contact`.`associationId` IN (?,?,?,?,?,?,?,?,?,?)) ORDER BY `crm_db`.`Contact`.`id` ASC
2025-10-28 09:15:44.808 | prisma:query SELECT `crm_db`.`_AssociationTags`.`A`, `crm_db`.`_AssociationTags`.`B` FROM `crm_db`.`_AssociationTags` WHERE `crm_db`.`_AssociationTags`.`A` IN (?,?,?,?,?,?,?,?,?,?)
2025-10-28 09:15:44.809 | prisma:query SELECT `crm_db`.`Activity`.`id`, `crm_db`.`Activity`.`associationId`, `crm_db`.`Activity`.`type`, `crm_db`.`Activity`.`description`, `crm_db`.`Activity`.`metadata`, `crm_db`.`Activity`.`userId`, `crm_db`.`Activity`.`userName`, `crm_db`.`Activity`.`createdAt` FROM `crm_db`.`Activity` WHERE `crm_db`.`Activity`.`associationId` IN (?,?,?,?,?,?,?,?,?,?) ORDER BY `crm_db`.`Activity`.`createdAt` DESC
2025-10-28 09:15:44.816 |  GET /api/trpc/association.list?batch=1&input=%7B%220%22%3A%7B%22json%22%3A%7B%22page%22%3A1%2C%22limit%22%3A10%2C%22search%22%3A%22ba%22%2C%22crmStatuses%22%3Anull%2C%22pipelines%22%3Anull%2C%22types%22%3Anull%2C%22activities%22%3Anull%2C%22tags%22%3Anull%2C%22hasEmail%22%3Anull%2C%22hasPhone%22%3Anull%2C%22isMember%22%3Anull%2C%22assignedToId%22%3Anull%2C%22municipality%22%3A%22V%C3%A4ster%C3%A5s%22%2C%22municipalityId%22%3A%22cmh3mc2h3006jb5ckrxvvd1o9%22%2C%22dateRange%22%3Anull%2C%22lastActivityDays%22%3Anull%2C%22sortBy%22%3A%22updatedAt%22%2C%22sortDirection%22%3A%22desc%22%2C%22useSearchIndex%22%3Afalse%7D%2C%22meta%22%3A%7B%22values%22%3A%7B%22crmStatuses%22%3A%5B%22undefined%22%5D%2C%22pipelines%22%3A%5B%22undefined%22%5D%2C%22types%22%3A%5B%22undefined%22%5D%2C%22activities%22%3A%5B%22undefined%22%5D%2C%22tags%22%3A%5B%22undefined%22%5D%2C%22hasEmail%22%3A%5B%22undefined%22%5D%2C%22hasPhone%22%3A%5B%22undefined%22%5D%2C%22isMember%22%3A%5B%22undefined%22%5D%2C%22assignedToId%22%3A%5B%22undefined%22%5D%2C%22dateRange%22%3A%5B%22undefined%22%5D%2C%22lastActivityDays%22%3A%5B%22undefined%22%5D%7D%2C%22v%22%3A1%7D%7D%7D 200 in 172ms
2025-10-28 09:15:44.890 | prisma:query SELECT COUNT(*) AS `_count$_all` FROM (SELECT `crm_db`.`Association`.`id` FROM `crm_db`.`Association` WHERE (`crm_db`.`Association`.`municipality` = ? AND `crm_db`.`Association`.`municipalityId` = ? AND (`crm_db`.`Association`.`name` LIKE ? OR `crm_db`.`Association`.`orgNumber` LIKE ? OR `crm_db`.`Association`.`streetAddress` LIKE ? OR `crm_db`.`Association`.`city` LIKE ? OR `crm_db`.`Association`.`municipality` LIKE ? OR `crm_db`.`Association`.`email` LIKE ? OR `crm_db`.`Association`.`phone` LIKE ? OR `crm_db`.`Association`.`homepageUrl` LIKE ? OR `crm_db`.`Association`.`descriptionFreeText` LIKE ? OR `crm_db`.`Association`.`sourceSystem` LIKE ? OR EXISTS(SELECT `t0`.`A` FROM `crm_db`.`_AssociationTags` AS `t0` INNER JOIN `crm_db`.`Tag` AS `j0` ON (`j0`.`id`) = (`t0`.`B`) WHERE (`j0`.`name` LIKE ? AND (`crm_db`.`Association`.`id`) = (`t0`.`A`) AND `t0`.`A` IS NOT NULL)) OR EXISTS(SELECT `t1`.`associationId` FROM `crm_db`.`Contact` AS `t1` WHERE ((`t1`.`name` LIKE ? OR `t1`.`role` LIKE ? OR `t1`.`email` LIKE ? OR `t1`.`phone` LIKE ? OR `t1`.`mobile` LIKE ?) AND (`crm_db`.`Association`.`id`) = (`t1`.`associationId`) AND `t1`.`associationId` IS NOT NULL))))) AS `sub`
2025-10-28 09:15:44.943 | prisma:query SELECT `crm_db`.`Association`.`id`, `crm_db`.`Association`.`sourceSystem`, `crm_db`.`Association`.`municipalityId`, `crm_db`.`Association`.`municipality`, `crm_db`.`Association`.`scrapeRunId`, `crm_db`.`Association`.`scrapedAt`, `crm_db`.`Association`.`detailUrl`, `crm_db`.`Association`.`name`, `crm_db`.`Association`.`orgNumber`, `crm_db`.`Association`.`types`, `crm_db`.`Association`.`activities`, `crm_db`.`Association`.`categories`, `crm_db`.`Association`.`homepageUrl`, `crm_db`.`Association`.`streetAddress`, `crm_db`.`Association`.`postalCode`, `crm_db`.`Association`.`city`, `crm_db`.`Association`.`email`, `crm_db`.`Association`.`phone`, `crm_db`.`Association`.`description`, `crm_db`.`Association`.`descriptionFreeText`, `crm_db`.`Association`.`crmStatus`, `crm_db`.`Association`.`isMember`, `crm_db`.`Association`.`memberSince`, `crm_db`.`Association`.`pipeline`, `crm_db`.`Association`.`assignedToId`, `crm_db`.`Association`.`listPageIndex`, `crm_db`.`Association`.`positionOnPage`, `crm_db`.`Association`.`paginationModel`, `crm_db`.`Association`.`filterState`, `crm_db`.`Association`.`extras`, `crm_db`.`Association`.`createdAt`, `crm_db`.`Association`.`updatedAt`, `crm_db`.`Association`.`importBatchId`, `crm_db`.`Association`.`deletedAt`, `crm_db`.`Association`.`isDeleted`, COALESCE(`aggr_selection_0_Contact`.`_aggr_count_contacts`, 0) AS `_aggr_count_contacts`, COALESCE(`aggr_selection_1_Note`.`_aggr_count_notes`, 0) AS `_aggr_count_notes` FROM `crm_db`.`Association` LEFT JOIN (SELECT `crm_db`.`Contact`.`associationId`, COUNT(*) AS `_aggr_count_contacts` FROM `crm_db`.`Contact` WHERE 1=1 GROUP BY `crm_db`.`Contact`.`associationId`) AS `aggr_selection_0_Contact` ON (`crm_db`.`Association`.`id` = `aggr_selection_0_Contact`.`associationId`) LEFT JOIN (SELECT `crm_db`.`Note`.`associationId`, COUNT(*) AS `_aggr_count_notes` FROM `crm_db`.`Note` WHERE 1=1 GROUP BY `crm_db`.`Note`.`associationId`) AS `aggr_selection_1_Note` ON (`crm_db`.`Association`.`id` = `aggr_selection_1_Note`.`associationId`) WHERE (`crm_db`.`Association`.`municipality` = ? AND `crm_db`.`Association`.`municipalityId` = ? AND (`crm_db`.`Association`.`name` LIKE ? OR `crm_db`.`Association`.`orgNumber` LIKE ? OR `crm_db`.`Association`.`streetAddress` LIKE ? OR `crm_db`.`Association`.`city` LIKE ? OR `crm_db`.`Association`.`municipality` LIKE ? OR `crm_db`.`Association`.`email` LIKE ? OR `crm_db`.`Association`.`phone` LIKE ? OR `crm_db`.`Association`.`homepageUrl` LIKE ? OR `crm_db`.`Association`.`descriptionFreeText` LIKE ? OR `crm_db`.`Association`.`sourceSystem` LIKE ? OR EXISTS(SELECT `t0`.`A` FROM `crm_db`.`_AssociationTags` AS `t0` INNER JOIN `crm_db`.`Tag` AS `j0` ON (`j0`.`id`) = (`t0`.`B`) WHERE (`j0`.`name` LIKE ? AND (`crm_db`.`Association`.`id`) = (`t0`.`A`) AND `t0`.`A` IS NOT NULL)) OR EXISTS(SELECT `t1`.`associationId` FROM `crm_db`.`Contact` AS `t1` WHERE ((`t1`.`name` LIKE ? OR `t1`.`role` LIKE ? OR `t1`.`email` LIKE ? OR `t1`.`phone` LIKE ? OR `t1`.`mobile` LIKE ?) AND (`crm_db`.`Association`.`id`) = (`t1`.`associationId`) AND `t1`.`associationId` IS NOT NULL)))) ORDER BY `crm_db`.`Association`.`updatedAt` DESC LIMIT ? OFFSET ?
2025-10-28 09:15:44.944 | prisma:query SELECT `crm_db`.`Contact`.`id`, `crm_db`.`Contact`.`associationId`, `crm_db`.`Contact`.`name`, `crm_db`.`Contact`.`role`, `crm_db`.`Contact`.`email`, `crm_db`.`Contact`.`phone`, `crm_db`.`Contact`.`mobile`, `crm_db`.`Contact`.`linkedinUrl`, `crm_db`.`Contact`.`facebookUrl`, `crm_db`.`Contact`.`twitterUrl`, `crm_db`.`Contact`.`instagramUrl`, `crm_db`.`Contact`.`isPrimary`, `crm_db`.`Contact`.`createdAt`, `crm_db`.`Contact`.`updatedAt` FROM `crm_db`.`Contact` WHERE (`crm_db`.`Contact`.`isPrimary` = ? AND `crm_db`.`Contact`.`associationId` IN (?,?,?,?,?,?,?,?)) ORDER BY `crm_db`.`Contact`.`id` ASC
2025-10-28 09:15:44.945 | prisma:query SELECT `crm_db`.`_AssociationTags`.`A`, `crm_db`.`_AssociationTags`.`B` FROM `crm_db`.`_AssociationTags` WHERE `crm_db`.`_AssociationTags`.`A` IN (?,?,?,?,?,?,?,?)
2025-10-28 09:15:44.946 | prisma:query SELECT `crm_db`.`Activity`.`id`, `crm_db`.`Activity`.`associationId`, `crm_db`.`Activity`.`type`, `crm_db`.`Activity`.`description`, `crm_db`.`Activity`.`metadata`, `crm_db`.`Activity`.`userId`, `crm_db`.`Activity`.`userName`, `crm_db`.`Activity`.`createdAt` FROM `crm_db`.`Activity` WHERE `crm_db`.`Activity`.`associationId` IN (?,?,?,?,?,?,?,?) ORDER BY `crm_db`.`Activity`.`createdAt` DESC
2025-10-28 09:15:44.951 |  GET /api/trpc/association.list?batch=1&input=%7B%220%22%3A%7B%22json%22%3A%7B%22page%22%3A1%2C%22limit%22%3A10%2C%22search%22%3A%22bas%22%2C%22crmStatuses%22%3Anull%2C%22pipelines%22%3Anull%2C%22types%22%3Anull%2C%22activities%22%3Anull%2C%22tags%22%3Anull%2C%22hasEmail%22%3Anull%2C%22hasPhone%22%3Anull%2C%22isMember%22%3Anull%2C%22assignedToId%22%3Anull%2C%22municipality%22%3A%22V%C3%A4ster%C3%A5s%22%2C%22municipalityId%22%3A%22cmh3mc2h3006jb5ckrxvvd1o9%22%2C%22dateRange%22%3Anull%2C%22lastActivityDays%22%3Anull%2C%22sortBy%22%3A%22updatedAt%22%2C%22sortDirection%22%3A%22desc%22%2C%22useSearchIndex%22%3Afalse%7D%2C%22meta%22%3A%7B%22values%22%3A%7B%22crmStatuses%22%3A%5B%22undefined%22%5D%2C%22pipelines%22%3A%5B%22undefined%22%5D%2C%22types%22%3A%5B%22undefined%22%5D%2C%22activities%22%3A%5B%22undefined%22%5D%2C%22tags%22%3A%5B%22undefined%22%5D%2C%22hasEmail%22%3A%5B%22undefined%22%5D%2C%22hasPhone%22%3A%5B%22undefined%22%5D%2C%22isMember%22%3A%5B%22undefined%22%5D%2C%22assignedToId%22%3A%5B%22undefined%22%5D%2C%22dateRange%22%3A%5B%22undefined%22%5D%2C%22lastActivityDays%22%3A%5B%22undefined%22%5D%7D%2C%22v%22%3A1%7D%7D%7D 200 in 147ms
2025-10-28 09:15:45.119 | prisma:query SELECT COUNT(*) AS `_count$_all` FROM (SELECT `crm_db`.`Association`.`id` FROM `crm_db`.`Association` WHERE (`crm_db`.`Association`.`municipality` = ? AND `crm_db`.`Association`.`municipalityId` = ? AND (`crm_db`.`Association`.`name` LIKE ? OR `crm_db`.`Association`.`orgNumber` LIKE ? OR `crm_db`.`Association`.`streetAddress` LIKE ? OR `crm_db`.`Association`.`city` LIKE ? OR `crm_db`.`Association`.`municipality` LIKE ? OR `crm_db`.`Association`.`email` LIKE ? OR `crm_db`.`Association`.`phone` LIKE ? OR `crm_db`.`Association`.`homepageUrl` LIKE ? OR `crm_db`.`Association`.`descriptionFreeText` LIKE ? OR `crm_db`.`Association`.`sourceSystem` LIKE ? OR EXISTS(SELECT `t0`.`A` FROM `crm_db`.`_AssociationTags` AS `t0` INNER JOIN `crm_db`.`Tag` AS `j0` ON (`j0`.`id`) = (`t0`.`B`) WHERE (`j0`.`name` LIKE ? AND (`crm_db`.`Association`.`id`) = (`t0`.`A`) AND `t0`.`A` IS NOT NULL)) OR EXISTS(SELECT `t1`.`associationId` FROM `crm_db`.`Contact` AS `t1` WHERE ((`t1`.`name` LIKE ? OR `t1`.`role` LIKE ? OR `t1`.`email` LIKE ? OR `t1`.`phone` LIKE ? OR `t1`.`mobile` LIKE ?) AND (`crm_db`.`Association`.`id`) = (`t1`.`associationId`) AND `t1`.`associationId` IS NOT NULL))))) AS `sub`
2025-10-28 09:15:45.166 | prisma:query SELECT `crm_db`.`Association`.`id`, `crm_db`.`Association`.`sourceSystem`, `crm_db`.`Association`.`municipalityId`, `crm_db`.`Association`.`municipality`, `crm_db`.`Association`.`scrapeRunId`, `crm_db`.`Association`.`scrapedAt`, `crm_db`.`Association`.`detailUrl`, `crm_db`.`Association`.`name`, `crm_db`.`Association`.`orgNumber`, `crm_db`.`Association`.`types`, `crm_db`.`Association`.`activities`, `crm_db`.`Association`.`categories`, `crm_db`.`Association`.`homepageUrl`, `crm_db`.`Association`.`streetAddress`, `crm_db`.`Association`.`postalCode`, `crm_db`.`Association`.`city`, `crm_db`.`Association`.`email`, `crm_db`.`Association`.`phone`, `crm_db`.`Association`.`description`, `crm_db`.`Association`.`descriptionFreeText`, `crm_db`.`Association`.`crmStatus`, `crm_db`.`Association`.`isMember`, `crm_db`.`Association`.`memberSince`, `crm_db`.`Association`.`pipeline`, `crm_db`.`Association`.`assignedToId`, `crm_db`.`Association`.`listPageIndex`, `crm_db`.`Association`.`positionOnPage`, `crm_db`.`Association`.`paginationModel`, `crm_db`.`Association`.`filterState`, `crm_db`.`Association`.`extras`, `crm_db`.`Association`.`createdAt`, `crm_db`.`Association`.`updatedAt`, `crm_db`.`Association`.`importBatchId`, `crm_db`.`Association`.`deletedAt`, `crm_db`.`Association`.`isDeleted`, COALESCE(`aggr_selection_0_Contact`.`_aggr_count_contacts`, 0) AS `_aggr_count_contacts`, COALESCE(`aggr_selection_1_Note`.`_aggr_count_notes`, 0) AS `_aggr_count_notes` FROM `crm_db`.`Association` LEFT JOIN (SELECT `crm_db`.`Contact`.`associationId`, COUNT(*) AS `_aggr_count_contacts` FROM `crm_db`.`Contact` WHERE 1=1 GROUP BY `crm_db`.`Contact`.`associationId`) AS `aggr_selection_0_Contact` ON (`crm_db`.`Association`.`id` = `aggr_selection_0_Contact`.`associationId`) LEFT JOIN (SELECT `crm_db`.`Note`.`associationId`, COUNT(*) AS `_aggr_count_notes` FROM `crm_db`.`Note` WHERE 1=1 GROUP BY `crm_db`.`Note`.`associationId`) AS `aggr_selection_1_Note` ON (`crm_db`.`Association`.`id` = `aggr_selection_1_Note`.`associationId`) WHERE (`crm_db`.`Association`.`municipality` = ? AND `crm_db`.`Association`.`municipalityId` = ? AND (`crm_db`.`Association`.`name` LIKE ? OR `crm_db`.`Association`.`orgNumber` LIKE ? OR `crm_db`.`Association`.`streetAddress` LIKE ? OR `crm_db`.`Association`.`city` LIKE ? OR `crm_db`.`Association`.`municipality` LIKE ? OR `crm_db`.`Association`.`email` LIKE ? OR `crm_db`.`Association`.`phone` LIKE ? OR `crm_db`.`Association`.`homepageUrl` LIKE ? OR `crm_db`.`Association`.`descriptionFreeText` LIKE ? OR `crm_db`.`Association`.`sourceSystem` LIKE ? OR EXISTS(SELECT `t0`.`A` FROM `crm_db`.`_AssociationTags` AS `t0` INNER JOIN `crm_db`.`Tag` AS `j0` ON (`j0`.`id`) = (`t0`.`B`) WHERE (`j0`.`name` LIKE ? AND (`crm_db`.`Association`.`id`) = (`t0`.`A`) AND `t0`.`A` IS NOT NULL)) OR EXISTS(SELECT `t1`.`associationId` FROM `crm_db`.`Contact` AS `t1` WHERE ((`t1`.`name` LIKE ? OR `t1`.`role` LIKE ? OR `t1`.`email` LIKE ? OR `t1`.`phone` LIKE ? OR `t1`.`mobile` LIKE ?) AND (`crm_db`.`Association`.`id`) = (`t1`.`associationId`) AND `t1`.`associationId` IS NOT NULL)))) ORDER BY `crm_db`.`Association`.`updatedAt` DESC LIMIT ? OFFSET ?
2025-10-28 09:15:45.167 | prisma:query SELECT `crm_db`.`Contact`.`id`, `crm_db`.`Contact`.`associationId`, `crm_db`.`Contact`.`name`, `crm_db`.`Contact`.`role`, `crm_db`.`Contact`.`email`, `crm_db`.`Contact`.`phone`, `crm_db`.`Contact`.`mobile`, `crm_db`.`Contact`.`linkedinUrl`, `crm_db`.`Contact`.`facebookUrl`, `crm_db`.`Contact`.`twitterUrl`, `crm_db`.`Contact`.`instagramUrl`, `crm_db`.`Contact`.`isPrimary`, `crm_db`.`Contact`.`createdAt`, `crm_db`.`Contact`.`updatedAt` FROM `crm_db`.`Contact` WHERE (`crm_db`.`Contact`.`isPrimary` = ? AND `crm_db`.`Contact`.`associationId` IN (?,?,?,?)) ORDER BY `crm_db`.`Contact`.`id` ASC
2025-10-28 09:15:45.168 | prisma:query SELECT `crm_db`.`_AssociationTags`.`A`, `crm_db`.`_AssociationTags`.`B` FROM `crm_db`.`_AssociationTags` WHERE `crm_db`.`_AssociationTags`.`A` IN (?,?,?,?)
2025-10-28 09:15:45.169 | prisma:query SELECT `crm_db`.`Activity`.`id`, `crm_db`.`Activity`.`associationId`, `crm_db`.`Activity`.`type`, `crm_db`.`Activity`.`description`, `crm_db`.`Activity`.`metadata`, `crm_db`.`Activity`.`userId`, `crm_db`.`Activity`.`userName`, `crm_db`.`Activity`.`createdAt` FROM `crm_db`.`Activity` WHERE `crm_db`.`Activity`.`associationId` IN (?,?,?,?) ORDER BY `crm_db`.`Activity`.`createdAt` DESC
2025-10-28 09:15:45.173 |  GET /api/trpc/association.list?batch=1&input=%7B%220%22%3A%7B%22json%22%3A%7B%22page%22%3A1%2C%22limit%22%3A10%2C%22search%22%3A%22baske%22%2C%22crmStatuses%22%3Anull%2C%22pipelines%22%3Anull%2C%22types%22%3Anull%2C%22activities%22%3Anull%2C%22tags%22%3Anull%2C%22hasEmail%22%3Anull%2C%22hasPhone%22%3Anull%2C%22isMember%22%3Anull%2C%22assignedToId%22%3Anull%2C%22municipality%22%3A%22V%C3%A4ster%C3%A5s%22%2C%22municipalityId%22%3A%22cmh3mc2h3006jb5ckrxvvd1o9%22%2C%22dateRange%22%3Anull%2C%22lastActivityDays%22%3Anull%2C%22sortBy%22%3A%22updatedAt%22%2C%22sortDirection%22%3A%22desc%22%2C%22useSearchIndex%22%3Afalse%7D%2C%22meta%22%3A%7B%22values%22%3A%7B%22crmStatuses%22%3A%5B%22undefined%22%5D%2C%22pipelines%22%3A%5B%22undefined%22%5D%2C%22types%22%3A%5B%22undefined%22%5D%2C%22activities%22%3A%5B%22undefined%22%5D%2C%22tags%22%3A%5B%22undefined%22%5D%2C%22hasEmail%22%3A%5B%22undefined%22%5D%2C%22hasPhone%22%3A%5B%22undefined%22%5D%2C%22isMember%22%3A%5B%22undefined%22%5D%2C%22assignedToId%22%3A%5B%22undefined%22%5D%2C%22dateRange%22%3A%5B%22undefined%22%5D%2C%22lastActivityDays%22%3A%5B%22undefined%22%5D%7D%2C%22v%22%3A1%7D%7D%7D 200 in 142ms
2025-10-28 09:15:45.236 | prisma:query SELECT COUNT(*) AS `_count$_all` FROM (SELECT `crm_db`.`Association`.`id` FROM `crm_db`.`Association` WHERE (`crm_db`.`Association`.`municipality` = ? AND `crm_db`.`Association`.`municipalityId` = ? AND (`crm_db`.`Association`.`name` LIKE ? OR `crm_db`.`Association`.`orgNumber` LIKE ? OR `crm_db`.`Association`.`streetAddress` LIKE ? OR `crm_db`.`Association`.`city` LIKE ? OR `crm_db`.`Association`.`municipality` LIKE ? OR `crm_db`.`Association`.`email` LIKE ? OR `crm_db`.`Association`.`phone` LIKE ? OR `crm_db`.`Association`.`homepageUrl` LIKE ? OR `crm_db`.`Association`.`descriptionFreeText` LIKE ? OR `crm_db`.`Association`.`sourceSystem` LIKE ? OR EXISTS(SELECT `t0`.`A` FROM `crm_db`.`_AssociationTags` AS `t0` INNER JOIN `crm_db`.`Tag` AS `j0` ON (`j0`.`id`) = (`t0`.`B`) WHERE (`j0`.`name` LIKE ? AND (`crm_db`.`Association`.`id`) = (`t0`.`A`) AND `t0`.`A` IS NOT NULL)) OR EXISTS(SELECT `t1`.`associationId` FROM `crm_db`.`Contact` AS `t1` WHERE ((`t1`.`name` LIKE ? OR `t1`.`role` LIKE ? OR `t1`.`email` LIKE ? OR `t1`.`phone` LIKE ? OR `t1`.`mobile` LIKE ?) AND (`crm_db`.`Association`.`id`) = (`t1`.`associationId`) AND `t1`.`associationId` IS NOT NULL))))) AS `sub`
2025-10-28 09:15:45.279 | prisma:query SELECT `crm_db`.`Association`.`id`, `crm_db`.`Association`.`sourceSystem`, `crm_db`.`Association`.`municipalityId`, `crm_db`.`Association`.`municipality`, `crm_db`.`Association`.`scrapeRunId`, `crm_db`.`Association`.`scrapedAt`, `crm_db`.`Association`.`detailUrl`, `crm_db`.`Association`.`name`, `crm_db`.`Association`.`orgNumber`, `crm_db`.`Association`.`types`, `crm_db`.`Association`.`activities`, `crm_db`.`Association`.`categories`, `crm_db`.`Association`.`homepageUrl`, `crm_db`.`Association`.`streetAddress`, `crm_db`.`Association`.`postalCode`, `crm_db`.`Association`.`city`, `crm_db`.`Association`.`email`, `crm_db`.`Association`.`phone`, `crm_db`.`Association`.`description`, `crm_db`.`Association`.`descriptionFreeText`, `crm_db`.`Association`.`crmStatus`, `crm_db`.`Association`.`isMember`, `crm_db`.`Association`.`memberSince`, `crm_db`.`Association`.`pipeline`, `crm_db`.`Association`.`assignedToId`, `crm_db`.`Association`.`listPageIndex`, `crm_db`.`Association`.`positionOnPage`, `crm_db`.`Association`.`paginationModel`, `crm_db`.`Association`.`filterState`, `crm_db`.`Association`.`extras`, `crm_db`.`Association`.`createdAt`, `crm_db`.`Association`.`updatedAt`, `crm_db`.`Association`.`importBatchId`, `crm_db`.`Association`.`deletedAt`, `crm_db`.`Association`.`isDeleted`, COALESCE(`aggr_selection_0_Contact`.`_aggr_count_contacts`, 0) AS `_aggr_count_contacts`, COALESCE(`aggr_selection_1_Note`.`_aggr_count_notes`, 0) AS `_aggr_count_notes` FROM `crm_db`.`Association` LEFT JOIN (SELECT `crm_db`.`Contact`.`associationId`, COUNT(*) AS `_aggr_count_contacts` FROM `crm_db`.`Contact` WHERE 1=1 GROUP BY `crm_db`.`Contact`.`associationId`) AS `aggr_selection_0_Contact` ON (`crm_db`.`Association`.`id` = `aggr_selection_0_Contact`.`associationId`) LEFT JOIN (SELECT `crm_db`.`Note`.`associationId`, COUNT(*) AS `_aggr_count_notes` FROM `crm_db`.`Note` WHERE 1=1 GROUP BY `crm_db`.`Note`.`associationId`) AS `aggr_selection_1_Note` ON (`crm_db`.`Association`.`id` = `aggr_selection_1_Note`.`associationId`) WHERE (`crm_db`.`Association`.`municipality` = ? AND `crm_db`.`Association`.`municipalityId` = ? AND (`crm_db`.`Association`.`name` LIKE ? OR `crm_db`.`Association`.`orgNumber` LIKE ? OR `crm_db`.`Association`.`streetAddress` LIKE ? OR `crm_db`.`Association`.`city` LIKE ? OR `crm_db`.`Association`.`municipality` LIKE ? OR `crm_db`.`Association`.`email` LIKE ? OR `crm_db`.`Association`.`phone` LIKE ? OR `crm_db`.`Association`.`homepageUrl` LIKE ? OR `crm_db`.`Association`.`descriptionFreeText` LIKE ? OR `crm_db`.`Association`.`sourceSystem` LIKE ? OR EXISTS(SELECT `t0`.`A` FROM `crm_db`.`_AssociationTags` AS `t0` INNER JOIN `crm_db`.`Tag` AS `j0` ON (`j0`.`id`) = (`t0`.`B`) WHERE (`j0`.`name` LIKE ? AND (`crm_db`.`Association`.`id`) = (`t0`.`A`) AND `t0`.`A` IS NOT NULL)) OR EXISTS(SELECT `t1`.`associationId` FROM `crm_db`.`Contact` AS `t1` WHERE ((`t1`.`name` LIKE ? OR `t1`.`role` LIKE ? OR `t1`.`email` LIKE ? OR `t1`.`phone` LIKE ? OR `t1`.`mobile` LIKE ?) AND (`crm_db`.`Association`.`id`) = (`t1`.`associationId`) AND `t1`.`associationId` IS NOT NULL)))) ORDER BY `crm_db`.`Association`.`updatedAt` DESC LIMIT ? OFFSET ?
2025-10-28 09:15:45.280 | prisma:query SELECT `crm_db`.`Contact`.`id`, `crm_db`.`Contact`.`associationId`, `crm_db`.`Contact`.`name`, `crm_db`.`Contact`.`role`, `crm_db`.`Contact`.`email`, `crm_db`.`Contact`.`phone`, `crm_db`.`Contact`.`mobile`, `crm_db`.`Contact`.`linkedinUrl`, `crm_db`.`Contact`.`facebookUrl`, `crm_db`.`Contact`.`twitterUrl`, `crm_db`.`Contact`.`instagramUrl`, `crm_db`.`Contact`.`isPrimary`, `crm_db`.`Contact`.`createdAt`, `crm_db`.`Contact`.`updatedAt` FROM `crm_db`.`Contact` WHERE (`crm_db`.`Contact`.`isPrimary` = ? AND `crm_db`.`Contact`.`associationId` IN (?,?,?,?)) ORDER BY `crm_db`.`Contact`.`id` ASC
2025-10-28 09:15:45.281 | prisma:query SELECT `crm_db`.`_AssociationTags`.`A`, `crm_db`.`_AssociationTags`.`B` FROM `crm_db`.`_AssociationTags` WHERE `crm_db`.`_AssociationTags`.`A` IN (?,?,?,?)
2025-10-28 09:15:45.282 | prisma:query SELECT `crm_db`.`Activity`.`id`, `crm_db`.`Activity`.`associationId`, `crm_db`.`Activity`.`type`, `crm_db`.`Activity`.`description`, `crm_db`.`Activity`.`metadata`, `crm_db`.`Activity`.`userId`, `crm_db`.`Activity`.`userName`, `crm_db`.`Activity`.`createdAt` FROM `crm_db`.`Activity` WHERE `crm_db`.`Activity`.`associationId` IN (?,?,?,?) ORDER BY `crm_db`.`Activity`.`createdAt` DESC
2025-10-28 09:15:45.286 |  GET /api/trpc/association.list?batch=1&input=%7B%220%22%3A%7B%22json%22%3A%7B%22page%22%3A1%2C%22limit%22%3A10%2C%22search%22%3A%22basket%22%2C%22crmStatuses%22%3Anull%2C%22pipelines%22%3Anull%2C%22types%22%3Anull%2C%22activities%22%3Anull%2C%22tags%22%3Anull%2C%22hasEmail%22%3Anull%2C%22hasPhone%22%3Anull%2C%22isMember%22%3Anull%2C%22assignedToId%22%3Anull%2C%22municipality%22%3A%22V%C3%A4ster%C3%A5s%22%2C%22municipalityId%22%3A%22cmh3mc2h3006jb5ckrxvvd1o9%22%2C%22dateRange%22%3Anull%2C%22lastActivityDays%22%3Anull%2C%22sortBy%22%3A%22updatedAt%22%2C%22sortDirection%22%3A%22desc%22%2C%22useSearchIndex%22%3Afalse%7D%2C%22meta%22%3A%7B%22values%22%3A%7B%22crmStatuses%22%3A%5B%22undefined%22%5D%2C%22pipelines%22%3A%5B%22undefined%22%5D%2C%22types%22%3A%5B%22undefined%22%5D%2C%22activities%22%3A%5B%22undefined%22%5D%2C%22tags%22%3A%5B%22undefined%22%5D%2C%22hasEmail%22%3A%5B%22undefined%22%5D%2C%22hasPhone%22%3A%5B%22undefined%22%5D%2C%22isMember%22%3A%5B%22undefined%22%5D%2C%22assignedToId%22%3A%5B%22undefined%22%5D%2C%22dateRange%22%3A%5B%22undefined%22%5D%2C%22lastActivityDays%22%3A%5B%22undefined%22%5D%7D%2C%22v%22%3A1%7D%7D%7D 200 in 134ms