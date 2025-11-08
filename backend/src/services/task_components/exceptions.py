"""Custom exceptions for the task service module."""

from __future__ import annotations


class TaskError(Exception):
    """Base class for task related errors."""


class TaskNotFoundError(TaskError):
    """Raised when a task cannot be found."""

    def __init__(self, task_id: str) -> None:
        super().__init__(f"Task with id '{task_id}' was not found")
        self.task_id = task_id


class TaskValidationError(TaskError):
    """Raised when invalid input is provided to the service layer."""

    def __init__(self, message: str) -> None:
        super().__init__(message)
        self.message = message
