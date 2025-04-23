import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { vi } from 'vitest';
import axios from "axios";
import CollectionPage from "../pages/collection";
import '@testing-library/jest-dom';

vi.mock("axios"); // Mock Axios

const mockCollection = {
  _id: "1",
  collectionName: "SpiderMan Comics",
  comics: [
    {
      _id: "101",
      title: "Spider-Man",
      creators: [{ role: "Writer", name: "Stan Lee" }],
      description: "A story about Spider-Man.",
      thumbnail: {path: "/uploads/123432492987293875", extension: "jpg"}
    },
  ],
};

const mockComics = [
  {
    _id: "102",
    title: "Iron Man",
    creators: [{ role: "Writer", name: "Stan Lee" }],
  },
];

describe("CollectionPage Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    axios.get.mockImplementation((url) => {
        if (url.includes("/collections/")) {
            return Promise.resolve({ data: mockCollection });
          }
          if (url.includes("/comics")) {
            return Promise.resolve({ data: mockComics });
          }
          return Promise.reject(new Error("Not found"));
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  function renderWithRouter(id) {
    render(
      <MemoryRouter initialEntries={[`/collections/${id}`]}>
        <Routes>
          <Route path="/collections/:id" element={<CollectionPage />} />
        </Routes>
      </MemoryRouter>
    );
  }

  test("displays loading state initially", async () => {

    renderWithRouter("1");

    expect(screen.getByText(/Loading.../i)).toBeInTheDocument();

    expect(await screen.findByText(/SpiderMan Comics/i)).toBeInTheDocument();
  });

  test("renders collection details after fetching data", async () => {
    renderWithRouter("1");
  
    await waitFor(() => {
      expect(screen.getByText(/SpiderMan Comics/i)).toBeInTheDocument();
    });
  
    expect(screen.getByText(/Spider-Man/i)).toBeInTheDocument();
  
    fireEvent.click(screen.getByText(/Spider-Man/i));
  
    await waitFor(() => {
      expect(screen.getByText(/A story about Spider-Man./i)).toBeInTheDocument();
    });
  });
  

  test("Should delete a comic from collection", async () => {
    axios.delete.mockResolvedValueOnce({ status: 200 }); // Mock successful delete request

    renderWithRouter("1");

    // Wait for the collection to load
    await waitFor(() => {
      expect(screen.getByText("Spider-Man")).toBeInTheDocument();
    });

    // Mock confirmation dialog (ensure deletion proceeds)
    vi.spyOn(window, "confirm").mockReturnValue(true);

    // Find and click the "Remove" button inside ComicCard
    const removeButton = screen.getByRole("button", { name: /remove/i });
    fireEvent.click(removeButton);

    // Ensure Axios DELETE request was called
    await waitFor(() => {
      expect(axios.delete).toHaveBeenCalledWith(
        "http://localhost:8080/api/users/collections/1/comics/101"
      );
    });

    // Ensure comic is removed from UI
    await waitFor(() => {
      expect(screen.queryByText("Spider-Man")).not.toBeInTheDocument();
    });

    // Restore confirm mock to prevent side effects
    window.confirm.mockRestore();
  });
  
  test("Should delete the entire collection", async () => {
    axios.delete.mockResolvedValueOnce({ status: 200 }); // Mock collection deletion request

    renderWithRouter("1");

    // Wait for the collection to load
    await waitFor(() => {
      expect(screen.getByText("SpiderMan Comics")).toBeInTheDocument();
    });

    // Mock confirmation dialog
    vi.spyOn(window, "confirm").mockReturnValue(true);

    // Find and click the "Delete Collection" button
    const deleteCollectionButton = screen.getByRole("button", { name: /delete collection/i });
    fireEvent.click(deleteCollectionButton);

    // Ensure Axios DELETE request was called for the collection
    await waitFor(() => {
      expect(axios.delete).toHaveBeenCalledWith(
        "http://localhost:8080/api/users/collections/1"
      );
    });

    // Ensure navigation to /collections (checking for UI update)
    await waitFor(() => {
      expect(screen.queryByText("SpiderMan Comics")).not.toBeInTheDocument();
    });

    // Restore confirm mock
    window.confirm.mockRestore();
  });
});
