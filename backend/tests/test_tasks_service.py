"""Unit tests for the refactored task service."""
from __future__ import annotations

import unittest
from datetime import datetime, timedelta

from backend.src.services.tasks import (
    TaskCreate,
    TaskFilters,
    TaskPriority,
    TaskStatus,
    TaskStatusUpdate,
    TaskUpdate,
    build_task_service,
)
from backend.src.services.task_components.repository import InMemoryTaskRepository
from backend.src.services.task_components.exceptions import TaskNotFoundError


class TaskServiceTests(unittest.TestCase):
    def setUp(self) -> None:
        self.repo = InMemoryTaskRepository()
        self.service = build_task_service(self.repo)

    def _create_sample(self, **overrides):
        params = {"title": "Follow up", "created_by_id": "user-1"}
        params.update(overrides)
        payload = TaskCreate(**params)
        return self.service.create(payload)

    def test_create_and_list_tasks(self) -> None:
        self._create_sample()
        self._create_sample(title="Prepare report", association_id="assoc-1")

        result = self.service.list()
        self.assertEqual(result.total, 2)
        titles = [item.title for item in result.items]
        self.assertIn("Follow up", titles)
        self.assertIn("Prepare report", titles)

    def test_filter_by_status_and_search(self) -> None:
        created = self._create_sample()
        self.service.update_status(
            created.id,
            TaskStatusUpdate(status=TaskStatus.IN_PROGRESS),
        )
        self._create_sample(title="Contact association", assigned_to_id="agent-2")

        filters = TaskFilters(status=[TaskStatus.IN_PROGRESS], search="contact")
        result = self.service.list(filters)
        self.assertEqual(result.total, 0)

        filters = TaskFilters(status=[TaskStatus.IN_PROGRESS])
        result = self.service.list(filters)
        self.assertEqual(result.total, 1)
        self.assertEqual(result.items[0].status, TaskStatus.IN_PROGRESS)

    def test_update_task(self) -> None:
        created = self._create_sample(description="Old desc")
        updated = self.service.update(
            created.id,
            TaskUpdate(description="Updated description", priority=TaskPriority.HIGH),
        )
        self.assertEqual(updated.description, "Updated description")
        self.assertEqual(updated.priority, TaskPriority.HIGH)

    def test_update_status_sets_completion_timestamp(self) -> None:
        created = self._create_sample()
        updated = self.service.update_status(
            created.id,
            TaskStatusUpdate(status=TaskStatus.COMPLETED),
        )
        self.assertIsNotNone(updated.completed_at)
        self.assertEqual(updated.status, TaskStatus.COMPLETED)

    def test_delete_task(self) -> None:
        created = self._create_sample()
        self.service.delete(created.id)
        with self.assertRaises(TaskNotFoundError):
            self.service.get(created.id)

    def test_due_date_filters(self) -> None:
        future_due = datetime.utcnow() + timedelta(days=3)
        past_due = datetime.utcnow() - timedelta(days=3)
        self._create_sample(title="Future", due_date=future_due)
        self._create_sample(title="Past", due_date=past_due)

        result = self.service.list(TaskFilters(due_after=datetime.utcnow()))
        self.assertEqual(result.total, 1)
        self.assertEqual(result.items[0].title, "Future")

        result = self.service.list(TaskFilters(due_before=datetime.utcnow()))
        self.assertEqual(result.total, 1)
        self.assertEqual(result.items[0].title, "Past")


if __name__ == "__main__":
    unittest.main()
