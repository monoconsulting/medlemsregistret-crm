"""Custom exceptions for the task service."""

from __future__ import annotations


class TaskError(RuntimeError):
    """Base exception for task related issues."""


class TaskValidationError(TaskError, ValueError):
    """Raised when incoming payloads fail validation."""


class TaskNotFoundError(TaskError, LookupError):
    """Raised when the requested task can not be located."""


class TaskConflictError(TaskError):
    """Raised when an update would violate domain constraints."""


__all__ = [
    "TaskError",
    "TaskValidationError",
    "TaskNotFoundError",
    "TaskConflictError",
]
