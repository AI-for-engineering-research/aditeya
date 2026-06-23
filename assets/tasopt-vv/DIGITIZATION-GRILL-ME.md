# Digitization module — grill-me review

I read `docs/DIGITIZE.md` and cross-checked it against `docs/OUTLINE.md` / `docs/OUTLINE-WITH-AGENT.md`.

## Initial assessment / “grill-me” review

The digitization direction is good, but we should tighten the scope before touching data. The core risk is that “digitize the airport planning document” can become too broad unless we define:

1. **exact source documents**
2. **exact aircraft/engine variant**
3. **exact TASOPT fields to populate**
4. **what is supervised vs held-out**
5. **how digitization uncertainty is represented**
6. **what tests prove that extraction is sane**

The most important improvement: separate the module into two products:

### Product A — supervised B737 digitization package

A human-reviewed, high-confidence extraction of the B737-800 APD / CFM56-7B data.

Outputs:

```text
data/raw/
data/interim/
data/processed/
references/data_ledger.csv
references/input_classification.md
models/b737-800-cfm56.toml
tests/
```

### Product B — automated digitization agent recipe

Instructions/prompts/checklists/schemas that allow a future agent to repeat Product A for another aircraft.

Outputs:

```text
agents/digitization_agent.md
schemas/
scripts/
tests/
```

This avoids a trap: if we build the agent before understanding the real TASOPT input map, the agent instructions will be vague and probably wrong.

---

## Proposed digitization module architecture

I would organize the module as follows:

```text
TAS_VV/
  data/
    raw/
      b737_800/
        apd.pdf
        edb_source.csv/json/etc
    interim/
      b737_800/
        extracted_tables/
        digitized_figures/
    processed/
      b737_800/
        apd_geometry.toml
        apd_weights.toml
        payload_range_points.csv
        engine_lto.csv

  references/
    data_ledger.csv
    input_classification.md
    source_documents.md
    tasopt_input_map.md

  models/
    b737_800_cfm56_7b.baseline.toml

  scripts/
    inspect_tasopt_inputs.jl/py
    digitize_payload_range.py
    validate_extracted_data.py
    build_toml_from_ledger.py

  tests/
    test_units.py
    test_payload_range_properties.py
    test_ledger_completeness.py
    test_file_boundaries.py

  agents/
    digitization_agent.md
    provenance_agent.md
    tasopt_mapping_agent.md

  reflections/
    000_stage0_digitization_plan.md
```

---

## Suggested workflow

### Step 0 — TASOPT input inventory

Before digitizing APDs, inspect TASOPT docs/code/TOML files and create:

```text
references/tasopt_input_map.md
references/input_classification.md
```

For each TASOPT input:

| TASOPT field | meaning | units | source candidate | category | required? | notes |
|---|---|---:|---|---|---|---|

Categories:

- observed/certified
- derived
- model assumption
- calibration knob
- validation target
- unknown / needs review

This is essential.

---

### Step 1 — define source documents

Freeze the exact documents and variants.

Questions here matter a lot:

- Boeing 737-800 APD revision/date?
- Which gross weight option?
- Which engine variant? CFM56-7B24, -7B26, -7B27?
- Are we modeling blended winglets or non-winglet?
- Which payload-range line is authoritative?

---

### Step 2 — supervised digitization

Digitize manually or semi-manually with provenance.

Every extracted value should have:

```text
id
value
unit
source_document
page
table_or_figure
variant
extraction_method
uncertainty
provenance_category
used_for
notes
```

Payload-range points need special care:

```text
range_nmi,payload_lb,point_type,source_page,figure,digitization_uncertainty_range_nmi,digitization_uncertainty_payload_lb
```

---

### Step 3 — property-based tests

Good initial tests:

- unit conversion round trips
- fuel mass <= max fuel capacity
- payload-range payload decreases or stays flat as range increases
- ferry range has approximately zero payload
- max-payload point <= MZFW-derived structural payload
- MTOW is not used as calibration input
- every non-default TOML field has a ledger entry
- every validation target is frozen before calibration

---

### Step 4 — TOML generation / update

Do not manually edit TOML as the only source of truth if avoidable.

Preferred pipeline:

```text
data ledger + baseline template -> generated TOML
```

Manual TOML edits are okay early, but eventually we should make them reproducible.

---

### Step 5 — automated digitization agent

Only after supervised extraction do we write the agent instructions.

The agent should be given:

- source document
- aircraft/engine variant
- extraction schema
- forbidden behaviors
- required tests
- review gates

It should not be allowed to silently infer values without ledger rows.

---

## Key questions before implementation

### Source / aircraft questions

1. Which exact airport planning document should we use first?
2. Do we already have the B737-800 APD PDF locally?
3. Which B737-800 configuration are we targeting?
   - standard wing?
   - winglets?
   - 737-800?
   - 737-800BCF excluded?
4. Which engine variant should be first?
   - CFM56-7B24?
   - CFM56-7B26?
   - CFM56-7B27?

### TASOPT questions

