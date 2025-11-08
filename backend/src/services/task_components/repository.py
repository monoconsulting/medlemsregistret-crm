"""Repository abstractions for persisting tasks."""
from __future__ import annotations

from dataclasses import replace
from datetime import datetime
from typing import Dict, Protocol
from uuid import uuid4

from .dto import TaskCreate, TaskFilters, TaskRecord, TaskStatus, TaskUpdate
from .exceptions import TaskNotFoundError
from .filters import apply_filters, touch_timestamp


class TaskRepository(Protocol):
    """Contract implemented by all task repositories."""

    def list(self, filters: TaskFilters) -> list[TaskRecord]:
        raise NotImplementedError

    def get(self, task_id: str) -> TaskRecord:
        raise NotImplementedError

    def create(self, payload: TaskCreate) -> TaskRecord:
        raise NotImplementedError

    def update(self, task_id: str, payload: TaskUpdate) -> TaskRecord:
        raise NotImplementedError

    def update_status(
        self,
        task_id: str,
        status: TaskStatus,
        completed_at: datetime | None,
    ) -> TaskRecord:
        raise NotImplementedError

    def delete(self, task_id: str) -> None:
        raise NotImplementedError


class InMemoryTaskRepository(TaskRepository):
    """Simple repository used for unit tests and local experimentation."""

    def __init__(self) -> None:
        self._records: Dict[str, TaskRecord] = {}

    def list(self, filters: TaskFilters) -> list[TaskRecord]:
        return apply_filters(self._records.values(), filters)

    def get(self, task_id: str) -> TaskRecord:
        try:
            return self._records[task_id]
        except KeyError as exc:
            raise TaskNotFoundError(task_id) from exc

    def create(self, payload: TaskCreate) -> TaskRecord:
        task_id = str(uuid4())
        now = datetime.utcnow()
        record = TaskRecord(
            id=task_id,
            title=payload.title,
            description=payload.description,
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
        self._records[task_id] = record
        return record

    def update(self, task_id: str, payload: TaskUpdate) -> TaskRecord:
        record = self.get(task_id)
        updated_data = {
            "title": payload.title if payload.title is not None else record.title,
            "description": payload.description if payload.description is not None else record.description,
            "due_date": payload.due_date if payload.due_date is not None else record.due_date,
            "priority": payload.priority if payload.priority is not None else record.priority,
            "association_id": payload.association_id if payload.association_id is not None else record.association_id,
            "assigned_to_id": payload.assigned_to_id if payload.assigned_to_id is not None else record.assigned_to_id,
            "status": payload.status if payload.status is not None else record.status,
        }
        new_record = replace(record, **updated_data)
        new_record = touch_timestamp(new_record, updated_at=datetime.utcnow())
        self._records[task_id] = new_record
        return new_record

    def update_status(
        self,
        task_id: str,
        status: TaskStatus,
        completed_at: datetime | None,
    ) -> TaskRecord:
        record = self.get(task_id)
        new_record = replace(record, status=status, completed_at=completed_at)
        new_record = touch_timestamp(new_record, updated_at=datetime.utcnow())
        self._records[task_id] = new_record
        return new_record

    def delete(self, task_id: str) -> None:
        if task_id not in self._records:
            raise TaskNotFoundError(task_id)
        del self._records[task_id]
