"""Compatibility shim for v0.2 GenLayer contract SDK and newer gltest runner.

The installed runner expects the v0.3 layout (genlayer.calldata/types/vm).
CrossSource is pinned to the older on-chain py-genlayer runner (genlayer.py.*,
genlayer.gl.vm). Isolate the adaptation to tests: do not alter contract code.
"""
import importlib
import pytest


@pytest.fixture(autouse=True)
def legacy_genvm_direct_adapter(monkeypatch):
    from gltest.direct import loader, sdk_compat
    from gltest.direct.vm import VMContext

    def old_calldata():
        return importlib.import_module("genlayer.py.calldata")

    def old_types():
        return importlib.import_module("genlayer.py.types")

    monkeypatch.setattr(sdk_compat, "import_calldata", old_calldata)
    monkeypatch.setattr(sdk_compat, "import_types", old_types)
    monkeypatch.setattr(loader, "import_calldata", old_calldata)

    def install_old_nondet_mock():
        from gltest.direct import wasi_mock
        from genlayer.py.types import Lazy
        vm_api = importlib.import_module("genlayer.gl.vm")

        def run_nondet_unsafe(leader_fn, validator_fn):
            vm = wasi_mock.get_vm()
            vm._in_nondet = True
            try:
                value = leader_fn()
            finally:
                vm._in_nondet = False
            vm._captured_validators.append((value, leader_fn, validator_fn))
            return value

        run_nondet_unsafe.lazy = lambda leader_fn, validator_fn: Lazy(
            lambda: run_nondet_unsafe(leader_fn, validator_fn)
        )
        monkeypatch.setattr(vm_api, "run_nondet_unsafe", run_nondet_unsafe)

    monkeypatch.setattr(loader, "_patch_run_nondet_for_direct_mode", install_old_nondet_mock)

    def run_old_validator(self, *, index=-1):
        vm_api = importlib.import_module("genlayer.gl.vm")
        value, _, validator = self._captured_validators[index]
        return validator(vm_api.Return(calldata=value))

    monkeypatch.setattr(VMContext, "run_validator", run_old_validator)
