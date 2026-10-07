# SweetFix database: working draft

`SweetFix_Database_Solubility_Corrected.xlsx` is the latest local research workbook
from the SweetFix project. It is provisional. Its values, rows, columns, sheets,
and filename may change as the project develops. Check the `Evidence_Log` and
`Sources` sheets before relying on a value; some entries remain unverified,
conflicting, or dependent on a specific product formulation.

Week 1 does not read this file. You can edit it or replace it without changing
`app.py` or `recipedb_client.py`.

## Requirements for later integration

These are requirements for future work, not features already implemented:

1. Select the database using a configurable path rather than a fixed filename in
   application logic. Resolve relative paths from a documented project location.
2. Keep workbook reading in a separate loader. Map sheet and column names to the
   internal fields the algorithm needs through explicit configuration.
3. Read records and values from the selected database. Do not embed sweetener
   lists, row positions, thresholds from the workbook, or workbook values in code.
4. Validate required fields, types, units, and identifiers before using records.
   Report the source sheet, row, and field for invalid data where possible. Do not
   substitute guessed values for missing or incompatible data.
5. Allow additional, unused columns without breaking existing logic. A renamed
   required field needs a mapping update; a change in meaning or units needs an
   explicit conversion or algorithm review, not just a renamed mapping.
6. Record the source filename and a content hash or revision with generated
   results so that results can be traced to the database version used.

Once integration exists, replacing the configured workbook should pick up changed
records and values on the next load. Schema changes must be validated before
recommendations run. Keep representative loader checks for both the current
layout and a deliberately changed layout when implementing that stage.
