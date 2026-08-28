import type { Person } from "@/lib/types";

export const people: Person[] = [
  {
    id: "elena",
    name: "Elena Vasquez",
    team: "Executive",
    role: "executive",
    title: "Chief Business Officer",
  },
  {
    id: "priya",
    name: "Priya Shah",
    team: "Sales",
    role: "business",
    title: "Head of Sales, APAC",
  },
  {
    id: "daniel",
    name: "Daniel Okonkwo",
    team: "Risk",
    role: "risk",
    title: "Head of Credit Risk",
  },
  {
    id: "mei",
    name: "Mei Chen",
    team: "Finance",
    role: "finance",
    title: "FP&A Lead",
  },
  {
    id: "sofia",
    name: "Sofia Rahman",
    team: "Operations",
    role: "operations",
    title: "Lending Operations Manager",
  },
  {
    id: "james",
    name: "James Liu",
    team: "Product",
    role: "product",
    title: "Product Lead, Borrowers",
  },
  {
    id: "tomik",
    name: "Tomik Lee",
    team: "Malaysia Credit",
    role: "risk",
    title: "Malaysia Credit Manager",
  },
  {
    id: "arjun",
    name: "Arjun Patel",
    team: "Analytics",
    role: "analytics",
    title: "Metric Owner, Origination",
  },
  {
    id: "noura",
    name: "Noura Hassan",
    team: "Governance",
    role: "governance",
    title: "Data Governance Lead",
  },
];

export function findPersonByName(name: string): Person | undefined {
  const normalised = name.trim().toLowerCase();
  return people.find(
    (person) =>
      person.name.toLowerCase() === normalised ||
      person.name.toLowerCase().startsWith(normalised) ||
      person.team.toLowerCase() === normalised,
  );
}

export function getPerson(id: string): Person | undefined {
  return people.find((person) => person.id === id);
}
