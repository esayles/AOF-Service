#!/usr/bin/env python
import os
import sys

if __name__ == '__main__':
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'aof_service.settings.base')
    try:
        from django.core.management import execute_from_command_line
        # Temporary monkeypatch for Python 3.14 compatibility with Django 4.2's
        # template Context copying logic
        try:
            from copy import copy as _copy
            from django.template.context import BaseContext

            def _basecontext_copy(self):
                duplicate = _copy(self.__class__())
                duplicate.dicts = self.dicts[:]
                return duplicate

            BaseContext.__copy__ = _basecontext_copy
        except Exception:
            # If Django isn't fully available yet or import fails, skip patch.
            pass
    except ImportError as exc:
        raise ImportError(
            "Couldn't import Django. Are you sure it's installed?"
        ) from exc
    execute_from_command_line(sys.argv)
