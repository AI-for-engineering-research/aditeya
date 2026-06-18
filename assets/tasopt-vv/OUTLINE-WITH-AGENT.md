# TASOPT V&V against real aircraft — agent-driven project outline

## 1. Project purpose

This project will build an AI-agent-driven, auditable pipeline to design, size, and verify/validate TASOPT aircraft models against real aircraft using public data.

The first supervised case is a Boeing 737-800-like model with CFM56-7B-family engines. The broader objective is to generalize this into an automated framework that can ingest public aircraft/engine data, construct TASOPT input files, run TASOPT sizing and off-design missions, compare outputs to validation targets, and document every assumption and calibration decision.

A suitable final validation claim is:

> We validate that a TASOPT B737-800-like model, parameterized only from APD/EDB data plus documented assumptions, can reproduce APD payload-range behavior and EDB LTO thrust/fuel-flow within X%.

The value of `X` will be determined only after data extraction uncertainty, digitization repeatability, and baseline model behavior are quantified.

## 2. Scientific questions

1. **Input reconstruction:** Can public data and documented assumptions define a TASOPT aircraft model without hidden fitting?
2. **Aircraft-level validation:** Does the sized aircraft recover held-out aircraft-level quantities, especially MTOW and off-design payload-range points?
3. **Engine operating-point validation:** Does the TASOPT engine model reproduce EDB LTO thrust and fuel-flow at the four standard operating points?
4. **Automation:** Can an AI agent perform the end-to-end process reproducibly while maintaining provenance, tests, and documentation?
5. **Generalization:** Can the supervised B737-800 process become a reusable pipeline for other aircraft such as the B777-300ER/GE90?

## 3. Scope and boundaries

### In scope

- Public data extraction from airport planning documents, emissions databank records, and similar sources.
- TASOPT TOML input generation and modification.
- TASOPT model loading via `read_aircraft_model`.
- Aircraft sizing via `size_aircraft!`.
- Off-design mission evaluation via `fly_mission!`.
- Payload-range reconstruction and comparison.
- EDB LTO thrust/fuel-flow comparison.
- Data ledger, provenance tracking, tests, outputs, and reflections.
- Agent-driven orchestration of the pipeline with human review gates.

### Out of scope for initial V&V claim

- Claiming that TASOPT fully validates the real Boeing 737-800 in all respects.
- Treating optimized designs as real-aircraft validation cases.
- Validating NOx/HC/CO emission indices unless an emissions model is added.
- Editing TASOPT source without explicit user permission.

## 4. Data sources and target quantities

### Airport planning document data

Used for:

- Geometry: fuselage length, fuselage diameter, span, height, gear geometry if available.
- Weights: MZFW, fuel capacity, payload quantities, MTOW as validation target.
- Payload-range chart: sizing point and off-design validation points.
- Takeoff field length if available and variant-consistent.

### Emissions databank data

Used for:

- Engine variant identification.
- Rated thrust.
- LTO fuel-flow at idle, approach, climb, and takeoff.
- NOx/HC/CO EI values as reference metadata only for now.

### TASOPT documentation/code

Used for:

- Mapping data to TOML fields.
- Understanding model assumptions and array outputs.
- Defining valid runtime calls and output extraction.

## 5. Data provenance categories

Every relevant TOML field and every runtime mutation must be classified before use.

1. **Observed/certified input**
   - Directly from APD/EDB/certification-like sources.
   - Examples: geometry, MZFW, fuel capacity, engine rated thrust, EDB LTO fuel-flow.

2. **Derived input**
   - Computed from observed data using transparent equations.
   - Examples: fuel density from fuel mass/volume, passenger weight from APD payload point divided by passenger count.

3. **Model assumption**
   - Required by TASOPT or mission modeling but not directly specified by public data.
   - Examples: reserves, cruise CL, detailed mission rules, some aerodynamic assumptions.

4. **Calibration knob**
   - An input explicitly allowed to vary during supervised calibration.
   - Must be approved before tuning and logged after every change.

5. **Validation target**
   - Held-out quantity used to assess model performance.
   - Includes MTOW, off-design payload-range points, EDB LTO thrust/fuel-flow, and takeoff field length if available.