5. Should I inspect the TASOPT repo now and build the first input inventory?
6. Is there a preferred existing TOML template to start from?
7. Are post-load mutations allowed if logged, or should Stage 1 forbid them entirely?

### Digitization questions

8. Do you want payload-range digitization done manually first, then automated later?
9. What tolerance should we use for digitized chart points?
   - e.g. ±25 nmi / ±500 lb?
10. Should supervised digitized data be stored as the canonical truth, with the automated agent tested against it later?

### Agent setup questions

11. Do you want an `AGENTS.md` in the repo?
12. Should the digitization agent be a markdown instruction file only, or should we build a small harness around it?
13. Should the harness enforce schemas/tests before accepting extracted data?

### Validation boundary questions

14. Is MTOW definitely held out as validation only? The outlines say yes.
15. Are APD payload-range points validation targets, or are some used to define the sizing mission?
16. Are EDB fuel flows input data, validation data, or both? We may need to separate rated thrust input from fuel-flow validation.

---

## My recommendation

Start with **Stage 0 only**:

1. inspect TASOPT code/docs/input TOMLs,
2. inventory all relevant input fields,
3. classify them,
4. create the data ledger schema,
5. create the digitization agent spec draft.

Then we stop and review before extracting APD values.

# Stage 0 started — TASOPT input inventory and digitization scaffold

## What was done

- Confirmed APD source: `data/raw/737NG_REV_C.pdf`.
- Extracted APD text into `data/interim/737_800/apd_text/page_*.txt` for search/review.
- Inspected TASOPT `default_input.toml` and `src/IO/read_input.jl` to identify how TOML fields are consumed.
- Created initial machine-readable TASOPT input inventory:
  - `references/tasopt_input_inventory.csv`
- Created initial human-readable classification notes:
  - `references/input_classification.md`
- Created source-document notes:
  - `references/source_documents.md`
- Created first ledger template:
  - `references/data_ledger.csv`
- Added repo-level agent rules:
  - `AGENTS.md`
- Added digitization agent specification:
  - `agents/digitization_agent.md`
- Added schema/policy scaffold:
  - `schemas/data_ledger.schema.json`
  - `scripts/validate_ledger.py`
  - `tests/test_stage0_ledger.py`

## Important preliminary APD locations

- PDF page 19 / APD p. 1-3: 737-800 description; length 129 ft 6 in; 184 all-economy pax.
- PDF page 25 / APD p. 2-4: 737-800 general characteristics; weights, seating, cargo, usable fuel.
- PDF page 65 / APD p. 3-5: payload/range chart for 737-800 family; needs figure digitization.
- PDF page 39 / APD p. 2-18: ground clearances.
- PDF page 202 / APD p. 7-7: pavement loads.

## Initial policy decisions encoded

- MTOW is validation only.
- EDB data is validation only.
- Payload-range digitization is automated but supervised.
- Canonical data requires review.
- Post-load mutations are allowed only if logged.

## Test status

```text
scripts/validate_ledger.py references/data_ledger.csv
# passed

pytest -q tests
# 1 passed
```

## Main open review questions

1. Which APD p. 2-4 gross-weight column should define the first 737-800 baseline row?
2. Should baseline be `737-800` or `737-800W`, since APD combines them in some tables?
3. Should APD OEW be a validation target, context-only reference, or excluded due configuration dependence?
4. Should fuel capacity be represented by TASOPT tank geometry only, or by an explicit logged post-load fuel cap?
5. Which selected payload/range point should become the sizing mission?

# Stage 0 update — gross-weight column selection test

## User decisions recorded

- Baseline is treated as **737-800**, not 737-800W.
- APD OEW is a validation target.
- Usable fuel capacity should be enforced through TASOPT wing/fuel geometry, not by a post-load fuel cap.
- Sizing mission is the second corner / third point of the payload-range line after max zero fuel weight and max brake-release gross weight, close to 3000 nmi.

## Added data

- `data/interim/737_800/extracted_tables/apd_737800_gross_weight_options.csv`
- `data/interim/737_800/digitized_figures/payload_range_diagram_constraints.csv`

## Added documentation

- `references/gross_weight_column_selection.md`
- Updated `references/input_classification.md`
- Updated `references/source_documents.md`
- Updated `AGENTS.md`

## Added test

- `tests/test_apd_gross_weight_column_selection.py`

The test uses the payload-range diagram constraints:

- MZFW = 138,300 lb / 62,732 kg
- max brake-release gross weight = 174,200 lb / 79,000 kg

and verifies that exactly one APD p. 2-4 gross-weight column matches: option **C**.

## Resulting selected APD gross-weight option C

| Quantity | Value |
|---|---:|
| max taxi weight | 174,700 lb |
| max takeoff / brake-release gross weight | 174,200 lb |
| max landing weight | 146,300 lb |
| max zero fuel weight | 138,300 lb |
| operating empty weight | 91,300 lb |
| max structural payload | 47,000 lb |
| usable fuel | 46,062 lb |

## Test status

```text
pytest -q tests
# 3 passed
```
