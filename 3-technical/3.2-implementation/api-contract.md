# API Contract Index

The canonical, machine-readable contract for the implemented Attendance,
Payroll, authentication, reporting, RBAC, and internal service endpoints is:

- [OpenAPI 3.1 contract](../3.1-system-foundation/architecture/api-contracts/openapi.yaml)

Do not define a second endpoint catalog in this implementation folder. Update
the canonical OpenAPI file with every route, request, response, authentication,
or status-code change, then reconcile the implementation and tests against it.

Implementation-specific domain constraints remain in
[domain-specs.md](domain-specs.md).
