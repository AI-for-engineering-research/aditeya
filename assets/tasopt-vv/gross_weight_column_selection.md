# 737-800 APD gross-weight column selection

## User decisions

- Baseline airplane is treated as **737-800**, not 737-800W.
- APD operating empty weight is a validation target.
- Usable fuel capacity will be enforced through TASOPT wing/fuel geometry, not through a post-load cap.
- Sizing mission on the payload-range diagram is the second corner / third point of the line after max zero fuel weight and max brake-release gross weight, close to 3000 nmi.

## Selection method

The APD p. 2-4 general-characteristics table has multiple 737-800/-800W gross-weight columns. The payload-range diagram gives:

- max zero fuel weight: **138,300 lb** / **62,732 kg**
- max brake-release gross weight: **174,200 lb** / **79,000 kg**

We select the table column whose MZFW and max takeoff / brake-release gross weight match those payload-range diagram values.

## Result

The unique matching gross-weight column is option **C**:

| Quantity | Value |
|---|---:|
| max taxi weight | 174,700 lb |
| max takeoff / brake-release gross weight | 174,200 lb |
| max landing weight | 146,300 lb |
| max zero fuel weight | 138,300 lb |
| operating empty weight | 91,300 lb |
| max structural payload | 47,000 lb |
| usable fuel | 46,062 lb |

## Test

Implemented in:

- `tests/test_apd_gross_weight_column_selection.py`

Data files:

- `data/interim/737_800/extracted_tables/apd_737800_gross_weight_options.csv`
- `data/interim/737_800/digitized_figures/payload_range_diagram_constraints.csv`
