import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { vi } from "vitest";
import ComicCard from "../components/ComicCard"; 
import "@testing-library/jest-dom";


const mockComic = {
  _id: "101",
  title: "Spider-Man",
  thumbnail: { path: "https://example.com/spiderman", extension: "jpg" },
};

describe("ComicCard Component", () => {
  test("renders comic thumbnail and title", () => {
    render(<ComicCard comic={mockComic} onSelect={() => {}} />);

    // Ensure the title is displayed
    expect(screen.getByText(/Spider-Man/i)).toBeInTheDocument();

    // Ensure the image is displayed with correct src
    const img = screen.getByRole("img", { name: /spider-man/i });
    expect(img).toHaveAttribute("src", "https://example.com/spiderman.jpg");
  });

  test("calls onSelect when clicked", () => {
    const mockOnSelect = vi.fn();
    render(<ComicCard comic={mockComic} onSelect={mockOnSelect} />);

    // Click the entire card
    fireEvent.click(screen.getByRole("img", { name: /spider-man/i }));

    // Ensure onSelect was called
    expect(mockOnSelect).toHaveBeenCalledTimes(1);
  });

  test("calls onRemove when remove button is clicked", () => {
    const mockOnRemove = vi.fn();
    render(<ComicCard comic={mockComic} onSelect={() => {}} showRemoveButton={true} onRemove={mockOnRemove} />);

    // Click the remove button
    fireEvent.click(screen.getByText(/Remove from Collection/i));

    // Ensure onRemove was called
    expect(mockOnRemove).toHaveBeenCalledTimes(1);
  });

  test("does not call onRemove when clicking the card", () => {
    const mockOnRemove = vi.fn();
    render(<ComicCard comic={mockComic} onSelect={() => {}} showRemoveButton={true} onRemove={mockOnRemove} />);

    // Click the comic card
    fireEvent.click(screen.getByRole("img", { name: /spider-man/i }));

    // Ensure onRemove was NOT called
    expect(mockOnRemove).not.toHaveBeenCalled();
  });
});
