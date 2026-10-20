"""Diagnostic wrapper for current upstream Direct Mode bootstrap failure.

Important: this runs only inside pytest Direct Mode, never inside on-chain code.
"""
import os
import pytest


@pytest.fixture(autouse=True)
def diagnose_injected_message(monkeypatch):
    from gltest.direct import loader
    original_inject = loader._inject_message_to_fd0

    def checked_inject(vm):
        import sys
        print("GLTEST bootstrap before injection:", [
            name for name in ("genlayer", "genlayer.gl", "genlayer._internal.msg", "genlayer.message")
            if name in sys.modules
        ], flush=True)
        original_inject(vm)
        try:
            fd_stat = os.fstat(0)
            pos = os.lseek(0, 0, os.SEEK_CUR)
            prefix = os.read(0, 16)
            print("GLTEST bootstrap after injection: size=%d pos=%d prefix=%r" %
                  (fd_stat.st_size, pos, prefix), flush=True)
            os.lseek(0, 0, os.SEEK_SET)
            if not prefix:
                raise RuntimeError("GenLayer Direct Mode injected empty fd0")
        except OSError as e:
            print("GLTEST bootstrap fd0 unavailable:", repr(e), flush=True)
            raise
    monkeypatch.setattr(loader, "_inject_message_to_fd0", checked_inject)
