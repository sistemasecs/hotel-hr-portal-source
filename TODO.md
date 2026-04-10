# TODO - Vacation source unification

- [ ] Update Admin Vacations tab to use YEARLY request_documents as signing source (not consent records) for signed indicators.
- [ ] Ensure vacation balance calculations in Admin Directory and Admin Vacations both use `calculateVacationBalance` with same inputs.
- [ ] Keep consent endpoint as metadata-only (no impact on totals shown).
- [ ] Verify inactive users are excluded from EOTM and birthdays.
- [ ] Run build/typecheck to validate no regressions.
