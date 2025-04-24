import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import CollectionCard from "../components/CollectionCard"; // Adjust path as needed
import "@testing-library/jest-dom";

const mockCollection = {
  id: "col123",
  name: "My Favorite Comics",
  comicCount: 3,
};

describe("CollectionCard Component", () => {
  test("renders collection name and comic count", () => {
    render(
      <MemoryRouter>
        <CollectionCard
          id={mockCollection.id}
          name={mockCollection.name}
          comicCount={mockCollection.comicCount}
          onDelete={() => {}}
        />
      </MemoryRouter>
    );

    // Check name and comic count text
    expect(screen.getByText(/My Favorite Comics/i)).toBeInTheDocument();
    expect(screen.getByText(/3 comics/i)).toBeInTheDocument();
  });

  test("navigates to the correct link", () => {
    render(
      <MemoryRouter>
        <CollectionCard
          id={mockCollection.id}
          name={mockCollection.name}
          comicCount={mockCollection.comicCount}
          onDelete={() => {}}
        />
      </MemoryRouter>
    );

    const link = screen.getByRole("link", { name: /My Favorite Comics/i });
    expect(link).toHaveAttribute("href", `/collection/${mockCollection.id}`);
  });

  test("calls onDelete when delete button is clicked", () => {
    const mockOnDelete = vi.fn();

    render(
      <MemoryRouter>
        <CollectionCard
          id={mockCollection.id}
          name={mockCollection.name}
          comicCount={mockCollection.comicCount}
          onDelete={mockOnDelete}
        />
      </MemoryRouter>
    );

    // Click delete button
    fireEvent.click(screen.getByRole("button", { name: /Delete Collection/i }));

    // Expect delete handler called with correct ID
    expect(mockOnDelete).toHaveBeenCalledTimes(1);
    expect(mockOnDelete).toHaveBeenCalledWith(mockCollection.id);
  });

  test("does not call onDelete when clicking the card link", () => {
    const mockOnDelete = vi.fn();

    render(
      <MemoryRouter>
        <CollectionCard
          id={mockCollection.id}
          name={mockCollection.name}
          comicCount={mockCollection.comicCount}
          onDelete={mockOnDelete}
        />
      </MemoryRouter>
    );

    // Click the collection link (should not trigger delete)
    fireEvent.click(screen.getByRole("link", { name: /My Favorite Comics/i }));

    expect(mockOnDelete).not.toHaveBeenCalled();
  });
});
