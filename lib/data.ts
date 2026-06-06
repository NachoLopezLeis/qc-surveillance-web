import type { DemoData } from "./types";
import demo from "@/data/demo.json";

/** Datos precomputados por el pipeline (scripts/export_demo_json.py). */
export const demoData = demo as unknown as DemoData;