Important rule: **MTOW is a validation target, not a calibration target.**

## 6. B737-800 design/sizing mission definition

The B737-800 model will be sized at the **selected-payload maximum-range point** on the APD highest-gross-weight payload-range line.

This point is:

- not the zero-range maximum payload point,
- not the max-payload range corner,
- not the zero-payload ferry range,
- but the maximum range for the selected sizing payload on the highest-gross-weight APD line.

This point is useful because it represents the mission capability the model must satisfy for the selected payload while operating near the fuel/MTOW constraint.

Payload-range points should be documented as:

1. Maximum structural payload.
2. Maximum-payload range corner.
3. Selected-payload maximum-range sizing point.
4. Zero-payload ferry range.
5. Any additional digitized off-design validation points.

## 7. Agent-driven architecture

The agent pipeline should be divided into specialized tasks. A single coding agent may implement these sequentially, but the responsibilities should remain distinct.

### 7.1 Data extraction agent

Responsibilities:

- Locate source documents.
- Record document title, revision, date, variant, page/table/figure numbers.
- Extract raw values and units.
- Digitize payload-range charts.
- Estimate digitization uncertainty and repeatability.
- Save raw and processed data under `TAS_VV/data/`.

Outputs:

- Raw data files.
- Processed CSV/JSON/TOML fragments.
- Extraction notes.
- Source ledger rows.

### 7.2 Provenance/classification agent

Responsibilities:

- Classify every data item and TOML field.
- Distinguish observed, derived, assumption, calibration, and validation target fields.
- Verify that all non-default TOML changes have ledger entries.
- Flag ambiguous or unclassified fields for human review.

Outputs:

- `references/data_ledger.csv` or equivalent.
- `references/input_classification.md`.
- Validation warnings for missing provenance.

### 7.3 TOML/model-building agent

Responsibilities:

- Start from the appropriate TASOPT template.
- Generate or update the aircraft TOML.
- Keep the TOML as the primary source of truth.
- Document any required post-load mutations.
- Avoid TASOPT source edits unless explicitly approved.

Outputs:

- Aircraft TOML files under `TAS_VV/models/`.
- TOML diff reports.
- Mapping from source data to TASOPT fields.

### 7.4 TASOPT execution agent

Responsibilities:

- Run Julia with `julia --project="/Users/aditeyashukla/Dropbox/Mac (2)/Documents/LAE/TASOPT.jl/"`.
- Load the aircraft with `read_aircraft_model`.
- Size with `size_aircraft!`.
- Evaluate off-design missions with `fly_mission!`.
- Export structured outputs.
- Detect convergence failures and infeasible missions.

Outputs:

- Sizing logs.
- Mission output CSVs.
- Payload-range curve outputs.
- LTO fuel-flow comparison outputs.

### 7.5 Validation/audit agent

Responsibilities:

- Compare TASOPT outputs to held-out validation targets.
- Separate digitization uncertainty from model error.
- Check MTOW, payload-range points, EDB LTO thrust/fuel-flow, and field length if available.
- Produce validation reports with clear pass/fail/needs-review labels.

Outputs:

- Validation tables.
- Error plots.
- Report markdown/PDF/HTML.
- Machine-readable validation summary.

### 7.6 Testing agent

Responsibilities:

- Add property-based and regression tests after each small step.
- Test unit conversions, weight bookkeeping, payload-range monotonicity, file-write boundaries, and provenance completeness.
- Ensure scripts are reproducible.

Outputs:

- Tests under `TAS_VV/tests/`.
- Test logs.
- CI-like local run scripts.

### 7.7 Reflection/documentation agent

Responsibilities:

- Write short reflections after each completed step.
- Summarize what changed, what was learned, what failed, and what is uncertain.
- Keep the project website and outline synchronized with actual progress.

Outputs:

- `TAS_VV/reflections/` notes.
- Website updates.
- Stage completion notes.

## 8. Pipeline stages

### Stage 0: TASOPT analysis and input classification

Goals:

- Understand TASOPT inputs, outputs, and mission execution.
- Create the data ledger format.
- Classify all baseline TOML fields.
- Define allowed calibration knobs.

Exit criteria:

