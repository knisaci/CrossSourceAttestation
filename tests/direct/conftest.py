"""Diagnose GenLayer Testing Suite's silently skipped fd0 injection."""
import os
import sys
import pytest


@pytest.fixture(autouse=True)
def diagnose_sdk_injection(monkeypatch):
    from gltest.direct import loader
    from gltest.direct.sdk_compat import import_calldata, import_address
    original_inject = loader._inject_message_to_fd0

    def checked_inject(vm):
        try:
            calldata = import_calldata()
            address = import_address()
            print("GLTEST SDK resolved:", calldata.__file__, address, flush=True)
        except Exception as e:
            print("GLTEST CAUSE: inject dependency import failed:", repr(e), flush=True)
            print("GLTEST module resolution:", sys.modules.get("genlayer"), flush=True)
            raise RuntimeError("GenLayer SDK could not import calldata/address") from e
        original_inject(vm)
        try:
            fdstat = os.fstat(0)
            offset = os.lseek(0, 0, os.SEEK_CUR)
            prefix = os.read(0, 16)
            os.lseek(0, 0, os.SEEK_SET)
            print("GLTEST fd0:", fdstat.st_size, offset, repr(prefix), flush=True)
            assert len(prefix) > 0, "fd0 empty"
        except OSError as e:
            print("GLTEST unexpected fd0:", repr(e), flush=True)
            raise RuntimeError("SDK failed to replace stdin with calldata") from e
    monkeypatch.setattr(loader, "_inject_message_to_fd0", checked_inject)
