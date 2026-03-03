import { AcademicEvent } from "../../types";

export const events: AcademicEvent[] = [
  {
    id: "event-1",
    title: "AI in Healthcare Symposium",
    description:
      "Annual symposium exploring the intersection of artificial intelligence and clinical medicine.",
    date: "2026-03-15T09:00:00Z",
    endDate: "2026-03-15T17:00:00Z",
    location: "Medical Center, Auditorium",
    departmentId: "dept-5",
    type: "conference",
    isPublic: true,
  },
  {
    id: "event-2",
    title: "Distributed Systems Reading Group",
    description:
      "Weekly reading group discussing recent papers in distributed computing and consensus.",
    date: "2026-03-20T14:00:00Z",
    endDate: "2026-03-20T15:30:00Z",
    location: "Engineering 104",
    departmentId: "dept-1",
    type: "seminar",
    isPublic: false,
  },
  {
    id: "event-3",
    title: "Quantum Computing Guest Lecture",
    description:
      "Guest lecture by Dr. Maria Torres on topological quantum error correction.",
    date: "2026-04-02T16:00:00Z",
    endDate: "2026-04-02T17:30:00Z",
    location: "Physics 150",
    departmentId: "dept-4",
    type: "lecture",
    isPublic: true,
  },
  {
    id: "event-4",
    title: "Robotics Workshop: Sensor Fusion",
    description:
      "Hands-on workshop covering LiDAR, camera, and IMU fusion for autonomous navigation.",
    date: "2026-04-10T10:00:00Z",
    endDate: "2026-04-10T16:00:00Z",
    location: "Science 202",
    departmentId: "dept-2",
    type: "workshop",
    isPublic: true,
  },
  {
    id: "event-5",
    title: "Algebraic Geometry Colloquium",
    description:
      "Monthly colloquium series featuring talks on current research in algebraic geometry.",
    date: "2026-04-18T15:00:00Z",
    endDate: "2026-04-18T16:30:00Z",
    location: "Math Building, Room 380C",
    departmentId: "dept-3",
    type: "colloquium",
    isPublic: true,
  },
  {
    id: "event-6",
    title: "NLP Research Workshop",
    description:
      "Workshop on recent advances in large language models and their applications.",
    date: "2026-05-01T09:00:00Z",
    endDate: "2026-05-01T17:00:00Z",
    location: "Engineering 415",
    departmentId: "dept-1",
    type: "workshop",
    isPublic: true,
  },
  {
    id: "event-7",
    title: "Biomedical Data Ethics Seminar",
    description:
      "Discussion on ethical considerations in clinical data collection and algorithmic bias.",
    date: "2026-05-08T13:00:00Z",
    endDate: "2026-05-08T14:30:00Z",
    location: "Medical Center, Room 208",
    departmentId: "dept-5",
    type: "seminar",
    isPublic: true,
  },
  {
    id: "event-8",
    title: "Astrophysics Observation Night",
    description:
      "Public telescope observation event featuring guided tours of the spring night sky.",
    date: "2026-05-15T20:00:00Z",
    endDate: "2026-05-15T23:00:00Z",
    location: "University Observatory",
    departmentId: "dept-4",
    type: "lecture",
    isPublic: true,
  },
];
