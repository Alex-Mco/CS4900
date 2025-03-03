import React from "react";
import { render, screen } from "@testing-library/react";
import ComicDetails from "../components/ComicDetails"; // Adjust path as needed
import "@testing-library/jest-dom";


const mockComic = {
  _id: "101",
  title: "Spider-Man",
  description: "A story about Spider-Man.",
  creators: { items: [{ role: "Writer", name: "Stan Lee" }] }, // ✅ Fix applied here
  thumbnail: { path: "https://example.com/spiderman", extension: "jpg" },
  series: { name: "Amazing Spider-Man" },
};

describe("ComicDetails Component", () => {
  test("renders comic details correctly", () => {
    render(<ComicDetails comic={mockComic} />);

    expect(screen.getByRole("heading", { level: 2, name: /Spider-Man/i })).toBeInTheDocument();
    expect(screen.getByText(/A story about Spider-Man./i)).toBeInTheDocument();
    expect(screen.getByText(/Stan Lee/i)).toBeInTheDocument();
    expect(screen.getByText(/Creators/i)).toBeInTheDocument();
    expect(screen.getByText(/Amazing Spider-Man/i)).toBeInTheDocument();

  });

  test("renders comic image correctly", () => {
    render(<ComicDetails comic={mockComic} />);

    const img = screen.getByRole("img", { name: /spider-man/i });
    expect(img).toHaveAttribute("src", "https://example.com/spiderman.jpg");
  });

  test("renders series name correctly", () => {
    render(<ComicDetails comic={mockComic} />);

    expect(screen.getByText(/Amazing Spider-Man/i)).toBeInTheDocument();
  });
});