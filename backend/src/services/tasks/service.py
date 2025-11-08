"""High level orchestration for the task domain."""

from __future__ import annotations

from datetime import datetime
from typing import Callable, Optional

from .dtos import TaskCreate, TaskFilter, TaskStatusUpdate, TaskUpdate
from .exceptions import TaskConflictError
from .models import Task, TaskStatus
from .repository import TaskRepository, generate_task_id
from .validators import (
    validate_filters,
    validate_status_update,
    validate_task_create,
    validate_task_update,
)

Clock = Callable[[], datetime]


def _default_clock() -> datetime:
    return datetime.utcnow()


class TaskService:
    """Coordinates validation, domain rules and persistence for tasks."""

    def __init__(self, repository: TaskRepository, clock: Clock | None = None) -> None:
        self._repository = repository
        self._clock: Clock = clock or _default_clock

    def list_tasks(self, filters: Optional[TaskFilter] = None) -> list[Task]:
        """Return tasks using the provided filters."""

        effective_filters = validate_filters(filters)
        tasks = self._repository.list(effective_filters)
        return list(tasks)

    def create_task(self, payload: TaskCreate) -> Task:
        """Validate and persist a new task."""

        validate_task_create(payload)
        now = self._clock()
        task = Task(
            id=generate_task_id(),
            title=payload.title.strip(),
            description=payload.description.strip() if payload.description else None,
            due_date=payload.due_date,
            priority=payload.priority,
            status=TaskStatus.OPEN,
            association_id=payload.association_id,
            assigned_to_id=payload.assigned_to_id,
            created_by_id=payload.created_by_id,
            created_at=now,
            updated_at=now,
            completed_at=None,
        )
        return self._repository.add(task)

    def update_task(self, payload: TaskUpdate) -> Task:
        """Apply partial updates to a task."""

        validate_task_update(payload)
        existing = self._repository.get(payload.id)
        now = self._clock()

        updated = existing.with_updates(
            title=payload.title.strip() if payload.title is not None else existing.title,
            description=
                payload.description.strip() if payload.description is not None else existing.description,
            due_date=payload.due_date if payload.due_date is not None else existing.due_date,
            priority=payload.priority if payload.priority is not None else existing.priority,
            association_id=
                payload.association_id if payload.association_id is not None else existing.association_id,
            assigned_to_id=
                payload.assigned_to_id if payload.assigned_to_id is not None else existing.assigned_to_id,
            status=payload.status if payload.status is not None else existing.status,
            updated_at=now,
            completed_at=self._derive_completed_at(payload.status, existing.completed_at),
        )

        return self._repository.save(updated)

    def update_status(self, payload: TaskStatusUpdate) -> Task:
        """Update only the status of a task."""

        validate_status_update(payload)
        existing = self._repository.get(payload.id)
        now = self._clock()

        completed_at = payload.completed_at
        if completed_at is None and payload.status == TaskStatus.COMPLETED:
            completed_at = now

        updated = existing.with_updates(
            status=payload.status,
            updated_at=now,
            completed_at=completed_at,
        )
        return self._repository.save(updated)

    def delete_task(self, task_id: str) -> None:
        """Delete a task by id."""

        if not task_id or not task_id.strip():
            raise TaskConflictError("Id får inte vara tomt")
        self._repository.remove(task_id)

    def get_task(self, task_id: str) -> Task:
        """Fetch a single task."""

        if not task_id or not task_id.strip():
            raise TaskConflictError("Id får inte vara tomt")
        return self._repository.get(task_id)

    def _derive_completed_at(
        self, new_status: Optional[TaskStatus], current: Optional[datetime]
    ) -> Optional[datetime]:
        if new_status is None:
            return current
        if new_status == TaskStatus.COMPLETED:
            return current or self._clock()
        return None


__all__ = ["TaskService"]
