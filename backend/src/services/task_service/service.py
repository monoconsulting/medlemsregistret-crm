"""Service layer encapsulating the task orchestration logic."""
from __future__ import annotations

from datetime import datetime
from typing import Iterable

from .dto import TaskCreate, TaskSearchFilters, TaskStatusUpdate, TaskUpdate
from .exceptions import TaskNotFoundError
from .filters import normalise_filters
from .models import Task
from .repository import TaskQuery, TaskRepository
from .validators import validate_create, validate_status_update, validate_update


class TaskService:
    """Coordinate task operations across validation and persistence layers."""

    def __init__(self, repository: TaskRepository) -> None:
        self._repository = repository

    def list_tasks(self, filters: TaskSearchFilters | None = None) -> list[Task]:
        """Return tasks matching the provided filters ordered by repository defaults."""

        normalised = normalise_filters(filters)
        query = TaskQuery(filters=normalised, limit=normalised.limit)
        result: Iterable[Task] = self._repository.fetch(query)
        return list(result)

    def create_task(self, payload: TaskCreate) -> Task:
        """Validate and persist a new task."""

        validate_create(payload)
        return self._repository.create(payload)

    def update_task(self, task_id: str, payload: TaskUpdate) -> Task:
        """Apply partial updates to a task and return the persisted entity."""

        validate_update(payload)
        try:
            updated = self._repository.update(task_id, payload)
        except LookupError as exc:  # pragma: no cover - defensive, repo should map this
            raise TaskNotFoundError(f"Uppgiften med id {task_id} hittades inte.") from exc

        self._repository.touch(task_id, datetime.utcnow())
        return updated

    def update_status(self, task_id: str, payload: TaskStatusUpdate) -> Task:
        """Update only the status related fields of a task."""

        validate_status_update(payload)
        try:
            updated = self._repository.update_status(task_id, payload)
        except LookupError as exc:
            raise TaskNotFoundError(f"Uppgiften med id {task_id} hittades inte.") from exc

        return updated

    def delete_task(self, task_id: str) -> None:
        """Remove a task."""

        try:
            self._repository.delete(task_id)
        except LookupError as exc:
            raise TaskNotFoundError(f"Uppgiften med id {task_id} hittades inte.") from exc


__all__ = ["TaskService"]
