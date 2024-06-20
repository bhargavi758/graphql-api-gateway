import { Department } from "../../types";

export const departments: Department[] = [
  {
    id: "dept-1",
    name: "Computer Science",
    code: "CS",
    description:
      "Research and education in computing, artificial intelligence, systems, and theory.",
    building: "Gates Building",
    headOfDepartmentId: "prof-1",
  },
  {
    id: "dept-2",
    name: "Electrical Engineering",
    code: "EE",
    description:
      "Advancing knowledge in circuits, signal processing, and embedded systems.",
    building: "Packard Building",
    headOfDepartmentId: "prof-3",
  },
  {
    id: "dept-3",
    name: "Mathematics",
    code: "MATH",
    description:
      "Pure and applied mathematics research spanning algebra, analysis, and topology.",
    building: "Building 380",
    headOfDepartmentId: "prof-5",
  },
  {
    id: "dept-4",
    name: "Physics",
    code: "PHYS",
    description:
      "Exploring fundamental laws of nature from particle physics to cosmology.",
    building: "Varian Physics Building",
    headOfDepartmentId: "prof-7",
  },
  {
    id: "dept-5",
    name: "Biomedical Informatics",
    code: "BMI",
    description:
      "Interdisciplinary research combining biomedicine with data science and AI.",
    building: "Li Ka Shing Center",
    headOfDepartmentId: "prof-9",
  },
];