- Data ledger template exists.
- TOML classification framework exists.
- Initial B737 source list exists.
- Validation target list is frozen for Stage 1.

### Stage 1A: Baseline B737-800 reconstruction with CFM56-7B

Goals:

- Extract B737-800 APD geometry, weights, fuel capacity, and payload-range points.
- Extract CFM56-7B-family EDB thrust/fuel-flow data.
- Build a baseline TASOPT TOML.
- Run initial sizing and mission evaluation.

Exit criteria:

- Baseline TOML runs without hidden mutations.
- Initial TASOPT outputs are exported.
- Differences from APD/EDB targets are quantified.

### Stage 1B: Supervised calibration using only approved knobs

Goals:

- If needed, adjust only pre-approved calibration knobs.
- Record every change with motivation and affected metrics.
- Do not tune MTOW directly.

Exit criteria:

- Calibration log is complete.
- The model satisfies basic feasibility constraints.
- Validation targets remain held out.

### Stage 1C: Baseline/calibrated B737 V&V

Goals:

- Validate MTOW.
- Validate off-design payload-range points.
- Validate EDB LTO thrust/fuel-flow.
- Validate takeoff field length if reliable public data exists.
- Report model error and data/digitization uncertainty separately.

Exit criteria:

- Validation report generated.
- Pass/fail/tolerance discussion completed.
- Limitations documented.

### Stage 1D: Optional constrained design optimization study

Goals:

- Optimize weighted multi-mission fuel burn only after V&V.
- Constrain known APD quantities such as span and fuel volume.
- Vary only undocumented/model-assumption variables or clearly declared design variables.

Important: This is not the primary validation case. The optimized aircraft is compared to the validated baseline, not treated as the real B737-800.

### Stage 2: Automated framework for other aircraft

Goals:

- Convert the supervised B737 process into reusable scripts and schemas.
- Define agent prompts/checklists.
- Support multiple aircraft classes and variants.

Exit criteria:

- New aircraft can be initialized from a data ledger.
- TOML generation and validation reports are mostly automated.

### Stage 3: B777-300ER with GE90

Goals:

- Apply the automated framework to a wide-body aircraft.
- Carefully handle aircraft and engine variants.
- Compare performance against APD payload-range and GE90 EDB fuel-flow data.

Exit criteria:

- B777-300ER validation report.
- Lessons learned comparing narrow-body and wide-body cases.

## 9. Tests and invariants

### Unit and conversion tests

- lbf ↔ N.
- kg mass ↔ N force using consistent gravity.
- nmi ↔ m.
- fuel volume/mass/density conversions.

### Weight bookkeeping tests

- `Wempty = WMTO - Wfuel - Wpay` where applicable.
- Off-design `WTO = Wempty + Wpay_mission + Wfuel_mission`.
- Feasible missions satisfy `Wfuel <= Wfmax`.

### Payload-range tests

- At fixed range, feasible payload should not increase when constraints become stricter.
- At fixed payload, feasible range should not increase when payload increases.
- Bisection methods should be deterministic within tolerance.

### Provenance tests

- Every non-default TOML field must have a ledger entry.
- Every calibration knob must have approval and a change log.
- Every validation target must be frozen before calibration.

### File boundary tests

- Scripts write only under `TAS_VV/` unless explicitly approved.
- TASOPT source files are not modified without user permission.

## 10. Deliverables

- Data ledger for each aircraft.
- Input classification report.
- Aircraft TOML files.
- Extraction scripts and notes.
- TASOPT run scripts.
- Validation comparison scripts.
- Property/regression tests.
- B737 V&V report.
- Website project page and reflections.
- Automated framework for follow-on aircraft.

## 11. Working directories and execution

Project workspace:

```text
/Users/aditeyashukla/Dropbox/Mac (2)/Documents/Developer/LAE_AI/TAS_VV
```

TASOPT repository:

```text
/Users/aditeyashukla/Dropbox/Mac (2)/Documents/LAE/TASOPT.jl/
```

Julia command:

```bash
julia --project="/Users/aditeyashukla/Dropbox/Mac (2)/Documents/LAE/TASOPT.jl/"
```

Rule: do not add/edit files in the TASOPT repository without explicit user permission, except for reading code/documentation.
