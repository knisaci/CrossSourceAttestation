"""Direct Mode compatibility adapter for the pinned GenVM SDK.

Some SDK builds read their initialization message from fd 0 more than once:
the runner injects an encoded message, an eager import consumes it, and the
contract module import then sees EOF. Rewind the injected *test-only* buffer
before loading the module. Do not change production code or verdict logic.
"""
import os
import pytest


@pytest.fixture(autouse=True)
def rewind_injected_message_before_import(monkeypatch):
    from gltest.direct import loader
    original = loader._load_module
    def load_with_rewind(path):
        try:
            os.lseek(0, 0, os.SEEK_SET)
        except OSError:
            pass
        return original(path)
    monkeypatch.setattr(loader, "_load_module", load_with_rewind)
