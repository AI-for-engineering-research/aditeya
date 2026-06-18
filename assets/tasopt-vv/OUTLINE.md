# TASOPT V&V against real aircraft

This project seeks generate an automated pipeline to compare and validate TASOPT against real aircraft.

Using available data such as airport planning documents and emissions databank, the framework shall design and size and aircraft given its geometry, mission parameters (range and payload), and engine parameters. The validation will be against not only the weights (empty weight, WMTO, fuel weight), but more importantly match the aircraft mission requirements and performance. The main validation will be against the payload range diagrams and the emission databank points for the engine.

The goal should be to assimilate and verify all inputs for TASOPT that can be validated against real publically available data. No information should be made up to fit the validation. A perfect representation is not the goal. It is ok to be off by a couple percent, as long as the mission requirements are captured

The steps to design, size and validate the aircraft should be

1. **Get all relevant input and validation data**: Get airport planning documents, engine emissions databank, etc. and extract data from it. Relevent data includes geometry inputs, weights, payload range diagram. Determine what the design/sizing mission payload and range is. Additionally determine what the off design mission payload and ranges are going to be using the payload range diagram.
2. **Update input toml file**: After getting the data go through the baseline toml input file for TASOPT and update the inputs. Throughout the framework, the only changes in the code should be in the TOML input files, no changes in the TASOPT code itself. UNLESS a bug/error in the code is found and then we can fix it.

 - no TASOPT source edits without permission,
 - no hidden runtime mutations unless documented
 - scripts may mutate loaded ac for analysis, but those mutations must be reproducible and traceable.  

3. **Load aircraft model (`read_aircraft_model`) and size the aircraft (`size_aircraft!`), fly off design missions (`fly_mission!`)**
4. **Get baseline unoptimized output and compare to weights, payload range diagram, EDB**
5. **Calibrate only approved undocumented/model-assumption inputs if needed**: Revise only inputs whose provenance category permits calibration, record every change in the data ledger, identify which calibration target motivated the change, and re-run all validation metrics. MTOW is a validation target, not a calibration target.
6. **Validate the baseline/calibrated aircraft**: Compare against held-out weights including MTOW, off-design payload-range points, EDB LTO thrust/fuel-flow points, and takeoff field length if available.
7. **Optional design optimization study**: Optimize the aircraft to minimize weighted multi-mission fuel burn with constraints, but report this separately from V&V. The optimized aircraft is compared to the validated baseline, not treated as the real-aircraft validation case.

This project needs to be done carefully and slowly. After each small step we will stop and analyse. After each small step we will add thorough property based tests and write reflections and document it properly.

## Project stages

### Stage 0: TASOPT analysis and input classification

Each input in the TOML file needs to classified as:

1. Observed/certified inputs — APD geometry, MZFW, payload, fuel capacity, EDB fuel flow.
2. Derived inputs — passenger payload from APD payload point / pax count, fuel density from APD mass/volume.
3. Model assumptions — reserves, cruise CL etc.
4. Calibration knobs — inputs explicitly tuned to match outputs (TO BE DETERMINED).
5. Validation targets — held-out quantities used to assess the model, including MTOW, off-design payload-range points, EDB LTO thrust/fuel-flow points, and takeoff field length if available.

### Stage 1A: Baseline B737-800 reconstruction with CFM56-7B

Reconstruct a B737-800-like TASOPT model from APD/EDB data, derived quantities, and documented assumptions. The source of truth should be the TOML file plus any explicitly documented post-load mutations.

### Stage 1B: Supervised calibration using only approved knobs

If the baseline model misses required constraints or calibration targets, adjust only inputs classified as calibration knobs. Every adjustment must be recorded with source/provenance, motivation, and affected metrics. MTOW remains a validation target, not a calibration target.

### Stage 1C: Baseline/calibrated V&V for B737-800 with CFM56-7B

Validate the aircraft against held-out metrics: MTOW, off-design APD payload-range points, EDB LTO thrust/fuel-flow points, and takeoff field length if available. Report digitization uncertainty and model error separately.

### Stage 1D: Optional constrained design optimization study

After V&V, optimize only allowed undocumented/model-assumption variables or clearly declared design variables under constraints such as span, fuel volume, and mission feasibility. Report this as a design study relative to the validated baseline, not as the primary real-aircraft validation.

### Stage 2: Build automated framework to design, size and V&V other aircraft

### Stage 3: Automated V&V for a B777-300ER with GE90

### NOTES

Use `julia --project="/Users/aditeyashukla/Dropbox/Mac (2)/Documents/LAE/TASOPT.jl/"` to run TASOPT in julia. Save all relevant scripts, data in `"/Users/aditeyashukla/Dropbox/Mac (2)/Documents/Developer/LAE_AI/TAS_VV"`. Don't add/edit anything in `"/Users/aditeyashukla/Dropbox/Mac (2)/Documents/LAE/TASOPT.jl/"` without user permission.
