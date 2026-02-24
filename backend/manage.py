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
                cls = self.__class__
                duplicate = object.__new__(cls)

                try:
                    duplicate.dicts = list(self.dicts)
                except Exception:
                    duplicate.dicts = []

                if hasattr(self, 'render_context'):
                    duplicate.render_context = self.render_context

                for attr in ('autoescape', 'use_l10n', 'use_tz'):
                    if hasattr(self, attr):
                        setattr(duplicate, attr, getattr(self, attr))

                if hasattr(self, 'request'):
                    duplicate.request = getattr(self, 'request')
                duplicate.template = getattr(self, 'template', None)
                
                if hasattr(self, '_processors_index'):
                    duplicate._processors_index = getattr(self, '_processors_index')

                return duplicate

            BaseContext.__copy__ = _basecontext_copy
        except Exception:
            pass
    except ImportError as exc:
        raise ImportError(
            "Couldn't import Django. Are you sure it's installed?"
        ) from exc
    execute_from_command_line(sys.argv)
