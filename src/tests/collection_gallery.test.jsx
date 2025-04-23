import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { vi } from 'vitest';
import axios from "axios";
import CollectionGallery from "../pages/collection_gallery";
import '@testing-library/jest-dom';

vi.mock("axios");

const mockUser = {
  _id: "user123",
  collections: [
    { _id: "col1", collectionName: "Marvel Comics" },
    { _id: "col2", collectionName: "DC Legends" },
  ],
};

describe("CollectionGallery Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("displays loading state initially", async () => {
    axios.get.mockResolvedValueOnce({ data: mockUser });

    render(
      <MemoryRouter>
        <CollectionGallery />
      </MemoryRouter>
    );

    expect(screen.getByText(/Loading.../i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("Collections")).toBeInTheDocument();
    });
  });

  test("renders user collections after fetching data", async () => {
    axios.get.mockResolvedValueOnce({ data: mockUser });

    render(
      <MemoryRouter>
        <CollectionGallery />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("Collections")).toBeInTheDocument();
      expect(screen.getByText("Marvel Comics")).toBeInTheDocument();
      expect(screen.getByText("DC Legends")).toBeInTheDocument();
    });
  });

  test("adds a new collection when button is clicked", async () => {
    axios.get.mockResolvedValueOnce({ data: mockUser });

    const updatedUser = {
      ...mockUser,
      collections: [...mockUser.collections, { _id: "col3", collectionName: "Star Wars" }],
    };

    axios.post.mockResolvedValueOnce({ data: updatedUser });

    render(
      <MemoryRouter>
        <CollectionGallery />
      </MemoryRouter>
    );

    await waitFor(() => screen.getByText("Marvel Comics"));

    fireEvent.change(screen.getByPlaceholderText("Enter title for new collection"), {
      target: { value: "Star Wars" },
    });

    fireEvent.click(screen.getByText("Add Collection"));

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith("http://localhost:8080/api/users/user123/collections", {
        collectionName: "Star Wars",
      });

      expect(screen.getByText("Star Wars")).toBeInTheDocument();
    });
  });

  test("handles error when adding a collection", async () => {
    axios.get.mockResolvedValueOnce({ data: mockUser });

    axios.post.mockRejectedValueOnce(new Error("Failed to add collection"));

    render(
      <MemoryRouter>
        <CollectionGallery />
      </MemoryRouter>
    );

    await waitFor(() => screen.getByText("Marvel Comics"));

    fireEvent.change(screen.getByPlaceholderText("Enter title for new collection"), {
      target: { value: "New Collection" },
    });

    fireEvent.click(screen.getByText("Add Collection"));

    await waitFor(() => {
      expect(screen.queryByText("New Collection")).not.toBeInTheDocument();
    });
  });
});
