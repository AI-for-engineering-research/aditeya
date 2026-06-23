import csv
from pathlib import Path


OPTIONS = Path("data/interim/737_800/extracted_tables/apd_737800_gross_weight_options.csv")
CONSTRAINTS = Path("data/interim/737_800/digitized_figures/payload_range_diagram_constraints.csv")


def rows(path):
    with path.open(newline="") as f:
        return list(csv.DictReader(f))


def test_payload_range_diagram_identifies_single_gross_weight_column():
    options = rows(OPTIONS)
    constraints = {r["parameter"]: int(r["value_lb"]) for r in rows(CONSTRAINTS)}

    target_mzfw = constraints["max_zero_fuel_weight"]
    target_brgw = constraints["max_brake_release_gross_weight"]

    matches = [
        r for r in options
        if int(r["max_zero_fuel_weight_lb"]) == target_mzfw
        and int(r["max_takeoff_weight_lb"]) == target_brgw
    ]

    assert len(matches) == 1
    assert matches[0]["option_id"] == "C"
    assert int(matches[0]["max_taxi_weight_lb"]) == 174700
    assert int(matches[0]["max_landing_weight_lb"]) == 146300
    assert int(matches[0]["max_structural_payload_lb"]) == 47000


def test_payload_range_diagram_constraints_are_consistent_with_units():
    # Loose APD table consistency check: exact APD kg values are rounded, so use tolerance.
    lb_to_kg = 0.45359237
    for r in rows(CONSTRAINTS):
        assert abs(int(r["value_lb"]) * lb_to_kg - int(r["value_kg"])) < 100
