"""Service layer for task management."""
from __future__ import annotations

from typing import Optional

from .dto import (
    TaskCreate,
    TaskFilters,
    TaskListResult,
    TaskRecord,
    TaskStatusUpdate,
    TaskUpdate,
)
from .repository import TaskRepository
from .validators import (
    coalesce_completed_at,
    validate_task_create,
    validate_task_filters,
    validate_task_status_update,
    validate_task_update,
)


class TaskService:
    """Coordinates repositories, validation and business rules for tasks."""

    def __init__(self, repository: TaskRepository) -> None:
        self._repository = repository

    def list(self, filters: Optional[TaskFilters] = None) -> TaskListResult:
        concrete_filters = validate_task_filters(filters)
        records = self._repository.list(concrete_filters)
        result = TaskListResult()
        result.extend(records)
        return result

    def create(self, payload: TaskCreate) -> TaskRecord:
        validated = validate_task_create(payload)
        return self._repository.create(validated)

    def update(self, task_id: str, payload: TaskUpdate) -> TaskRecord:
        validated = validate_task_update(payload)
        return self._repository.update(task_id, validated)

    def update_status(self, task_id: str, payload: TaskStatusUpdate) -> TaskRecord:
        validated = validate_task_status_update(payload)
        completed_at = coalesce_completed_at(validated.status, validated.completed_at)
        return self._repository.update_status(task_id, validated.status, completed_at)

    def delete(self, task_id: str) -> None:
        self._repository.delete(task_id)

    def get(self, task_id: str) -> TaskRecord:
        return self._repository.get(task_id)
